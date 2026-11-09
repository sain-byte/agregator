const KPIModule = {
  currentYear: new Date().getFullYear().toString(),
  currentMonth: "",
  currentWeek: "",
  currentSection: "",
  templateVersion: 1, // 1 = Split (20%/20%), 2 = Total Prod (40%)
  showRank: JSON.parse(localStorage.getItem("KPI_SHOW_RANK")) ?? true,
  qaTargetDefault: 90,
  attTargetDefault: 100,
  rawKPIData: [],
  targetsMap: {},
  dirtyRows: {},
  
  // Custom Header Labels
  customHeaders: JSON.parse(localStorage.getItem("KPI_HEADER_LABELS")) || {
    prod_kapture: "Prod Kapture",
    prod_sociomile: "Prod Sociomile",
    qa_score: "QA Score",
    attandence: "Attendance",
    keterangan_1: "Catatan 1",
    keterangan_2: "Catatan 2",
    keterangan_3: "Catatan 3"
  },

  async render(container) {
    const user = Auth.getUser();
    const isTL = user && (user.role === "TL" || String(user.role).toUpperCase().includes("LEADER"));
    this.dirtyRows = {};

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- HEADER CONTROL BAR -->
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xl">
          
          <!-- FILTERS & RUMUS SWITCHER -->
          <div class="flex flex-wrap items-center gap-3">
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Tahun</label>
              <select id="kpi-filter-year" onchange="KPIModule.onFilterChange()" 
                      class="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-semibold">
                <option value="2026" selected>2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Bulan</label>
              <select id="kpi-filter-month" onchange="KPIModule.onFilterChange()" 
                      class="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-semibold">
                <option value="">-- Semua Bulan --</option>
                <option value="Januari">Januari</option>
                <option value="Februari">Februari</option>
                <option value="Maret">Maret</option>
                <option value="April">April</option>
                <option value="Mei">Mei</option>
                <option value="Juni">Juni</option>
                <option value="Juli">Juli</option>
                <option value="Agustus">Agustus</option>
                <option value="September">September</option>
                <option value="Oktober">Oktober</option>
                <option value="November">November</option>
                <option value="Desember">Desember</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Week (W)</label>
              <input type="number" id="kpi-filter-week" placeholder="All" onchange="KPIModule.onFilterChange()"
                     class="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-semibold w-16">
            </div>

            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Section</label>
              <select id="kpi-filter-section" onchange="KPIModule.onFilterChange()" 
                      class="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-semibold">
                <option value="">-- Semua Section --</option>
                <option value="Agregator">Agregator</option>
                <option value="Customer Care">Customer Care</option>
              </select>
            </div>

            <!-- TEMPLATE RUMUS SWITCHER -->
            <div class="pl-2 border-l border-slate-700/80">
              <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Rumus KPI</label>
              <div class="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-700">
                <button onclick="KPIModule.setTemplateVersion(1)" id="btn-tpl-1" 
                        class="px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${this.templateVersion === 1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                  Tpl 1 (20/20)
                </button>
                <button onclick="KPIModule.setTemplateVersion(2)" id="btn-tpl-2" 
                        class="px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${this.templateVersion === 2 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                  Tpl 2 (Total 40)
                </button>
              </div>
            </div>
          </div>

          <!-- ACTION BUTTONS -->
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="KPIModule.openHeaderModal()" title="Kustomisasi Header & Ranking"
                    class="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition border border-slate-600 flex items-center gap-2 text-xs font-semibold">
              <i data-lucide="settings-2" class="w-4 h-4 text-blue-400"></i>
              <span>Setting UI</span>
            </button>

            ${isTL ? `
              <button id="btn-kpi-save" onclick="KPIModule.saveAllChanges()" disabled
                      class="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-slate-500 text-xs font-bold rounded-xl transition cursor-not-allowed shadow-lg">
                <i data-lucide="save" class="w-4 h-4"></i>
                Simpan KPI
              </button>
            ` : ''}

            <!-- EXPORT DROPDOWN -->
            <div class="relative inline-block text-left">
              <button onclick="KPIModule.toggleExportMenu()" 
                      class="flex items-center gap-2 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition border border-slate-600">
                <i data-lucide="download" class="w-4 h-4 text-emerald-400"></i>
                Export
                <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
              </button>

              <div id="export-kpi-dropdown" class="origin-top-right absolute right-0 mt-2 w-44 rounded-xl shadow-2xl bg-slate-800 border border-slate-700 hidden z-50 overflow-hidden">
                <div class="py-1">
                  <button onclick="KPIModule.exportExcel()" class="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2.5">
                    <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-400"></i> Excel (.xlsx)
                  </button>
                  <button onclick="KPIModule.exportPDF()" class="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2.5 border-t border-slate-700/50">
                    <i data-lucide="file-text" class="w-4 h-4 text-red-400"></i> PDF (.pdf)
                  </button>
                  <button onclick="KPIModule.exportJPG()" class="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2.5 border-t border-slate-700/50">
                    <i data-lucide="image" class="w-4 h-4 text-blue-400"></i> Gambar (.jpg)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SCORECARDS SUMMARY -->
        <div id="kpi-scorecards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"></div>

        <!-- MATRIX KPI TABLE CONTAINER -->
        <div id="kpi-table-container" class="space-y-4">
          <div class="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
            <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-500"></i>
            <p class="text-xs">Memuat Data Matrix KPI...</p>
          </div>
        </div>

      </div>

      <!-- MODAL SETTING (RANKING & RENAME HEADER) -->
      <div id="header-modal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
          <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h3 class="font-bold text-sm text-white flex items-center gap-2">
              <i data-lucide="sliders" class="w-4 h-4 text-blue-400"></i>
              Pengaturan Tampilan KPI
            </h3>
            <button onclick="KPIModule.closeHeaderModal()" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <!-- TOGGLE SHOW RANK -->
            <div class="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-700">
              <div>
                <p class="text-xs font-semibold text-white">Tampilkan Kolom Rank</p>
                <p class="text-[10px] text-slate-400">Urutkan rangking agent otomatis berdasarkan Final Score</p>
              </div>
              <input type="checkbox" id="chk-show-rank" ${this.showRank ? 'checked' : ''} 
                     class="w-4 h-4 text-blue-600 rounded bg-slate-800 border-slate-700 focus:ring-blue-500">
            </div>

            <div class="border-t border-slate-700/60 pt-3">
              <p class="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider">Custom Header Label</p>
              
              <div class="space-y-2.5">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Prod Kapture</label>
                  <input type="text" id="hdr-prod_kapture" value="${this.customHeaders.prod_kapture}"
                         class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Prod Sociomile</label>
                  <input type="text" id="hdr-prod_sociomile" value="${this.customHeaders.prod_sociomile}"
                         class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">QA Score</label>
                  <input type="text" id="hdr-qa_score" value="${this.customHeaders.qa_score}"
                         class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Attendance</label>
                  <input type="text" id="hdr-attandence" value="${this.customHeaders.attandence}"
                         class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Catatan Keterangan 1</label>
                  <input type="text" id="hdr-keterangan_1" value="${this.customHeaders.keterangan_1}"
                         class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Catatan Keterangan 2</label>
                  <input type="text" id="hdr-keterangan_2" value="${this.customHeaders.keterangan_2}"
                         class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-1">Catatan Keterangan 3</label>
                  <input type="text" id="hdr-keterangan_3" value="${this.customHeaders.keterangan_3}"
                         class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                </div>
              </div>
            </div>
          </div>

          <button onclick="KPIModule.saveHeaderModal()" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-blue-600/30">
            Terapkan Pengaturan
          </button>
        </div>
      </div>
    `;

    lucide.createIcons();
    this.loadKPIData();
  },

  async loadKPIData() {
    const container = document.getElementById("kpi-table-container");
    this.currentYear = document.getElementById("kpi-filter-year").value;
    this.currentMonth = document.getElementById("kpi-filter-month").value;
    this.currentWeek = document.getElementById("kpi-filter-week").value;
    this.currentSection = document.getElementById("kpi-filter-section").value;

    this.dirtyRows = {};
    this.updateSaveButtonState();

    try {
      const url = `${CONFIG.API_URL}?action=getKPI&year=${this.currentYear}&month=${encodeURIComponent(this.currentMonth)}&week=${this.currentWeek}&section=${encodeURIComponent(this.currentSection)}&template=${this.templateVersion}`;
      const res = await fetch(url);
      const result = await res.json();

      if (result.status === "success") {
        this.rawKPIData = result.data || [];
        this.targetsMap = result.targetsMap || {};
        this.renderScorecards();
        this.renderKPITable(container);
      } else {
        container.innerHTML = `
          <div class="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs">
            ${result.message || "Gagal memuat data KPI."}
          </div>
        `;
      }
    } catch (err) {
      container.innerHTML = `
        <div class="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs">
          Gagal koneksi ke server Apps Script.
        </div>
      `;
    }
  },

  renderScorecards() {
    const container = document.getElementById("kpi-scorecards");
    if (!container) return;

    if (this.rawKPIData.length === 0) {
      container.innerHTML = "";
      return;
    }

    let totalScoreSum = 0;
    let totalQASum = 0;
    let totalAttSum = 0;
    let topPerformer = { nama: "-", score: 0 };

    this.rawKPIData.forEach(item => {
      const score = item.calc ? item.calc.final_score : 0;
      totalScoreSum += score;
      totalQASum += Number(item.qa_score) || 0;
      totalAttSum += Number(item.attandence) || 0;

      if (score > topPerformer.score) {
        topPerformer = { nama: item.nama_agent, score: score };
      }
    });

    const count = this.rawKPIData.length;
    const avgScore = (totalScoreSum / count).toFixed(1);
    const avgQA = (totalQASum / count).toFixed(1);
    const avgAtt = (totalAttSum / count).toFixed(1);

    container.innerHTML = `
      <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Rata-rata KPI Tim</p>
          <h3 class="text-xl font-extrabold text-white mt-1">${avgScore}%</h3>
        </div>
        <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <i data-lucide="award" class="w-5 h-5"></i>
        </div>
      </div>

      <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Top Performer</p>
          <h3 class="text-sm font-bold text-emerald-400 mt-1 truncate max-w-[120px]">${topPerformer.nama}</h3>
          <p class="text-[10px] text-slate-400 font-mono">${topPerformer.score}% Score</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <i data-lucide="crown" class="w-5 h-5"></i>
        </div>
      </div>

      <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Rata-rata QA Score</p>
          <h3 class="text-xl font-extrabold text-white mt-1">${avgQA}%</h3>
        </div>
        <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <i data-lucide="check-check" class="w-5 h-5"></i>
        </div>
      </div>

      <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Rata-rata Attendance</p>
          <h3 class="text-xl font-extrabold text-white mt-1">${avgAtt}%</h3>
        </div>
        <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <i data-lucide="user-check" class="w-5 h-5"></i>
        </div>
      </div>
    `;

    lucide.createIcons();
  },

  renderKPITable(container) {
    const user = Auth.getUser();
    const isTL = user && (user.role === "TL" || String(user.role).toUpperCase().includes("LEADER"));
    const h = this.customHeaders;

    if (this.rawKPIData.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
          Belum ada data KPI untuk filter yang dipilih.
        </div>
      `;
      return;
    }

    // Kalkulasi Peringkat Rank berdasarkan Final Score Descending
    const sortedList = [...this.rawKPIData].sort((a, b) => {
      const scoreA = a.calc ? a.calc.final_score : 0;
      const scoreB = b.calc ? b.calc.final_score : 0;
      return scoreB - scoreA;
    });

    const rankMap = {};
    sortedList.forEach((item, idx) => {
      const key = `${item.year}_${item.month}_${item.week}_${item.nama_agent}`.toLowerCase();
      rankMap[key] = idx + 1;
    });

    const getRankBadgeClass = (r) => {
      if (r === 1) return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black';
      if (r === 2) return 'bg-slate-400/20 text-slate-200 border-slate-400/40 font-extrabold';
      if (r === 3) return 'bg-orange-600/20 text-orange-400 border-orange-600/40 font-bold';
      return 'bg-slate-900 text-slate-400 border-slate-700 font-semibold';
    };

    container.innerHTML = `
      <div id="kpi-matrix-card" class="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
        <div class="overflow-x-auto max-h-[70vh]">
          <table id="kpi-table" class="w-full text-left border-collapse text-[11px] relative">
            
            <!-- HEADER BERTINGKAT (MULTI-LEVEL HEADER) -->
            <thead>
              <tr class="bg-slate-900 text-slate-300 border-b border-slate-700/80 text-center">
                ${this.showRank ? `
                  <th rowspan="2" class="p-2.5 font-bold border-r border-slate-700 w-12 sticky left-0 z-40 bg-slate-900">
                    RANK
                  </th>
                ` : ''}
                
                <th rowspan="2" class="p-2.5 font-bold border-r border-slate-700 min-w-[130px] sticky ${this.showRank ? 'left-12' : 'left-0'} z-40 bg-slate-900 text-left">
                  NAMA AGENT
                </th>

                <th rowspan="2" class="p-2.5 font-bold border-r border-slate-700 min-w-[50px]">W/MO</th>
                <th rowspan="2" class="p-2.5 font-bold border-r border-slate-700 min-w-[80px]">SECTION</th>

                <!-- GROUP PRODUCTIVITY 40% -->
                <th colspan="5" class="p-2 font-extrabold border-r border-slate-700 bg-blue-950/40 text-blue-400 uppercase tracking-wider">
                  PRODUCTIVITY (40%)
                </th>

                <!-- GROUP QA SCORE 50% -->
                <th colspan="3" class="p-2 font-extrabold border-r border-slate-700 bg-purple-950/40 text-purple-400 uppercase tracking-wider">
                  QUALITY (50%)
                </th>

                <!-- GROUP ATTENDANCE 10% -->
                <th colspan="3" class="p-2 font-extrabold border-r border-slate-700 bg-amber-950/40 text-amber-400 uppercase tracking-wider">
                  ATTENDANCE (10%)
                </th>

                <!-- FINAL RESULT -->
                <th rowspan="2" class="p-2.5 font-black border-r border-slate-700 bg-emerald-950/60 text-emerald-300 min-w-[90px]">
                  FINAL RESULT
                </th>

                <!-- GROUP CATATAN KETERANGAN -->
                <th colspan="3" class="p-2 font-extrabold">CATATAN KETERANGAN</th>
              </tr>

              <!-- HEADER BARIS KE-2 (SUB-HEADER ACH, TGT, RESULT) -->
              <tr class="bg-slate-900/90 text-slate-400 border-b border-slate-700 text-[10px] text-center">
                <!-- Sub Productivity -->
                <th class="p-1.5 border-r border-slate-800 min-w-[60px]">${h.prod_kapture}</th>
                <th class="p-1.5 border-r border-slate-800 min-w-[60px]">${h.prod_sociomile}</th>
                <th class="p-1.5 border-r border-slate-800 bg-slate-950/50 text-slate-500 min-w-[55px]">TGT Kap</th>
                <th class="p-1.5 border-r border-slate-800 bg-slate-950/50 text-slate-500 min-w-[55px]">TGT Soc</th>
                <th class="p-1.5 border-r border-slate-700 bg-blue-950/30 text-blue-300 font-bold min-w-[65px]">RESULT</th>

                <!-- Sub Quality QA -->
                <th class="p-1.5 border-r border-slate-800 min-w-[60px]">${h.qa_score}</th>
                <th class="p-1.5 border-r border-slate-800 bg-slate-950/50 text-slate-500 min-w-[50px]">TGT</th>
                <th class="p-1.5 border-r border-slate-700 bg-purple-950/30 text-purple-300 font-bold min-w-[65px]">RESULT</th>

                <!-- Sub Attendance -->
                <th class="p-1.5 border-r border-slate-800 min-w-[60px]">${h.attandence}</th>
                <th class="p-1.5 border-r border-slate-800 bg-slate-950/50 text-slate-500 min-w-[50px]">TGT</th>
                <th class="p-1.5 border-r border-slate-700 bg-amber-950/30 text-amber-300 font-bold min-w-[65px]">RESULT</th>

                <!-- Sub Catatan -->
                <th class="p-1.5 border-r border-slate-800 min-w-[110px]">${h.keterangan_1}</th>
                <th class="p-1.5 border-r border-slate-800 min-w-[110px]">${h.keterangan_2}</th>
                <th class="p-1.5 min-w-[110px]">${h.keterangan_3}</th>
              </tr>
            </thead>

            <!-- ISIAN TABEL TRANSAKSI -->
            <tbody class="divide-y divide-slate-700/50">
              ${this.rawKPIData.map((item, idx) => {
                const itemKey = `${item.year}_${item.month}_${item.week}_${item.nama_agent}`.toLowerCase();
                const rowKey = itemKey.replace(/[^a-z0-9]/g, '_');
                const rankNum = rankMap[itemKey] || (idx + 1);

                const targetObj = this.targetsMap[item.section] || { target_kapture: item.target_kapture || 40, target_sociomile: item.target_sociomile || 20 };
                const calc = item.calc || { score_prod: 0, score_qa: 0, score_att: 0, final_score: 0 };
                const isDirty = Boolean(this.dirtyRows[rowKey]);

                return `
                  <tr id="kpi-row-${rowKey}" class="hover:bg-slate-700/20 transition ${isDirty ? 'bg-amber-500/5' : ''}">
                    
                    ${this.showRank ? `
                      <!-- STICKY RANK CELL -->
                      <td class="p-2 text-center sticky left-0 z-20 bg-slate-800 border-r border-slate-700">
                        <span class="w-7 h-7 inline-flex items-center justify-center rounded-lg border text-xs font-mono ${getRankBadgeClass(rankNum)}">
                          ${rankNum}
                        </span>
                      </td>
                    ` : ''}

                    <!-- STICKY AGENT NAME CELL -->
                    <td class="p-3 font-semibold text-white sticky ${this.showRank ? 'left-12' : 'left-0'} z-20 bg-slate-800 border-r border-slate-700 shadow-md">
                      <div class="truncate max-w-[120px]" title="${item.nama_agent}">${item.nama_agent}</div>
                    </td>

                    <td class="p-2.5 text-center font-mono text-slate-400 border-r border-slate-700/60">W${item.week}</td>
                    <td class="p-2.5 text-slate-300 border-r border-slate-700/60 text-xs">${item.section}</td>

                    <!-- ACH PROD KAPTURE -->
                    <td class="p-1.5">
                      ${isTL ? `
                        <input type="number" value="${item.prod_kapture}" oninput="KPIModule.onCellInputChange('${rowKey}', ${idx}, 'prod_kapture', this.value)"
                               class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-blue-500">
                      ` : `<div class="text-center font-mono text-white font-semibold">${item.prod_kapture}</div>`}
                    </td>

                    <!-- ACH PROD SOCIOMILE -->
                    <td class="p-1.5 border-r border-slate-700/40">
                      ${isTL ? `
                        <input type="number" value="${item.prod_sociomile}" oninput="KPIModule.onCellInputChange('${rowKey}', ${idx}, 'prod_sociomile', this.value)"
                               class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-blue-500">
                      ` : `<div class="text-center font-mono text-white font-semibold">${item.prod_sociomile}</div>`}
                    </td>

                    <!-- TARGET PROD KAPTURE & SOCIOMILE -->
                    <td class="p-2 text-center font-mono text-slate-500 bg-slate-950/30 border-r border-slate-700/40">${targetObj.target_kapture}</td>
                    <td class="p-2 text-center font-mono text-slate-500 bg-slate-950/30 border-r border-slate-700/60">${targetObj.target_sociomile}</td>

                    <!-- RESULT PROD 40% -->
                    <td class="p-2 text-center font-mono font-extrabold text-blue-400 bg-blue-950/30 border-r border-slate-700" id="calc-prod-${rowKey}">
                      ${calc.score_prod}%
                    </td>

                    <!-- ACH QA SCORE -->
                    <td class="p-1.5">
                      ${isTL ? `
                        <input type="number" value="${item.qa_score}" oninput="KPIModule.onCellInputChange('${rowKey}', ${idx}, 'qa_score', this.value)"
                               class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500">
                      ` : `<div class="text-center font-mono text-emerald-400 font-semibold">${item.qa_score}%</div>`}
                    </td>

                    <!-- TARGET QA SCORE (90%) -->
                    <td class="p-2 text-center font-mono text-slate-500 bg-slate-950/30 border-r border-slate-700/40">${this.qaTargetDefault}%</td>

                    <!-- RESULT QA 50% -->
                    <td class="p-2 text-center font-mono font-extrabold text-purple-400 bg-purple-950/30 border-r border-slate-700" id="calc-qa-${rowKey}">
                      ${calc.score_qa}%
                    </td>

                    <!-- ACH ATTENDANCE -->
                    <td class="p-1.5">
                      ${isTL ? `
                        <input type="number" value="${item.attandence}" oninput="KPIModule.onCellInputChange('${rowKey}', ${idx}, 'attandence', this.value)"
                               class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-amber-400 focus:outline-none focus:border-blue-500">
                      ` : `<div class="text-center font-mono text-amber-400 font-semibold">${item.attandence}%</div>`}
                    </td>

                    <!-- TARGET ATTENDANCE (100%) -->
                    <td class="p-2 text-center font-mono text-slate-500 bg-slate-950/30 border-r border-slate-700/40">${this.attTargetDefault}%</td>

                    <!-- RESULT ATT 10% -->
                    <td class="p-2 text-center font-mono font-extrabold text-amber-400 bg-amber-950/30 border-r border-slate-700" id="calc-att-${rowKey}">
                      ${calc.score_att}%
                    </td>

                    <!-- FINAL SCORE RESULT -->
                    <td class="p-2 text-center font-mono font-black text-emerald-300 bg-emerald-950/50 border-r border-slate-700 shadow-inner text-xs" id="calc-final-${rowKey}">
                      ${calc.final_score}%
                    </td>

                    <!-- CATATAN KETERANGAN 1..3 -->
                    <td class="p-1.5">
                      ${isTL ? `
                        <input type="text" value="${item.keterangan_1}" oninput="KPIModule.onCellInputChange('${rowKey}', ${idx}, 'keterangan_1', this.value)"
                               class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                      ` : `<span class="text-slate-400">${item.keterangan_1 || '-'}</span>`}
                    </td>
                    <td class="p-1.5">
                      ${isTL ? `
                        <input type="text" value="${item.keterangan_2}" oninput="KPIModule.onCellInputChange('${rowKey}', ${idx}, 'keterangan_2', this.value)"
                               class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                      ` : `<span class="text-slate-400">${item.keterangan_2 || '-'}</span>`}
                    </td>
                    <td class="p-1.5">
                      ${isTL ? `
                        <input type="text" value="${item.keterangan_3}" oninput="KPIModule.onCellInputChange('${rowKey}', ${idx}, 'keterangan_3', this.value)"
                               class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                      ` : `<span class="text-slate-400">${item.keterangan_3 || '-'}</span>`}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    lucide.createIcons();
  },

  onCellInputChange(rowKey, itemIdx, field, val) {
    const item = this.rawKPIData[itemIdx];
    if (!item) return;

    item[field] = field.includes('keterangan') ? val : Number(val) || 0;
    this.dirtyRows[rowKey] = item;

    const targetObj = this.targetsMap[item.section] || { target_kapture: 40, target_sociomile: 20 };
    const targetK = targetObj.target_kapture;
    const targetS = targetObj.target_sociomile;

    let scoreProd = 0;
    if (this.templateVersion === 1) {
      const scoreK = targetK > 0 ? (item.prod_kapture / targetK) * 20 : 0;
      const scoreS = targetS > 0 ? (item.prod_sociomile / targetS) * 20 : 0;
      scoreProd = scoreK + scoreS;
    } else {
      const totalT = targetK + targetS;
      const totalA = item.prod_kapture + item.prod_sociomile;
      scoreProd = totalT > 0 ? (totalA / totalT) * 40 : 0;
    }

    const scoreQA = (item.qa_score / 100) * 50;
    const scoreAtt = (item.attandence / 100) * 10;
    const finalScore = scoreProd + scoreQA + scoreAtt;

    item.calc = {
      score_prod: Number(scoreProd.toFixed(2)),
      score_qa: Number(scoreQA.toFixed(2)),
      score_att: Number(scoreAtt.toFixed(2)),
      final_score: Number(finalScore.toFixed(2))
    };

    const prodElem = document.getElementById(`calc-prod-${rowKey}`);
    const qaElem = document.getElementById(`calc-qa-${rowKey}`);
    const attElem = document.getElementById(`calc-att-${rowKey}`);
    const finalElem = document.getElementById(`calc-final-${rowKey}`);

    if (prodElem) prodElem.innerText = `${item.calc.score_prod}%`;
    if (qaElem) qaElem.innerText = `${item.calc.score_qa}%`;
    if (attElem) attElem.innerText = `${item.calc.score_att}%`;
    if (finalElem) finalElem.innerText = `${item.calc.final_score}%`;

    const rowElem = document.getElementById(`kpi-row-${rowKey}`);
    if (rowElem) rowElem.className = "hover:bg-slate-700/20 transition bg-amber-500/10 border-l-2 border-amber-400";

    this.updateSaveButtonState();
    this.renderScorecards();
  },

  updateSaveButtonState() {
    const btn = document.getElementById("btn-kpi-save");
    if (!btn) return;

    const count = Object.keys(this.dirtyRows).length;
    if (count > 0) {
      btn.disabled = false;
      btn.className = "flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 cursor-pointer animate-pulse";
    } else {
      btn.disabled = true;
      btn.className = "flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-700 text-slate-500 text-xs font-bold rounded-xl transition cursor-not-allowed shadow-lg";
    }
  },

  async saveAllChanges() {
    const user = Auth.getUser();
    const changesArray = Object.values(this.dirtyRows);
    if (changesArray.length === 0) return;

    const btn = document.getElementById("btn-kpi-save");
    btn.innerText = "Menyimpan...";
    btn.disabled = true;

    try {
      const res = await fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "saveKPI",
          kpiData: changesArray,
          userRole: user ? user.role : ""
        })
      });
      const result = await res.json();

      if (result.status === "success") {
        alert(`✅ Berhasil! ${result.message}`);
        this.dirtyRows = {};
        this.loadKPIData();
      } else {
        alert(`❌ Gagal: ${result.message}`);
        btn.innerText = "Simpan KPI";
        btn.disabled = false;
      }
    } catch (err) {
      alert("❌ Error koneksi ke server Apps Script.");
      btn.innerText = "Simpan KPI";
      btn.disabled = false;
    }
  },

  setTemplateVersion(v) {
    this.templateVersion = v;
    const b1 = document.getElementById("btn-tpl-1");
    const b2 = document.getElementById("btn-tpl-2");

    if (v === 1) {
      b1.className = "px-2.5 py-1 text-[11px] font-bold rounded-lg transition bg-blue-600 text-white shadow-md";
      b2.className = "px-2.5 py-1 text-[11px] font-bold rounded-lg transition text-slate-400 hover:text-white";
    } else {
      b2.className = "px-2.5 py-1 text-[11px] font-bold rounded-lg transition bg-blue-600 text-white shadow-md";
      b1.className = "px-2.5 py-1 text-[11px] font-bold rounded-lg transition text-slate-400 hover:text-white";
    }

    this.loadKPIData();
  },

  onFilterChange() {
    this.loadKPIData();
  },

  openHeaderModal() {
    document.getElementById("header-modal").classList.remove("hidden");
  },

  closeHeaderModal() {
    document.getElementById("header-modal").classList.add("hidden");
  },

  saveHeaderModal() {
    this.showRank = document.getElementById("chk-show-rank").checked;
    localStorage.setItem("KPI_SHOW_RANK", JSON.stringify(this.showRank));

    this.customHeaders = {
      prod_kapture: document.getElementById("hdr-prod_kapture").value || "Prod Kapture",
      prod_sociomile: document.getElementById("hdr-prod_sociomile").value || "Prod Sociomile",
      qa_score: document.getElementById("hdr-qa_score").value || "QA Score",
      attandence: document.getElementById("hdr-attandence").value || "Attendance",
      keterangan_1: document.getElementById("hdr-keterangan_1").value || "Catatan 1",
      keterangan_2: document.getElementById("hdr-keterangan_2").value || "Catatan 2",
      keterangan_3: document.getElementById("hdr-keterangan_3").value || "Catatan 3"
    };

    localStorage.setItem("KPI_HEADER_LABELS", JSON.stringify(this.customHeaders));
    this.closeHeaderModal();
    this.renderKPITable(document.getElementById("kpi-table-container"));
  },

  toggleExportMenu() {
    const menu = document.getElementById("export-kpi-dropdown");
    menu.classList.toggle("hidden");
  },

  exportExcel() {
    this.toggleExportMenu();
    const table = document.getElementById("kpi-table");
    if (!table) return alert("Data KPI tidak ditemukan.");
    const wb = XLSX.utils.table_to_book(table, { sheet: "KPI Performance" });
    XLSX.writeFile(wb, `KPI_Performance_${this.currentYear}_${this.currentMonth || 'All'}.xlsx`);
  },

  exportPDF() {
    this.toggleExportMenu();
    const element = document.getElementById("kpi-matrix-card");
    if (!element) return;
    const opt = {
      margin: 5,
      filename: `KPI_Performance_${this.currentYear}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#1e293b' },
      jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  },

  exportJPG() {
    this.toggleExportMenu();
    const element = document.getElementById("kpi-matrix-card");
    if (!element) return;
    html2canvas(element, { backgroundColor: '#1e293b', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `KPI_Performance_${this.currentYear}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.9);
      link.click();
    });
  }
};
