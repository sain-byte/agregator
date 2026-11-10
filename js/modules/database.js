const DatabaseModule = {
  activeSheetTab: 'agents',
  dataCache: {
    agents: [],
    schedule: [],
    kpi: []
  },

  async render(container) {
    const user = Auth.getUser();
    if (!user || user.role !== 'TL') {
      container.innerHTML = `
        <div class="glass-panel p-8 rounded-3xl text-center space-y-3 max-w-md mx-auto my-12">
          <div class="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <i data-lucide="lock" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-white">Akses Dibatasi</h3>
          <p class="text-xs text-slate-400">Modul Database Matrix ini khusus untuk akun ber-role <b>Team Leader (TL)</b>.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="space-y-5">
        <!-- HEADER & NAVIGATION TAB SHEET -->
        <div class="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-white/10">
          <div>
            <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
              <i data-lucide="table" class="w-4 h-4 text-brand-500"></i>
              Matrix Database GSheet
            </h3>
            <p class="text-[11px] text-slate-400">Tampilan tabel grid data entry realtime dari Google Sheets</p>
          </div>

          <!-- TAB SWITCHER -->
          <div class="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10 overflow-x-auto">
            <button onclick="DatabaseModule.switchSheetTab('agents')" id="db-tab-agents" 
                    class="px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap bg-brand-500 text-white shadow-sm">
              <i data-lucide="users" class="w-3.5 h-3.5 inline mr-1"></i> Sheet Agent
            </button>
            <button onclick="DatabaseModule.switchSheetTab('schedule')" id="db-tab-schedule" 
                    class="px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap text-slate-400 hover:text-white hover:bg-white/5">
              <i data-lucide="calendar" class="w-3.5 h-3.5 inline mr-1"></i> Sheet Schedule
            </button>
            <button onclick="DatabaseModule.switchSheetTab('kpi')" id="db-tab-kpi" 
                    class="px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap text-slate-400 hover:text-white hover:bg-white/5">
              <i data-lucide="bar-chart-3" class="w-3.5 h-3.5 inline mr-1"></i> Sheet KPI
            </button>
          </div>
        </div>

        <!-- CONTAINER MAIN CONTENT TABLE -->
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
        if (t === tab) {
          btn.className = "px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap bg-brand-500 text-white shadow-sm";
        } else {
          btn.className = "px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap text-slate-400 hover:text-white hover:bg-white/5";
        }
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

    await this.fetchAndRenderMatrix(tab, container);
  },

  async fetchAndRenderMatrix(tab, container) {
    let actionName = 'getStructure';
    if (tab === 'schedule') actionName = 'getSchedule';
    if (tab === 'kpi') actionName = 'getKPI';

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

      this.dataCache[tab] = rows;
      this.renderTableGrid(tab, rows, container);
    } catch (err) {
      container.innerHTML = `
        <div class="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold">
          Gagal mengambil data dari Sheet: ${err.message}
        </div>
      `;
    }
  },

  renderTableGrid(tab, rows, container) {
    let tableHeader = '';
    let tableBody = '';

    if (tab === 'agents') {
      tableHeader = `
        <tr class="bg-slate-900/90 text-slate-300 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider">
          <th class="p-3 text-left">Nama Agent</th>
          <th class="p-3 text-left">Role</th>
          <th class="p-3 text-left">Vendor</th>
          <th class="p-3 text-center">Batch</th>
          <th class="p-3 text-left">Team Leader</th>
          <th class="p-3 text-center">Aggregator</th>
          <th class="p-3 text-left">Tgl Lahir</th>
          <th class="p-3 text-left">Biodata</th>
        </tr>
      `;
      tableBody = rows.length > 0 ? rows.map(r => `
        <tr class="border-b border-white/5 hover:bg-white/5 transition text-xs">
          <td class="p-3 font-semibold text-white whitespace-nowrap">${r.nama || r.name || '-'}</td>
          <td class="p-3 whitespace-nowrap"><span class="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold text-[10px]">${r.role || 'Agent'}</span></td>
          <td class="p-3 text-slate-300 whitespace-nowrap">${r.vendor || r.mitra || '-'}</td>
          <td class="p-3 text-center text-slate-300">${r.batch || '-'}</td>
          <td class="p-3 text-slate-300 whitespace-nowrap">${r.tl || r.team_leader || '-'}</td>
          <td class="p-3 text-center font-bold text-amber-400">${r.aggregator || '-'}</td>
          <td class="p-3 text-slate-300 whitespace-nowrap">${r.tgl_lahir || r.tanggal_lahir || '-'}</td>
          <td class="p-3 text-slate-400 max-w-xs truncate">${r.biodata || r.keterangan || '-'}</td>
        </tr>
      `).join('') : `<tr><td colspan="8" class="p-4 text-center text-slate-500 italic text-xs">Belum ada data di Sheet Agent.</td></tr>`;
    } else if (tab === 'schedule') {
      tableHeader = `
        <tr class="bg-slate-900/90 text-slate-300 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider">
          <th class="p-3 text-left">Nama Agent</th>
          <th class="p-3 text-left">Tanggal</th>
          <th class="p-3 text-center">Shift</th>
          <th class="p-3 text-left">Keterangan</th>
        </tr>
      `;
      tableBody = rows.length > 0 ? rows.map(r => `
        <tr class="border-b border-white/5 hover:bg-white/5 transition text-xs">
          <td class="p-3 font-semibold text-white whitespace-nowrap">${r.nama || '-'}</td>
          <td class="p-3 text-slate-300 whitespace-nowrap">${r.tanggal || '-'}</td>
          <td class="p-3 text-center whitespace-nowrap"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">${r.shift || '-'}</span></td>
          <td class="p-3 text-slate-400">${r.keterangan || '-'}</td>
        </tr>
      `).join('') : `<tr><td colspan="4" class="p-4 text-center text-slate-500 italic text-xs">Belum ada data di Sheet Schedule.</td></tr>`;
    } else if (tab === 'kpi') {
      tableHeader = `
        <tr class="bg-slate-900/90 text-slate-300 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider">
          <th class="p-3 text-left">Nama Agent</th>
          <th class="p-3 text-left">Periode</th>
          <th class="p-3 text-center">Score Quality</th>
          <th class="p-3 text-center">Score Productivity</th>
        </tr>
      `;
      tableBody = rows.length > 0 ? rows.map(r => `
        <tr class="border-b border-white/5 hover:bg-white/5 transition text-xs">
          <td class="p-3 font-semibold text-white whitespace-nowrap">${r.nama || '-'}</td>
          <td class="p-3 text-slate-300 whitespace-nowrap">${r.periode || '-'}</td>
          <td class="p-3 text-center font-bold text-emerald-400">${r.quality || r.score_quality || '-'}%</td>
          <td class="p-3 text-center font-bold text-brand-400">${r.productivity || r.score_productivity || '-'}</td>
        </tr>
      `).join('') : `<tr><td colspan="4" class="p-4 text-center text-slate-500 italic text-xs">Belum ada data di Sheet KPI.</td></tr>`;
    }

    container.innerHTML = `
      <div class="glass-panel rounded-3xl overflow-hidden border border-white/10 space-y-4 p-4">
        <!-- TOP TOOLBAR TABEL & BUTTON TAMBAH -->
        <div class="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-300">Total Baris:</span>
            <span class="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold border border-brand-500/30">${rows.length}</span>
          </div>

          <button onclick="DatabaseModule.openAddRowModal('${tab}')" class="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-brand-glow flex items-center gap-1.5">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>+ Tambah Baris Baru</span>
          </button>
        </div>

        <!-- MATRIX SPREADSHEET TABLE GRID (SCROLLABLE HP) -->
        <div class="overflow-x-auto rounded-xl border border-white/10 max-h-[500px]">
          <table class="w-full text-left border-collapse">
            <thead>${tableHeader}</thead>
            <tbody>${tableBody}</tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  // MODAL INPUT DATA BARU SESUAI SHEET TAB
  openAddRowModal(tab) {
    let modal = document.getElementById('db-add-row-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'db-add-row-modal';
      modal.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    let formFields = '';
    let title = '';

    if (tab === 'agents') {
      title = 'Tambah Baris Baru (Sheet Agent)';
      formFields = `
        <div class="space-y-3 text-xs">
          <div><label class="block font-semibold mb-1">Nama Agent</label><input type="text" id="add-ag-nama" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
          <div><label class="block font-semibold mb-1">Role</label><select id="add-ag-role" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"><option value="Agent">Agent</option><option value="TL">Team Leader</option></select></div>
          <div class="grid grid-cols-2 gap-2">
            <div><label class="block font-semibold mb-1">Vendor</label><input type="text" id="add-ag-vendor" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
            <div><label class="block font-semibold mb-1">Batch</label><input type="text" id="add-ag-batch" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div><label class="block font-semibold mb-1">Team Leader</label><input type="text" id="add-ag-tl" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
            <div><label class="block font-semibold mb-1">Aggregator</label><input type="text" id="add-ag-agg" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
          </div>
          <div><label class="block font-semibold mb-1">Tanggal Lahir</label><input type="date" id="add-ag-tgl" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
          <div><label class="block font-semibold mb-1">Biodata / Ket</label><input type="text" id="add-ag-bio" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
        </div>
      `;
    } else if (tab === 'schedule') {
      title = 'Tambah Baris Baru (Sheet Schedule)';
      formFields = `
        <div class="space-y-3 text-xs">
          <div><label class="block font-semibold mb-1">Nama Agent</label><input type="text" id="add-sch-nama" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
          <div><label class="block font-semibold mb-1">Tanggal</label><input type="date" id="add-sch-tgl" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
          <div><label class="block font-semibold mb-1">Shift</label><select id="add-sch-shift" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"><option value="Morning">Morning</option><option value="Middle">Middle</option><option value="Night">Night</option><option value="OFF">OFF</option></select></div>
          <div><label class="block font-semibold mb-1">Keterangan</label><input type="text" id="add-sch-ket" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
        </div>
      `;
    } else if (tab === 'kpi') {
      title = 'Tambah Baris Baru (Sheet KPI)';
      formFields = `
        <div class="space-y-3 text-xs">
          <div><label class="block font-semibold mb-1">Nama Agent</label><input type="text" id="add-kpi-nama" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
          <div><label class="block font-semibold mb-1">Periode</label><input type="month" id="add-kpi-periode" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
          <div class="grid grid-cols-2 gap-2">
            <div><label class="block font-semibold mb-1">Score Quality (%)</label><input type="number" step="0.01" id="add-kpi-quality" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
            <div><label class="block font-semibold mb-1">Score Productivity</label><input type="number" step="0.01" id="add-kpi-prod" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"></div>
          </div>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="glass-panel border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <button onclick="document.getElementById('db-add-row-modal').classList.add('hidden')" class="absolute top-5 right-5 text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>

        <h3 class="text-sm font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
          <i data-lucide="plus-circle" class="w-4 h-4 text-brand-500"></i>
          ${title}
        </h3>

        <form onsubmit="DatabaseModule.saveRowData(event, '${tab}')" class="space-y-4">
          ${formFields}

          <div id="add-row-msg" class="hidden text-xs p-3 rounded-xl"></div>

          <button type="submit" id="btn-save-row" class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-brand-glow">
            Simpan Baris Baru Ke GSheet
          </button>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  async saveRowData(e, tab) {
    e.preventDefault();
    const msg = document.getElementById('add-row-msg');
    const btn = document.getElementById('btn-save-row');

    btn.innerText = "Menyimpan Ke Sheet...";
    btn.disabled = true;

    let action = 'saveAgent';
    let payload = {};

    if (tab === 'agents') {
      action = 'saveAgent';
      payload = {
        nama: document.getElementById('add-ag-nama').value,
        role: document.getElementById('add-ag-role').value,
        vendor: document.getElementById('add-ag-vendor').value,
        batch: document.getElementById('add-ag-batch').value,
        tl: document.getElementById('add-ag-tl').value,
        aggregator: document.getElementById('add-ag-agg').value,
        tgl_lahir: document.getElementById('add-ag-tgl').value,
        biodata: document.getElementById('add-ag-bio').value
      };
    } else if (tab === 'schedule') {
      action = 'saveSchedule';
      payload = {
        nama: document.getElementById('add-sch-nama').value,
        tanggal: document.getElementById('add-sch-tgl').value,
        shift: document.getElementById('add-sch-shift').value,
        keterangan: document.getElementById('add-sch-ket').value
      };
    } else if (tab === 'kpi') {
      action = 'saveKPI';
      payload = {
        nama: document.getElementById('add-kpi-nama').value,
        periode: document.getElementById('add-kpi-periode').value,
        quality: document.getElementById('add-kpi-quality').value,
        productivity: document.getElementById('add-kpi-prod').value
      };
    }

    try {
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action, ...payload })
      });

      const data = await res.json();
      if (data && (data.status === 'success' || data.result === 'success')) {
        msg.className = "text-xs p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
        msg.innerText = "✅ Baris data baru berhasil disimpan!";
        msg.classList.remove('hidden');

        setTimeout(() => {
          document.getElementById('db-add-row-modal').classList.add('hidden');
          this.switchSheetTab(tab);
        }, 1200);
      } else {
        throw new Error((data && data.message) || 'Gagal menyimpan data.');
      }
    } catch (err) {
      msg.className = "text-xs p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20";
      msg.innerText = "❌ Error: " + err.message;
      msg.classList.remove('hidden');
    } finally {
      btn.innerText = "Simpan Baris Baru Ke GSheet";
      btn.disabled = false;
    }
  }
};
