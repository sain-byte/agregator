const DatabaseModule = {
  sheets: [],
  activeSheet: '',
  headers: [],
  rows: [],

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
        <!-- HEADER & TABS BAR -->
        <div class="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-white/10">
          <div>
            <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
              <i data-lucide="database" class="w-4 h-4 text-brand-500"></i>
              Matrix Database GSheet
            </h3>
            <p class="text-[11px] text-slate-400">Kelola akun login (Users) & data master langsung dari tabel</p>
          </div>

          <div id="db-tabs-wrapper" class="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10 overflow-x-auto">
            <span class="text-xs text-slate-500 px-2">Memuat sheet...</span>
          </div>
        </div>

        <div id="db-matrix-content"></div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    await this.loadSheetsWhitelist();
  },

  async loadSheetsWhitelist() {
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

  async loadSheetContent(sheetName) {
    const user = Auth.getUser();
    const mainContent = document.getElementById('db-matrix-content');

    mainContent.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
        <i data-lucide="loader-2" class="w-7 h-7 animate-spin text-brand-500"></i>
        <p class="text-xs">Memuat data sheet "${sheetName}"...</p>
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

  renderSpreadsheetTable(container) {
    if (this.headers.length === 0) {
      container.innerHTML = `<div class="p-4 text-slate-500 text-xs italic">Sheet ini belum memiliki kolom header.</div>`;
      return;
    }

    let headerHtml = `
      <tr class="bg-slate-900/90 text-slate-300 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
        <th class="p-2.5 text-center w-10 border-r border-white/10 bg-slate-900">#</th>
        ${this.headers.map(h => `<th class="p-2.5 min-w-[140px] border-r border-white/10 last:border-r-0">${h}</th>`).join('')}
      </tr>
    `;

    let rowsHtml = this.rows.map((row, idx) => `
      <tr class="db-existing-row border-b border-white/5 hover:bg-slate-900/40 transition text-xs" data-row-index="${row._rowIndex}">
        <td class="p-2 text-center text-slate-500 font-mono font-bold bg-slate-900/30 border-r border-white/5">${row._rowIndex || (idx + 2)}</td>
        ${this.headers.map(h => `
          <td class="p-1 border-r border-white/5 last:border-r-0">
            <input type="text" 
                   data-header="${this.escapeHtml(h)}"
                   value="${this.escapeHtml(row[h] !== undefined ? row[h] : '')}"
                   class="cell-edit-input w-full bg-transparent px-2 py-1.5 text-slate-200 focus:text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded transition" 
                   placeholder="-">
          </td>
        `).join('')}
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="glass-panel p-4 rounded-3xl border border-white/10 space-y-4">
        <!-- TOP TOOLBAR STATUS & SAVE BUTTON -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div class="flex items-center gap-2 text-xs">
            <span class="text-slate-400 font-semibold">Total Baris Terdaftar:</span>
            <span id="db-total-count" class="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30">${this.rows.length}</span>
          </div>

          <button onclick="DatabaseModule.saveAllData()" id="btn-top-save" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Simpan Perubahan & Baris Baru</span>
          </button>
        </div>

        <div id="db-status-banner" class="hidden text-xs p-3 rounded-xl"></div>

        <!-- MATRIX SPREADSHEET TABLE -->
        <div class="overflow-x-auto rounded-2xl border border-white/10 max-h-[480px]">
          <table class="w-full text-left border-collapse">
            <thead>${headerHtml}</thead>
            <tbody id="db-table-body">
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- BOTTOM CONTROLS: ADD ROWS & BOTTOM SAVE BUTTON -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div class="flex items-center gap-2">
            <button onclick="DatabaseModule.addEmptyRows(1)" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-white/10 transition flex items-center gap-1.5">
              <i data-lucide="plus" class="w-4 h-4 text-emerald-400"></i>
              <span>+ 1 Baris Kosong</span>
            </button>
            <button onclick="DatabaseModule.addEmptyRows(5)" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl border border-white/10 transition flex items-center gap-1.5">
              <i data-lucide="plus-circle" class="w-4 h-4 text-amber-400"></i>
              <span>+ 5 Baris Kosong</span>
            </button>
          </div>

          <button onclick="DatabaseModule.saveAllData()" id="btn-bottom-save" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  // TAMBAH BARIS KOSONG KE DALAM TABEL (1 ATAU 5 BARIS)
  addEmptyRows(count = 1) {
    const tbody = document.getElementById('db-table-body');
    if (!tbody) return;

    const existingCount = tbody.querySelectorAll('tr').length;
    for (let c = 0; c < count; c++) {
      const rowNum = existingCount + c + 1;
      const tr = document.createElement('tr');
      tr.className = "db-new-append-row border-b-2 border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition text-xs";
      tr.innerHTML = `
        <td class="p-2 text-center text-emerald-400 font-mono font-bold border-r border-white/5">+${c + 1}</td>
        ${this.headers.map(h => `
          <td class="p-1 border-r border-white/5 last:border-r-0">
            <input type="text" 
                   data-header="${this.escapeHtml(h)}"
                   class="cell-new-input w-full bg-transparent px-2 py-1.5 text-emerald-300 placeholder-emerald-500/40 focus:text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded transition" 
                   placeholder="Isi data...">
          </td>
        `).join('')}
      `;
      tbody.appendChild(tr);
    }

    if (window.lucide) lucide.createIcons();
    
    // Auto scroll ke paling bawah tabel agar baris baru langsung kelihatan
    const scrollContainer = tbody.closest('.overflow-x-auto');
    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
  },

  // EKSEKUSI TOMBOL "SIMPAN PERUBAHAN"
  async saveAllData() {
    const user = Auth.getUser();
    const banner = document.getElementById('db-status-banner');
    const btnTop = document.getElementById('btn-top-save');
    const btnBottom = document.getElementById('btn-bottom-save');

    banner.className = "text-xs p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20";
    banner.innerText = "⏳ Menyimpan perubahan dan baris baru ke Google Sheet...";
    banner.classList.remove('hidden');

    if (btnTop) btnTop.disabled = true;
    if (btnBottom) btnBottom.disabled = true;

    try {
      // 1. KUMPULKAN BARIS BARU DARI INPUT BARIS KOSONG
      const newRowEls = document.querySelectorAll('.db-new-append-row');
      const newRowsData = [];

      newRowEls.forEach(row => {
        const rowObj = {};
        let hasContent = false;
        row.querySelectorAll('.cell-new-input').forEach(inp => {
          const h = inp.getAttribute('data-header');
          const val = inp.value.trim();
          if (val) {
            hasContent = true;
            rowObj[h] = val;
          }
        });
        if (hasContent) newRowsData.push(rowObj);
      });

      // 2. JIKA ADA BARIS BARU, KIRIM APPEND REQUEST
      if (newRowsData.length > 0) {
        const resAppend = await fetch(CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            action: 'appendRow',
            username: user.username,
            sheetName: this.activeSheet,
            rowData: JSON.stringify(newRowsData)
          })
        });
        const dataAppend = await resAppend.json();
        if (dataAppend.status !== 'success') {
          throw new Error(dataAppend.message || 'Gagal menyimpan baris baru.');
        }
      }

      banner.className = "text-xs p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      banner.innerText = `✅ Berhasil menyimpan perubahan ke Sheet "${this.activeSheet}"! Reloading data...`;

      // 3. REFRESH ISI SHEET AGAR BARIS BARU MENJADI BARIS RESMI
      setTimeout(() => {
        this.loadSheetContent(this.activeSheet);
      }, 1200);

    } catch (err) {
      banner.className = "text-xs p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20";
      banner.innerText = "❌ Error Simpan: " + err.message;
    } finally {
      if (btnTop) btnTop.disabled = false;
      if (btnBottom) btnBottom.disabled = false;
    }
  },

  escapeHtml(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
};
