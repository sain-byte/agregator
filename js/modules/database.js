const DatabaseModule = {
  activeSheetTab: 'agents',

  async render(container) {
    const user = Auth.getUser();
    if (!user || user.role !== 'TL') {
      container.innerHTML = `
        <div class="glass-panel p-8 rounded-3xl text-center space-y-3 max-w-md mx-auto my-12">
          <div class="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <i data-lucide="lock" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-white">Akses Dibatasi</h3>
          <p class="text-xs text-slate-400">Modul Database khusus role <b>Team Leader (TL)</b>.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="space-y-4">
        <div class="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-white/10">
          <div>
            <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
              <i data-lucide="table" class="w-4 h-4 text-brand-500"></i>
              Inline Matrix Database
            </h3>
            <p class="text-[11px] text-slate-400">Ketik & edit langsung di sel tabel ala Excel / GSheet</p>
          </div>

          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10 overflow-x-auto">
              <button onclick="DatabaseModule.switchSheetTab('agents')" id="db-tab-agents" 
                      class="px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap bg-brand-500 text-white shadow-sm">
                <i data-lucide="users" class="w-3.5 h-3.5 inline mr-1"></i> Agent
              </button>
              <button onclick="DatabaseModule.switchSheetTab('schedule')" id="db-tab-schedule" 
                      class="px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap text-slate-400 hover:text-white hover:bg-white/5">
                <i data-lucide="calendar" class="w-3.5 h-3.5 inline mr-1"></i> Schedule
              </button>
              <button onclick="DatabaseModule.switchSheetTab('kpi')" id="db-tab-kpi" 
                      class="px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap text-slate-400 hover:text-white hover:bg-white/5">
                <i data-lucide="bar-chart-3" class="w-3.5 h-3.5 inline mr-1"></i> KPI
              </button>
            </div>
          </div>
        </div>

        <div id="db-matrix-container"></div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    this.switchSheetTab(this.activeSheetTab);
  },

  async switchSheetTab(tab) {
    this.activeSheetTab = tab;
    ['agents', 'schedule', 'kpi'].forEach(t => {
      const btn = document.getElementById(`db-tab-${t}`);
      if (btn) {
        btn.className = t === tab 
          ? "px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap bg-brand-500 text-white shadow-sm"
          : "px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap text-slate-400 hover:text-white hover:bg-white/5";
      }
    });

    const container = document.getElementById('db-matrix-container');
    if (!container) return;

    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
        <i data-lucide="loader-2" class="w-7 h-7 animate-spin text-brand-500"></i>
        <p class="text-xs">Memuat tabel data dari Google Sheets...</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    await this.fetchAndRenderInlineGrid(tab, container);
  },

  async fetchAndRenderInlineGrid(tab, container) {
    let actionName = tab === 'schedule' ? 'getSchedule' : (tab === 'kpi' ? 'getKPI' : 'getStructure');

    try {
      const res = await fetch(`${CONFIG.API_URL}?action=${actionName}`);
      const data = await res.json();
      
      let rows = [];
      if (tab === 'agents') {
        const obj = data.data || data;
        const tls = obj.team_leaders || obj.tls || [];
        const ags = obj.agents || [];
        rows = Array.isArray(obj) ? obj : [...tls, ...ags];
      } else {
        rows = data.data || data.schedule || data.kpi || (Array.isArray(data) ? data : []);
      }

      this.renderEditableGrid(tab, rows, container);
    } catch (err) {
      this.renderEditableGrid(tab, [], container);
    }
  },

  renderEditableGrid(tab, rows, container) {
    let headers = [];
    if (tab === 'agents') {
      headers = ['Nama Agent', 'Role', 'Vendor', 'Batch', 'Team Leader', 'Aggregator', 'Tgl Lahir', 'Biodata'];
    } else if (tab === 'schedule') {
      headers = ['Nama Agent', 'Tanggal', 'Shift', 'Keterangan'];
    } else if (tab === 'kpi') {
      headers = ['Nama Agent', 'Periode', 'Quality (%)', 'Productivity'];
    }

    container.innerHTML = `
      <div class="glass-panel p-4 rounded-3xl border border-white/10 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-xs">
            <span class="text-slate-400 font-semibold">Total Baris:</span>
            <span id="db-row-count" class="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30">${rows.length}</span>
            <span class="text-[11px] text-amber-400 italic font-medium ml-2">💡 Sel tabel bisa diketik langsung!</span>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="DatabaseModule.addEmptyRow('${tab}')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-white/10 transition flex items-center gap-1.5">
              <i data-lucide="plus" class="w-4 h-4 text-emerald-400"></i>
              <span>+ Baris Kosong</span>
            </button>

            <button onclick="DatabaseModule.saveAllRows('${tab}')" id="btn-db-save-all" class="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-brand-glow flex items-center gap-1.5">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>

        <div id="db-status-banner" class="hidden text-xs p-3 rounded-xl"></div>

        <div class="overflow-x-auto rounded-xl border border-white/10 max-h-[520px]">
          <table class="w-full text-left border-collapse" id="db-matrix-table">
            <thead>
              <tr class="bg-slate-900/90 text-slate-300 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                <th class="p-2.5 text-center w-10 border-r border-white/10">#</th>
                ${headers.map(h => `<th class="p-2.5 min-w-[130px] border-r border-white/10 last:border-r-0">${h}</th>`).join('')}
                <th class="p-2.5 text-center w-10">Aksi</th>
              </tr>
            </thead>
            <tbody id="db-table-body">
              ${rows.length > 0 
                ? rows.map((r, idx) => this.createRowHtml(tab, r, idx + 1)).join('') 
                : this.createRowHtml(tab, {}, 1)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    this.updateRowCount();
  },

  createRowHtml(tab, r, num) {
    if (tab === 'agents') {
      return `
        <tr class="db-data-row border-b border-white/5 hover:bg-slate-900/40 transition text-xs">
          <td class="p-2 text-center text-slate-500 font-mono font-bold bg-slate-900/30 border-r border-white/5">${num}</td>
          <td class="p-1 border-r border-white/5"><input type="text" class="cell-nama w-full bg-transparent px-2 py-1.5 text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.nama || r.name || ''}" placeholder="Nama Agent"></td>
          <td class="p-1 border-r border-white/5">
            <select class="cell-role w-full bg-transparent px-1.5 py-1.5 text-brand-400 font-semibold focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded">
              <option value="Agent" ${!r.role || r.role === 'Agent' ? 'selected' : ''}>Agent</option>
              <option value="TL" ${r.role === 'TL' || r.is_tl ? 'selected' : ''}>TL</option>
            </select>
          </td>
          <td class="p-1 border-r border-white/5"><input type="text" class="cell-vendor w-full bg-transparent px-2 py-1.5 text-slate-300 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.vendor || r.mitra || ''}" placeholder="Vendor"></td>
          <td class="p-1 border-r border-white/5"><input type="text" class="cell-batch w-full bg-transparent px-2 py-1.5 text-slate-300 text-center focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.batch || ''}" placeholder="Batch"></td>
          <td class="p-1 border-r border-white/5"><input type="text" class="cell-tl w-full bg-transparent px-2 py-1.5 text-slate-300 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.tl || r.team_leader || ''}" placeholder="Team Leader"></td>
          <td class="p-1 border-r border-white/5"><input type="text" class="cell-agg w-full bg-transparent px-2 py-1.5 text-amber-400 font-bold text-center focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.aggregator || ''}" placeholder="1/2/3"></td>
          <td class="p-1 border-r border-white/5"><input type="date" class="cell-tgl w-full bg-transparent px-1.5 py-1.5 text-slate-300 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.tgl_lahir || r.tanggal_lahir || ''}"></td>
          <td class="p-1 border-r border-white/5"><input type="text" class="cell-bio w-full bg-transparent px-2 py-1.5 text-slate-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.biodata || r.keterangan || ''}" placeholder="Biodata"></td>
          <td class="p-1 text-center">
            <button onclick="this.closest('tr').remove(); DatabaseModule.updateRowCount();" class="p-1 text-slate-500 hover:text-red-400 transition" title="Hapus Baris">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        </tr>
      `;
    } else if (tab === 'schedule') {
      return `
        <tr class="db-data-row border-b border-white/5 hover:bg-slate-900/40 transition text-xs">
          <td class="p-2 text-center text-slate-500 font-mono font-bold bg-slate-900/30 border-r border-white/5">${num}</td>
          <td class="p-1 border-r border-white/5"><input type="text" class="cell-nama w-full bg-transparent px-2 py-1.5 text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.nama || ''}" placeholder="Nama Agent"></td>
          <td class="p-1 border-r border-white/5"><input type="date" class="cell-tgl w-full bg-transparent px-1.5 py-1.5 text-slate-300 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.tanggal || ''}"></td>
          <td class="p-1 border-r border-white/5">
            <select class="cell-shift w-full bg-transparent px-1.5 py-1.5 text-emerald-400 font-bold focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded">
              <option value="Morning" ${r.shift === 'Morning' ? 'selected' : ''}>Morning</option>
              <option value="Middle" ${r.shift === 'Middle' ? 'selected' : ''}>Middle</option>
              <option value="Night" ${r.shift === 'Night' ? 'selected' : ''}>Night</option>
              <option value="OFF" ${r.shift === 'OFF' ? 'selected' : ''}>OFF</option>
              <option value="Cuti" ${r.shift === 'Cuti' ? 'selected' : ''}>Cuti</option>
            </select>
          </td>
          <td class="p-1 border-r border-white/5"><input type="text" class="cell-ket w-full bg-transparent px-2 py-1.5 text-slate-400 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.keterangan || ''}" placeholder="Keterangan"></td>
          <td class="p-1 text-center">
            <button onclick="this.closest('tr').remove(); DatabaseModule.updateRowCount();" class="p-1 text-slate-500 hover:text-red-400 transition" title="Hapus Baris">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        </tr>
      `;
    } else if (tab === 'kpi') {
      return `
        <tr class="db-data-row border-b border-white/5 hover:bg-slate-900/40 transition text-xs">
          <td class="p-2 text-center text-slate-500 font-mono font-bold bg-slate-900/30 border-r border-white/5">${num}</td>
          <td class="p-1 border-r border-white/5"><input type="text" class="cell-nama w-full bg-transparent px-2 py-1.5 text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.nama || ''}" placeholder="Nama Agent"></td>
          <td class="p-1 border-r border-white/5"><input type="month" class="cell-periode w-full bg-transparent px-1.5 py-1.5 text-slate-300 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.periode || ''}"></td>
          <td class="p-1 border-r border-white/5"><input type="number" step="0.01" class="cell-quality w-full bg-transparent px-2 py-1.5 text-emerald-400 font-bold focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.quality || r.score_quality || ''}" placeholder="100"></td>
          <td class="p-1 border-r border-white/5"><input type="number" step="0.01" class="cell-prod w-full bg-transparent px-2 py-1.5 text-brand-400 font-bold focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded" value="${r.productivity || r.score_productivity || ''}" placeholder="95"></td>
          <td class="p-1 text-center">
            <button onclick="this.closest('tr').remove(); DatabaseModule.updateRowCount();" class="p-1 text-slate-500 hover:text-red-400 transition" title="Hapus Baris">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        </tr>
      `;
    }
  },

  addEmptyRow(tab) {
    const tbody = document.getElementById('db-table-body');
    if (!tbody) return;
    const nextNum = tbody.querySelectorAll('.db-data-row').length + 1;
    const tempDiv = document.createElement('tbody');
    tempDiv.innerHTML = this.createRowHtml(tab, {}, nextNum);
    tbody.appendChild(tempDiv.firstElementChild);
    if (window.lucide) lucide.createIcons();
    this.updateRowCount();
  },

  updateRowCount() {
    const rows = document.querySelectorAll('#db-table-body .db-data-row');
    const badge = document.getElementById('db-row-count');
    if (badge) badge.innerText = rows.length;
  },

  async saveAllRows(tab) {
    const btn = document.getElementById('btn-db-save-all');
    const banner = document.getElementById('db-status-banner');
    const rowEls = document.querySelectorAll('#db-table-body .db-data-row');

    btn.innerText = "Simpan Data...";
    btn.disabled = true;

    banner.className = "text-xs p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20";
    banner.innerText = "Mengirim data tabel ke Google Sheet...";
    banner.classList.remove('hidden');

    const dataList = [];
    rowEls.forEach(row => {
      const getVal = (cls) => {
        const el = row.querySelector('.' + cls);
        return el ? el.value.trim() : '';
      };

      if (tab === 'agents') {
        const nama = getVal('cell-nama');
        if (nama) {
          dataList.push({
            nama,
            role: getVal('cell-role'),
            vendor: getVal('cell-vendor'),
            batch: getVal('cell-batch'),
            tl: getVal('cell-tl'),
            aggregator: getVal('cell-agg'),
            tgl_lahir: getVal('cell-tgl'),
            biodata: getVal('cell-bio')
          });
        }
      } else if (tab === 'schedule') {
        const nama = getVal('cell-nama');
        if (nama) {
          dataList.push({
            nama,
            tanggal: getVal('cell-tgl'),
            shift: getVal('cell-shift'),
            keterangan: getVal('cell-ket')
          });
        }
      } else if (tab === 'kpi') {
        const nama = getVal('cell-nama');
        if (nama) {
          dataList.push({
            nama,
            periode: getVal('cell-periode'),
            quality: getVal('cell-quality'),
            productivity: getVal('cell-prod')
          });
        }
      }
    });

    let action = 'saveBulkAgents';
    if (tab === 'schedule') action = 'saveBulkSchedule';
    if (tab === 'kpi') action = 'saveBulkKPI';

    try {
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action,
          rows: JSON.stringify(dataList)
        })
      });

      const data = await res.json();
      if (data && (data.status === 'success' || data.result === 'success')) {
        banner.className = "text-xs p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
        banner.innerText = `✅ Berhasil menyimpan ${dataList.length} baris data ke Google Sheet!`;
      } else {
        throw new Error((data && data.message) || 'Gagal update Google Sheet');
      }
    } catch (err) {
      banner.className = "text-xs p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20";
      banner.innerText = "❌ Status Kirim: " + err.message;
    } finally {
      btn.innerText = "Simpan Perubahan";
      btn.disabled = false;
    }
  }
};
