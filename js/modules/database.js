const DatabaseModule = {
  activeSheetTab: 'agents',

  render(container) {
    const user = Auth.getUser();
    if (!user || user.role !== 'TL') {
      container.innerHTML = `
        <div class="glass-panel p-8 rounded-3xl text-center space-y-3 max-w-md mx-auto my-12">
          <div class="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <i data-lucide="lock" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-white">Akses Dibatasi</h3>
          <p class="text-xs text-slate-400">Modul Database & Data Entry ini khusus untuk akun ber-role <b>Team Leader (TL)</b>.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="space-y-6">
        <!-- HEADER SUB-TABS SHEET -->
        <div class="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-white/10">
          <div>
            <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
              <i data-lucide="database" class="w-4 h-4 text-brand-500"></i>
              Master Database & Data Entry
            </h3>
            <p class="text-[11px] text-slate-400">Pilih sheet di sebelah kanan untuk mulai entri / update data</p>
          </div>

          <!-- SUB SHEET TABS NAVIGATION -->
          <div class="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10 overflow-x-auto">
            <button onclick="DatabaseModule.switchSheetTab('agents')" id="db-tab-agents" 
                    class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap bg-brand-500 text-white shadow-sm">
              <i data-lucide="users" class="w-3.5 h-3.5 inline mr-1"></i> Sheet Agent
            </button>
            <button onclick="DatabaseModule.switchSheetTab('schedule')" id="db-tab-schedule" 
                    class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap text-slate-400 hover:text-white hover:bg-white/5">
              <i data-lucide="calendar" class="w-3.5 h-3.5 inline mr-1"></i> Sheet Schedule
            </button>
            <button onclick="DatabaseModule.switchSheetTab('kpi')" id="db-tab-kpi" 
                    class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap text-slate-400 hover:text-white hover:bg-white/5">
              <i data-lucide="bar-chart-3" class="w-3.5 h-3.5 inline mr-1"></i> Sheet KPI
            </button>
          </div>
        </div>

        <!-- CONTAINER SHEET ENTRY FORM & TABLE -->
        <div id="db-sheet-content"></div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    this.switchSheetTab(this.activeSheetTab);
  },

  switchSheetTab(tab) {
    this.activeSheetTab = tab;
    ['agents', 'schedule', 'kpi'].forEach(t => {
      const btn = document.getElementById(`db-tab-${t}`);
      if (btn) {
        if (t === tab) {
          btn.className = "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap bg-brand-500 text-white shadow-sm";
        } else {
          btn.className = "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap text-slate-400 hover:text-white hover:bg-white/5";
        }
      }
    });

    const content = document.getElementById('db-sheet-content');
    if (!content) return;

    if (tab === 'agents') this.renderAgentSheet(content);
    else if (tab === 'schedule') this.renderScheduleSheet(content);
    else if (tab === 'kpi') this.renderKPISheet(content);
  },

  // 1. SHEET AGENT ENTRY FORM
  renderAgentSheet(container) {
    container.innerHTML = `
      <div class="glass-panel p-6 rounded-3xl space-y-5 border border-white/10">
        <div class="border-b border-white/10 pb-3 flex items-center justify-between">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="user-plus" class="w-4 h-4 text-brand-500"></i>
            Entri Data Agent Baru / Update Agent
          </h4>
          <span class="text-[10px] text-brand-400 font-semibold px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/20">Sheet: Structure_Data</span>
        </div>

        <form onsubmit="DatabaseModule.handleAgentSubmit(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Nama Lengkap Agent</label>
            <input type="text" id="db-agent-nama" required placeholder="Contoh: Budi Santoso" 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Role / Jabatan</label>
            <select id="db-agent-role" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
              <option value="Agent">Agent</option>
              <option value="TL">Team Leader (TL)</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Vendor / Mitra</label>
            <input type="text" id="db-agent-vendor" placeholder="Mitracomm / Infomedia / dll" 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Batch</label>
            <input type="text" id="db-agent-batch" placeholder="1 / 2 / 3" 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Nama Team Leader (TL)</label>
            <input type="text" id="db-agent-tl" placeholder="Nama TL Penanggungjawab" 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">No Agregator</label>
            <input type="text" id="db-agent-agg" placeholder="1 / 2 / 3" 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Tanggal Lahir</label>
            <input type="date" id="db-agent-tgl" 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Biodata / Keterangan</label>
            <input type="text" id="db-agent-bio" placeholder="Keterangan singkat..." 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div class="md:col-span-2 pt-2">
            <div id="db-agent-msg" class="hidden text-xs p-3 rounded-xl mb-3"></div>
            <button type="submit" id="btn-db-agent-save" 
                    class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl transition shadow-lg shadow-brand-glow flex items-center justify-center gap-2">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Simpan Data Ke Sheet Agent</span>
            </button>
          </div>
        </form>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  // 2. SHEET SCHEDULE ENTRY FORM
  renderScheduleSheet(container) {
    container.innerHTML = `
      <div class="glass-panel p-6 rounded-3xl space-y-5 border border-white/10">
        <div class="border-b border-white/10 pb-3 flex items-center justify-between">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="calendar-plus" class="w-4 h-4 text-brand-500"></i>
            Entri Jadwal Shift Agent
          </h4>
          <span class="text-[10px] text-brand-400 font-semibold px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/20">Sheet: Schedule_Data</span>
        </div>

        <form onsubmit="DatabaseModule.handleScheduleSubmit(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Nama Agent</label>
            <input type="text" id="db-sch-nama" required placeholder="Nama Agent" 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Tanggal</label>
            <input type="date" id="db-sch-tgl" required 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Status Shift / OFF</label>
            <select id="db-sch-shift" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
              <option value="Morning">Morning (Pagi)</option>
              <option value="Middle">Middle (Siang)</option>
              <option value="Night">Night (Malam)</option>
              <option value="OFF">OFF (Libur)</option>
              <option value="Cuti">Cuti</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Keterangan Tambahan</label>
            <input type="text" id="db-sch-ket" placeholder="Catatan opsional..." 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div class="md:col-span-2 pt-2">
            <div id="db-sch-msg" class="hidden text-xs p-3 rounded-xl mb-3"></div>
            <button type="submit" id="btn-db-sch-save" 
                    class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl transition shadow-lg shadow-brand-glow flex items-center justify-center gap-2">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Simpan Jadwal Ke Sheet Schedule</span>
            </button>
          </div>
        </form>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  // 3. SHEET KPI ENTRY FORM
  renderKPISheet(container) {
    container.innerHTML = `
      <div class="glass-panel p-6 rounded-3xl space-y-5 border border-white/10">
        <div class="border-b border-white/10 pb-3 flex items-center justify-between">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="bar-chart-2" class="w-4 h-4 text-brand-500"></i>
            Entri Nilai KPI Performance
          </h4>
          <span class="text-[10px] text-brand-400 font-semibold px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/20">Sheet: KPI_Data</span>
        </div>

        <form onsubmit="DatabaseModule.handleKPISubmit(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Nama Agent</label>
            <input type="text" id="db-kpi-nama" required placeholder="Nama Agent" 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Bulan / Periode</label>
            <input type="month" id="db-kpi-periode" required 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Score Quality (%)</label>
            <input type="number" step="0.01" id="db-kpi-quality" placeholder="100" 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div>
            <label class="block font-semibold text-slate-300 mb-1">Score Productivity / Handling</label>
            <input type="number" step="0.01" id="db-kpi-prod" placeholder="95" 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-500 transition">
          </div>

          <div class="md:col-span-2 pt-2">
            <div id="db-kpi-msg" class="hidden text-xs p-3 rounded-xl mb-3"></div>
            <button type="submit" id="btn-db-kpi-save" 
                    class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl transition shadow-lg shadow-brand-glow flex items-center justify-center gap-2">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Simpan Data Ke Sheet KPI</span>
            </button>
          </div>
        </form>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  // SUBMIT HANDLERS
  async handleAgentSubmit(e) {
    e.preventDefault();
    this.sendData('saveAgent', {
      nama: document.getElementById('db-agent-nama').value,
      role: document.getElementById('db-agent-role').value,
      vendor: document.getElementById('db-agent-vendor').value,
      batch: document.getElementById('db-agent-batch').value,
      tl: document.getElementById('db-agent-tl').value,
      aggregator: document.getElementById('db-agent-agg').value,
      tgl_lahir: document.getElementById('db-agent-tgl').value,
      biodata: document.getElementById('db-agent-bio').value
    }, 'db-agent-msg', 'btn-db-agent-save');
  },

  async handleScheduleSubmit(e) {
    e.preventDefault();
    this.sendData('saveSchedule', {
      nama: document.getElementById('db-sch-nama').value,
      tanggal: document.getElementById('db-sch-tgl').value,
      shift: document.getElementById('db-sch-shift').value,
      keterangan: document.getElementById('db-sch-ket').value
    }, 'db-sch-msg', 'btn-db-sch-save');
  },

  async handleKPISubmit(e) {
    e.preventDefault();
    this.sendData('saveKPI', {
      nama: document.getElementById('db-kpi-nama').value,
      periode: document.getElementById('db-kpi-periode').value,
      quality: document.getElementById('db-kpi-quality').value,
      productivity: document.getElementById('db-kpi-prod').value
    }, 'db-kpi-msg', 'btn-db-kpi-save');
  },

  async sendData(action, payload, msgId, btnId) {
    const msg = document.getElementById(msgId);
    const btn = document.getElementById(btnId);
    const oldBtnText = btn.innerHTML;

    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-1"></i> Menyimpan...`;
    btn.disabled = true;

    try {
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action, ...payload })
      });

      const data = await res.json();
      if (data && (data.status === 'success' || data.result === 'success')) {
        msg.className = "text-xs p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
        msg.innerText = "✅ Data berhasil disimpan langsung ke Google Sheet!";
        msg.classList.remove('hidden');
      } else {
        throw new Error((data && data.message) || 'Gagal menyimpan data.');
      }
    } catch (err) {
      msg.className = "text-xs p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20";
      msg.innerText = "❌ Status: " + err.message;
      msg.classList.remove('hidden');
    } finally {
      btn.innerHTML = oldBtnText;
      btn.disabled = false;
      if (window.lucide) lucide.createIcons();
    }
  }
};
