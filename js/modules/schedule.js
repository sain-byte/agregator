const ScheduleModule = {
  currentMonth: new Date().toISOString().substring(0, 7),
  agentsList: [],
  scheduleMap: {},
  dirtyCells: {},

  async render(container) {
    this.agentsList = await this.fetchAgentsList();
    this.dirtyCells = {};

    const user = Auth.getUser();
    const isTL = user && (user.role === "TL" || String(user.role).toUpperCase().includes("LEADER"));

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- HEADER CONTROL BAR -->
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xl">
          <div class="flex flex-wrap items-center gap-3">
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Pilih Bulan & Tahun</label>
              <input type="month" id="schedule-filter-month" value="${this.currentMonth}" onchange="ScheduleModule.onMonthChange()"
                     class="bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 font-semibold">
            </div>

            ${isTL ? `
              <div id="unsaved-badge" class="hidden items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span id="unsaved-count">0</span> Perubahan Belum Disimpan
              </div>
            ` : `
              <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-xs font-medium">
                <i data-lucide="eye" class="w-3.5 h-3.5 text-blue-400"></i> Mode Lihat (Read-Only)
              </div>
            `}
          </div>

          <div class="flex flex-wrap items-center gap-3">
            ${isTL ? `
              <button id="btn-batch-save" onclick="ScheduleModule.saveAllChanges()" disabled
                      class="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-700 text-slate-500 text-xs font-bold rounded-xl transition cursor-not-allowed shadow-lg">
                <i data-lucide="save" class="w-4 h-4"></i>
                Simpan Semua Shift
              </button>
            ` : ''}

            <div class="relative inline-block text-left">
              <button onclick="ScheduleModule.toggleExportMenu()" 
                      class="flex items-center gap-2 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition border border-slate-600">
                <i data-lucide="download" class="w-4 h-4 text-emerald-400"></i>
                Export
                <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
              </button>

              <div id="export-dropdown" class="origin-top-right absolute right-0 mt-2 w-44 rounded-xl shadow-2xl bg-slate-800 border border-slate-700 hidden z-50 overflow-hidden">
                <div class="py-1">
                  <button onclick="ScheduleModule.exportExcel()" class="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2.5">
                    <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-400"></i> Excel (.xlsx)
                  </button>
                  <button onclick="ScheduleModule.exportPDF()" class="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2.5 border-t border-slate-700/50">
                    <i data-lucide="file-text" class="w-4 h-4 text-red-400"></i> PDF (.pdf)
                  </button>
                  <button onclick="ScheduleModule.exportJPG()" class="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2.5 border-t border-slate-700/50">
                    <i data-lucide="image" class="w-4 h-4 text-blue-400"></i> Gambar (.jpg)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="matrix-container" class="space-y-4">
          <div class="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
            <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-blue-500"></i>
            <p class="text-xs">Memuat Grid Matrix Schedule...</p>
          </div>
        </div>

      </div>

      <div id="note-modal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div class="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
          <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h3 class="font-bold text-sm text-white flex items-center gap-2">
              <i data-lucide="message-square" class="w-4 h-4 text-blue-400"></i>
              Catatan Keterangan
            </h3>
            <button onclick="ScheduleModule.closeNoteModal()" class="text-slate-400 hover:text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div>
            <p id="note-modal-info" class="text-xs text-slate-400 mb-2 font-mono"></p>
            <textarea id="note-modal-text" rows="3" ${!isTL ? 'readonly' : ''} 
                      placeholder="${isTL ? 'Contoh: Overtime 1 jam, tukar shift dengan Budi...' : 'Tidak ada catatan.'}"
                      class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"></textarea>
          </div>

          ${isTL ? `
            <button onclick="ScheduleModule.saveNoteModal()" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-blue-600/30">
              Terapkan Catatan
            </button>
          ` : `
            <button onclick="ScheduleModule.closeNoteModal()" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl text-xs transition">
              Tutup
            </button>
          `}
        </div>
      </div>
    `;

    lucide.createIcons();
    this.loadScheduleMatrix();
  },

  async fetchAgentsList() {
    try {
      const res = await fetch(`${CONFIG.API_URL}?action=getAgents`);
      const data = await res.json();
      return data.status === "success" ? data.data : [];
    } catch (e) {
      return [];
    }
  },

  async loadScheduleMatrix() {
    const container = document.getElementById("matrix-container");
    this.currentMonth = document.getElementById("schedule-filter-month").value;
    this.dirtyCells = {};
    this.updateSaveButtonState();

    try {
      const res = await fetch(`${CONFIG.API_URL}?action=getSchedules&monthYear=${this.currentMonth}`);
      const result = await res.json();

      this.scheduleMap = {};
      if (result.status === "success" && result.data) {
        result.data.forEach(item => {
          this.scheduleMap[`${item.agent_id}_${item.tanggal}`] = item;
        });
      }

      this.renderMatrixGrid(container);
    } catch (err) {
      container.innerHTML = `
        <div class="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs">
          Gagal memuat data matrix dari server.
        </div>
      `;
    }
  },

  renderMatrixGrid(container) {
    const user = Auth.getUser();
    const isTL = user && (user.role === "TL" || String(user.role).toUpperCase().includes("LEADER"));

    const [yearStr, monthStr] = this.currentMonth.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    
    const totalDays = new Date(year, month, 0).getDate();
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
    const shiftOptions = ['S8', 'S11', 'Off', 'Cuti', 'OTS', 'Resign', 'Ijin'];

    container.innerHTML = `
      <div id="schedule-matrix-card" class="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
        <div class="overflow-x-auto max-h-[72vh]">
          <table id="matrix-table" class="w-full text-left border-collapse text-[11px] relative">
            <thead>
              <tr class="bg-slate-900 text-slate-300 border-b border-slate-700 sticky top-0 z-30">
                <th class="p-3 font-bold sticky left-0 z-40 bg-slate-900 min-w-[140px] border-r border-slate-700 shadow-md">
                  Agent ID / Nama
                </th>
                ${daysArray.map(day => {
                  const dayPadded = String(day).padStart(2, '0');
                  const dateObj = new Date(year, month - 1, day);
                  const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                  return `
                    <th class="p-2 text-center min-w-[62px] border-r border-slate-700/60 ${isWeekend ? 'bg-slate-950/80 text-rose-400' : ''}">
                      <div class="font-mono text-xs font-bold">${dayPadded}</div>
                      <div class="text-[9px] text-slate-400 font-normal uppercase">${dayName}</div>
                    </th>
                  `;
                }).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/50">
              ${this.agentsList.map(agent => `
                <tr class="hover:bg-slate-700/20 transition">
                  <td class="p-3 font-semibold text-white sticky left-0 z-20 bg-slate-800 border-r border-slate-700 shadow-md">
                    <div class="truncate max-w-[120px]" title="${agent.nama_agent}">${agent.nama_agent}</div>
                    <div class="text-[10px] font-mono text-blue-400 font-normal">${agent.agent_id}</div>
                  </td>

                  ${daysArray.map(day => {
                    const dayPadded = String(day).padStart(2, '0');
                    const fullDateStr = `${this.currentMonth}-${dayPadded}`;
                    const key = `${agent.agent_id}_${fullDateStr}`;
                    
                    const item = this.dirtyCells[key] || this.scheduleMap[key] || {};
                    const currentShift = item.shift_code || 'Off';
                    const hasNote = Boolean(item.keterangan);
                    const isDirty = Boolean(this.dirtyCells[key]);

                    return `
                      <td class="p-1 text-center border-r border-slate-700/40 relative">
                        <div class="flex items-center justify-center gap-0.5">
                          ${isTL ? `
                            <select id="cell-select-${key.replace(/[^a-zA-Z0-9]/g, '_')}"
                                    onchange="ScheduleModule.onCellShiftChange('${agent.agent_id}', '${fullDateStr}', this.value)"
                                    class="w-full appearance-none text-center text-[11px] font-bold py-1 px-1 rounded-lg border focus:outline-none transition cursor-pointer ${isDirty ? 'ring-2 ring-amber-400 border-amber-400' : ''} ${this.getSelectStyleClass(currentShift)}">
                              ${shiftOptions.map(opt => `
                                <option value="${opt}" ${opt === currentShift ? 'selected' : ''} class="bg-slate-900 text-white font-semibold">
                                  ${opt}
                                </option>
                              `).join('')}
                            </select>
                          ` : `
                            <span class="w-full text-center text-[10px] font-bold py-1 px-1 rounded-lg border inline-block ${this.getSelectStyleClass(currentShift)}">
                              ${currentShift}
                            </span>
                          `}

                          <button onclick="ScheduleModule.openNoteModal('${agent.agent_id}', '${fullDateStr}')"
                                  title="${hasNote ? item.keterangan : 'Detail catatan'}"
                                  class="p-1 rounded-md transition ${hasNote ? 'text-amber-400 hover:bg-amber-500/20' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-700/50'}">
                            <i data-lucide="file-text" class="w-3 h-3"></i>
                          </button>
                        </div>
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    lucide.createIcons();
  },

  getSelectStyleClass(shiftCode) {
    switch(String(shiftCode).toUpperCase()) {
      case 'S8': return 'border-blue-500/50 text-blue-300 bg-blue-900/60 font-bold';
      case 'S11': return 'border-indigo-500/50 text-indigo-300 bg-indigo-900/60 font-bold';
      case 'OFF': return 'border-slate-700 text-slate-400 bg-slate-900/80';
      case 'CUTI': return 'border-amber-500/50 text-amber-300 bg-amber-900/60 font-bold';
      case 'OTS': return 'border-purple-500/50 text-purple-300 bg-purple-900/60 font-bold';
      case 'RESIGN': return 'border-red-500/50 text-red-300 bg-red-900/60 font-bold';
      case 'IJIN': return 'border-rose-500/50 text-rose-300 bg-rose-900/60 font-bold';
      default: return 'border-slate-700 text-slate-300 bg-slate-900';
    }
  },

  onCellShiftChange(agentId, dateStr, newShiftCode) {
    const key = `${agentId}_${dateStr}`;
    const existing = this.dirtyCells[key] || this.scheduleMap[key] || { agent_id: agentId, tanggal: dateStr };
    
    existing.shift_code = newShiftCode;
    this.dirtyCells[key] = existing;

    this.updateSaveButtonState();
    
    const elemId = `cell-select-${key.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const elem = document.getElementById(elemId);
    if (elem) {
      elem.className = `w-full appearance-none text-center text-[11px] font-bold py-1 px-1 rounded-lg border focus:outline-none transition cursor-pointer ring-2 ring-amber-400 border-amber-400 ${this.getSelectStyleClass(newShiftCode)}`;
    }
  },

  updateSaveButtonState() {
    const btn = document.getElementById("btn-batch-save");
    if (!btn) return;

    const badge = document.getElementById("unsaved-badge");
    const countSpan = document.getElementById("unsaved-count");
    const count = Object.keys(this.dirtyCells).length;

    if (count > 0) {
      btn.disabled = false;
      btn.className = "flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 cursor-pointer animate-pulse";
      if (badge) badge.classList.remove("hidden");
      if (countSpan) countSpan.innerText = count;
    } else {
      btn.disabled = true;
      btn.className = "flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-700 text-slate-500 text-xs font-bold rounded-xl transition cursor-not-allowed shadow-lg";
      if (badge) badge.classList.add("hidden");
    }
  },

  async saveAllChanges() {
    const user = Auth.getUser();
    const changesArray = Object.values(this.dirtyCells);
    if (changesArray.length === 0) return;

    const btn = document.getElementById("btn-batch-save");
    btn.innerText = "Menyimpan...";
    btn.disabled = true;

    try {
      const res = await fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "saveSchedules",
          schedules: changesArray,
          userRole: user ? user.role : "" // CERTIFIED USER ROLE TOKEN SENT TO BACKEND
        })
      });
      const result = await res.json();

      if (result.status === "success") {
        alert(`✅ Berhasil! ${result.message || 'Semua shift disimpan.'}`);
        this.dirtyCells = {};
        this.loadScheduleMatrix();
      } else {
        alert(`❌ Akses ditolak backend: ${result.message}`);
        btn.innerText = "Simpan Semua Shift";
        btn.disabled = false;
      }
    } catch (err) {
      alert("❌ Error koneksi ke server Apps Script.");
      btn.innerText = "Simpan Semua Shift";
      btn.disabled = false;
    }
  },

  activeNoteKey: "",
  openNoteModal(agentId, dateStr) {
    this.activeNoteKey = `${agentId}_${dateStr}`;
    const item = this.dirtyCells[this.activeNoteKey] || this.scheduleMap[this.activeNoteKey] || {};

    document.getElementById("note-modal-info").innerText = `${agentId} • ${dateStr}`;
    document.getElementById("note-modal-text").value = item.keterangan || "";
    document.getElementById("note-modal").classList.remove("hidden");
  },

  closeNoteModal() {
    document.getElementById("note-modal").classList.add("hidden");
  },

  saveNoteModal() {
    const user = Auth.getUser();
    const isTL = user && (user.role === "TL" || String(user.role).toUpperCase().includes("LEADER"));
    if (!isTL || !this.activeNoteKey) return;

    const [agentId, dateStr] = this.activeNoteKey.split("_");
    const noteText = document.getElementById("note-modal-text").value;

    const item = this.dirtyCells[this.activeNoteKey] || this.scheduleMap[this.activeNoteKey] || { agent_id: agentId, tanggal: dateStr, shift_code: "Off" };
    item.keterangan = noteText;
    this.dirtyCells[this.activeNoteKey] = item;

    this.closeNoteModal();
    this.updateSaveButtonState();
    this.renderMatrixGrid(document.getElementById("matrix-container"));
  },

  onMonthChange() {
    this.loadScheduleMatrix();
  },

  toggleExportMenu() {
    const menu = document.getElementById("export-dropdown");
    menu.classList.toggle("hidden");
  },

  exportExcel() {
    this.toggleExportMenu();
    const table = document.getElementById("matrix-table");
    if (!table) return alert("Data matrix tidak ditemukan.");
    const wb = XLSX.utils.table_to_book(table, { sheet: "Matrix Schedule" });
    XLSX.writeFile(wb, `Matrix_Schedule_${this.currentMonth}.xlsx`);
  },

  exportPDF() {
    this.toggleExportMenu();
    const element = document.getElementById("schedule-matrix-card");
    if (!element) return;
    const opt = {
      margin: 5,
      filename: `Matrix_Schedule_${this.currentMonth}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#1e293b' },
      jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  },

  exportJPG() {
    this.toggleExportMenu();
    const element = document.getElementById("schedule-matrix-card");
    if (!element) return;
    html2canvas(element, { backgroundColor: '#1e293b', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Matrix_Schedule_${this.currentMonth}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.9);
      link.click();
    });
  }
};
