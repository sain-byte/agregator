const DatabaseModule = {
  sheets: [],
  activeSheet: '',
  headers: [],
  rows: [],
  isSaving: false,

  async render(container) {
    const user = Auth.getUser();
    if (!user || user.role !== 'TL') {
      container.innerHTML = `
        <div class="glass-panel p-8 rounded-3xl text-center space-y-3 max-w-md mx-auto my-12 border border-white/10">
          <div class="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <i data-lucide="lock" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-white">Akses Dibatasi</h3>
          <p class="text-xs text-slate-400">Modul Master Database Matrix ini khusus untuk akun ber-role <b>Team Leader (TL)</b>.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="space-y-4">
        <!-- HEADER & DYNAMIC TABS BAR -->
        <div class="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-white/10">
          <div class="flex items-center gap-3">
            <div>
              <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
                <i data-lucide="database" class="w-4 h-4 text-brand-500"></i>
                Matrix Database GSheet
              </h3>
              <p class="text-[11px] text-slate-400">Tabel interaktif & sync otomatis per sel</p>
            </div>
            <!-- STATUS INDIKATOR AUTO-SAVE -->
            <div id="db-sync-indicator" class="hidden items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-white/10">
              <span id="db-sync-dot" class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span id="db-sync-text" class="text-slate-300">Tersimpan</span>
            </div>
          </div>

          <!-- CONTAINER TAB SHEET DINAMIS -->
          <div id="db-tabs-wrapper" class="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10 overflow-x-auto">
            <span class="text-xs text-slate-500 px-2">Memuat sheet...</span>
          </div>
        </div>

        <!-- MAIN TABLE CONTAINER -->
        <div id="db-matrix-content"></div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    await this.loadSheetsWhitelist(container);
  },

  // 1. FETCH DAFTAR SHEET WHITELIST DARI BACKEND
  async loadSheetsWhitelist(container) {
    const user = Auth.getUser();
    const tabsWrapper = document.getElementById('db-tabs-wrapper');

    try {
      const res = await fetch(`${CONFIG.API_URL}?action=getSheets&username=${encodeURIComponent(user.username)}`);
      const data = await res.json();

      if (data.status === 'success' && Array.isArray(data.sheets) && data.sheets.length > 0) {
        this.sheets = data.sheets;
        this.activeSheet = this.sheets[0];

        tabsWrapper.innerHTML = this.sheets.map(sh => `
          <button onclick="DatabaseModule.switchSheet('${sh}')" id="db-tab-${sh}" 
                  class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${sh === this.activeSheet ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 inline mr-1"></i> ${sh}
          </button>
        `).join('');

        if (window.lucide) lucide.createIcons();
        await this.loadSheetContent(this.activeSheet);
      } else {
        throw new Error(data.message || 'Tidak ada sheet yang dapat diakses');
      }
    } catch (err) {
      if (tabsWrapper) tabsWrapper.innerHTML = `<span class="text-xs text-red-400 p-1">${err.message}</span>`;
    }
  },

  // 2. SWITCH TAB SHEET
  async switchSheet(sheetName) {
    if (this.activeSheet === sheetName) return;
    this.activeSheet = sheetName;

    this.sheets.forEach(sh => {
      const btn = document.getElementById(`db-tab-${sh}`);
      if (btn) {
        btn.className = sh === sheetName 
          ? "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap bg-brand-500 text-white shadow-sm"
          : "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap text-slate-400 hover:text-white hover:bg-white/5";
      }
    });

    await this.loadSheetContent(sheetName);
  },

  // 3. FETCH DATA ISI SHEET
  async loadSheetContent(sheetName) {
    const user = Auth.getUser();
    const mainContent = document.getElementById('db-matrix-content');

    mainContent.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
        <i data-lucide="loader-2" class="w-7 h-7 animate-spin text-brand-500"></i>
        <p class="text-xs">Memuat lembar kerja "${sheetName}"...</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    try {
      const res = await fetch(`${CONFIG.API_URL}?action=getSheetData&username=${encodeURIComponent(user.username)}&sheetName=${encodeURIComponent(sheetName)}`);
      const data = await res.json();

      if (data.status === 'success') {
        this.headers = data.headers || [];
        this.rows = data.rows || [];
        this.renderSpreadsheetTable(mainContent);
      } else {
        throw new Error(data.message || 'Gagal memuat isi sheet');
      }
    } catch (err) {
      mainContent.innerHTML = `
        <div class="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold">
          ❌ Error: ${err.message}
        </div>
      `;
    }
  },

  // 4. RENDER MATRIX SPREADSHEET TABLE
  renderSpreadsheetTable(container) {
    if (this.headers.length === 0) {
      container.innerHTML = `<div class="p-4 text-slate-500 text-xs italic">Sheet ini masih kosong (belum ada kolom header).</div>`;
      return;
    }

    let headerHtml = `
      <tr class="bg-slate-900/90 text-slate-300 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
        <th class="p-2.5 text-center w-10 border-r border-white/10 bg-slate-900">#</th>
        ${this.headers.map(h => `<th class="p-2.5 min-w-[140px] border-r border-white/10 last:border-r-0">${h}</th>`).join('')}
      </tr>
    `;

    let rowsHtml = this.rows.map((row, idx) => `
      <tr class="border-b border-white/5 hover:bg-slate-900/40 transition text-xs">
        <td class="p-2 text-center text-slate-500 font-mono font-bold bg-slate-900/30 border-r border-white/5">${row._rowIndex || (idx + 2)}</td>
        ${this.headers.map(h => `
          <td class="p-1 border-r border-white/5 last:border-r-0">
            <input type="text" 
                   value="${this.escapeHtml(row[h] !== undefined ? row[h] : '')}"
                   onblur="DatabaseModule.handleCellBlur(this, ${row._rowIndex || (idx + 2)}, '${this.escapeHtml(h)}')"
                   class="w-full bg-transparent px-2 py-1.5 text-slate-200 focus:text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded transition" 
                   placeholder="-">
          </td>
        `).join('')}
      </tr>
    `).join('');

    // BARIS KOSONG PALING BAWAH (UNTUK APPEND BARIS BARU)
    let emptyRowHtml = `
      <tr id="db-empty-append-row" class="border-b-2 border-dashed border-brand-500/30 bg-brand-500/5 hover:bg-brand-500/10 transition text-xs">
        <td class="p-2 text-center text-brand-400 font-mono font-bold border-r border-white/5">+</td>
        ${this.headers.map(h => `
          <td class="p-1 border-r border-white/5 last:border-r-0">
            <input type="text" 
                   data-header="${this.escapeHtml(h)}"
                   onblur="DatabaseModule.checkAppendRowBlur()"
                   class="cell-append-input w-full bg-transparent px-2 py-1.5 text-brand-300 placeholder-brand-500/40 focus:text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded transition" 
                   placeholder="Ketik baris baru...">
          </td>
        `).join('')}
      </tr>
    `;

    container.innerHTML = `
      <div class="glass-panel p-4 rounded-3xl border border-white/10 space-y-3">
        <div class="flex items-center justify-between text-xs px-1">
          <div class="flex items-center gap-2">
            <span class="text-slate-400 font-semibold">Total Baris:</span>
            <span id="db-total-rows-count" class="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30">${this.rows.length}</span>
          </div>
          <span class="text-[11px] text-amber-400 font-medium italic">💡 Ketik & klik luar sel untuk auto-save. Ketik di baris paling bawah (+) untuk tambah data baru.</span>
        </div>

        <div class="overflow-x-auto rounded-2xl border border-white/10 max-h-[550px]">
          <table class="w-full text-left border-collapse">
            <thead>${headerHtml}</thead>
            <tbody id="db-table-body">
              ${rowsHtml}
              ${emptyRowHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  // 5. EVENT AUTO-SAVE PER SEL
  async handleCellBlur(inputEl, rowIndex, colHeader) {
    const newValue = inputEl.value;
    const user = Auth.getUser();

    this.showSyncStatus('saving', 'Menyimpan sel...');

    try {
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'saveCell',
          username: user.username,
          sheetName: this.activeSheet,
          rowIndex: rowIndex,
          colHeader: colHeader,
          value: newValue
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        this.showSyncStatus('saved', '✓ Tersimpan');
      } else {
        throw new Error(data.message || 'Gagal menyimpan sel');
      }
    } catch (err) {
      this.showSyncStatus('error', '❌ ' + err.message);
    }
  },

  // 6. EVENT AUTO-APPEND BARIS BARU DARI BARIS KOSONG
  async checkAppendRowBlur() {
    const inputs = document.querySelectorAll('.cell-append-input');
    const rowData = {};
    let hasValue = false;

    inputs.forEach(inp => {
      const header = inp.getAttribute('data-header');
      const val = inp.value.trim();
      if (val) {
        hasValue = true;
        rowData[header] = val;
      }
    });

    if (!hasValue || this.isSaving) return;

    this.isSaving = true;
    const user = Auth.getUser();
    this.showSyncStatus('saving', 'Membuat baris baru...');

    try {
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'appendRow',
          username: user.username,
          sheetName: this.activeSheet,
          rowData: JSON.stringify(rowData)
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        this.showSyncStatus('saved', '✓ Baris Baru Dibuat');
        // Refresh isi tabel agar baris baru berubah jadi baris aktif ber-ID
        await this.loadSheetContent(this.activeSheet);
      } else {
        throw new Error(data.message || 'Gagal menambah baris');
      }
    } catch (err) {
      this.showSyncStatus('error', '❌ ' + err.message);
    } finally {
      this.isSaving = false;
    }
  },

  // HELPER INDIKATOR STATUS AUTO-SAVE
  showSyncStatus(type, text) {
    const indicator = document.getElementById('db-sync-indicator');
    const dot = document.getElementById('db-sync-dot');
    const label = document.getElementById('db-sync-text');

    if (!indicator || !dot || !label) return;

    indicator.classList.remove('hidden');
    indicator.classList.add('flex');

    if (type === 'saving') {
      dot.className = "w-2 h-2 rounded-full bg-amber-400 animate-ping";
      label.className = "text-amber-400 font-semibold";
    } else if (type === 'saved') {
      dot.className = "w-2 h-2 rounded-full bg-emerald-400";
      label.className = "text-emerald-400 font-semibold";
      setTimeout(() => {
        indicator.classList.add('hidden');
        indicator.classList.remove('flex');
      }, 2500);
    } else if (type === 'error') {
      dot.className = "w-2 h-2 rounded-full bg-red-400";
      label.className = "text-red-400 font-semibold";
    }
    label.innerText = text;
  },

  escapeHtml(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
};
