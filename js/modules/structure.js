const StructureModule = {
  cache: {},
  selectedId: null,

  async render(container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
        <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-brand-500"></i>
        <p class="text-xs">Memuat Data Struktur Tim...</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    try {
      const res = await fetch(`${CONFIG.API_URL}?action=getStructure`);
      const data = await res.json();
      this.renderData(container, data);
    } catch (err) {
      container.innerHTML = `
        <div class="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold">
          Gagal memuat data struktur: ${err.message}
        </div>
      `;
    }
  },

  renderData(container, data) {
    let tls = [];
    let agents = [];

    // Ekstrak data fleksibel dari berbagai bentuk pembungkus JSON GAS
    if (data) {
      const payload = data.data || data.structure || data.result || data;
      if (Array.isArray(payload)) {
        tls = payload.filter(x => (x.role && String(x.role).toUpperCase().includes('TL')) || x.is_tl);
        agents = payload.filter(x => !((x.role && String(x.role).toUpperCase().includes('TL')) || x.is_tl));
      } else if (typeof payload === 'object') {
        tls = payload.team_leaders || payload.teamLeaders || payload.tls || [];
        agents = payload.agents || payload.agent_list || [];
      }
    }

    // Simpan ke cache lokal berdasar ID
    this.cache = {};
    [...tls, ...agents].forEach(item => {
      const id = String(item.id || item.agent_id || item.nama || '').trim();
      if (id) this.cache[id] = item;
    });

    container.innerHTML = `
      <div class="space-y-6">
        <!-- TEAM LEADER SECTION -->
        <div>
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i data-lucide="shield" class="w-4 h-4 text-brand-500"></i>
            Team Leader (${tls.length})
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${tls.length > 0 
              ? tls.map(tl => this.createCardHtml(tl, true)).join('') 
              : '<p class="text-xs text-slate-500 italic p-2">Tidak ada Team Leader</p>'}
          </div>
        </div>

        <!-- DAFTAR AGENT SECTION -->
        <div>
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i data-lucide="users" class="w-4 h-4 text-brand-500"></i>
            Daftar Agent (${agents.length})
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${agents.length > 0 
              ? agents.map(ag => this.createCardHtml(ag, false)).join('') 
              : '<p class="text-xs text-slate-500 italic p-2">Tidak ada Agent</p>'}
          </div>
        </div>
      </div>

      <!-- HIDDEN FILE INPUT UNTUK UPLOAD FOTO -->
      <input type="file" id="global-agent-photo-input" accept="image/*" class="hidden" onchange="StructureModule.handlePhotoSelected(event)">
    `;

    if (window.lucide) lucide.createIcons();
  },

  createCardHtml(person, isTL) {
    const id = String(person.id || person.agent_id || person.nama || '').trim();
    const photoUrl = person.photo || person.foto || person.avatar || 'https://via.placeholder.com/150';
    const roleBadge = isTL ? 'Team Leader' : 'Agent';
    const aggText = person.aggregator ? `Agregator ${person.aggregator}` : 'Agregator -';

    return `
      <div class="glass-panel rounded-2xl p-4 flex items-center gap-4 hover:border-brand-500/40 transition group">
        <div class="relative shrink-0">
          <img src="${photoUrl}" alt="${person.nama || ''}" class="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-md">
          <span class="w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full absolute -bottom-1 -right-1"></span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 truncate">${aggText}</span>
          </div>
          <h4 class="text-sm font-bold text-white light:text-slate-900 truncate">${person.nama || person.name || '-'}</h4>
          <p class="text-xs text-slate-400 truncate">${person.vendor || person.mitra || '-'} • ${roleBadge}</p>
        </div>
        <button onclick="StructureModule.openModal('${id}')" 
                class="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition">
          <i data-lucide="chevron-right" class="w-5 h-5"></i>
        </button>
      </div>
    `;
  },

  openModal(id) {
    const person = this.cache[id];
    if (!person) return;

    this.selectedId = id;
    const rawTgl = person.tgl_lahir || person.tanggal_lahir || person.tglLahir || '-';
    const formattedTgl = this.formatDateIndo(rawTgl);
    const photo = person.photo || person.foto || person.avatar || 'https://via.placeholder.com/150';
    const roleStr = String(person.role || '').toUpperCase();
    const isTL = person.is_tl || roleStr.includes('TL') || roleStr.includes('LEADER');
    const role = isTL ? 'Team Leader' : 'Agent';
    const agg = person.aggregator ? `Agregator ${person.aggregator}` : 'Agregator -';
    const nama = person.nama || person.name || '-';
    const batch = person.batch || '-';
    const vendor = person.vendor || person.mitra || '-';
    const tl = person.tl || person.team_leader || '-';
    const biodata = person.biodata || person.keterangan || '-';

    let modal = document.getElementById('agent-detail-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'agent-detail-modal';
      modal.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <button onclick="document.getElementById('agent-detail-modal').classList.add('hidden')" class="absolute top-5 right-5 text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>

        <div class="flex items-center gap-4 border-b border-white/10 pb-4">
          <div class="relative">
            <img id="modal-agent-img" src="${photo}" class="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg">
          </div>
          <div>
            <h3 class="text-base font-extrabold text-white">${nama}</h3>
            <p class="text-xs text-brand-400 font-medium">${role} — ${agg}</p>
            <button onclick="StructureModule.triggerPhotoUpload('${id}')" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 text-xs font-semibold rounded-lg border border-brand-500/30 transition">
              <i data-lucide="camera" class="w-3.5 h-3.5"></i>
              <span>Ubah Foto</span>
            </button>
          </div>
        </div>

        <div id="upload-status-msg" class="hidden text-xs p-3 rounded-xl"></div>

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <p class="text-slate-400 text-[10px] mb-0.5">Batch</p>
            <p class="font-bold text-white">${batch}</p>
          </div>
          <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <p class="text-slate-400 text-[10px] mb-0.5">Vendor</p>
            <p class="font-bold text-white">${vendor}</p>
          </div>
          <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <p class="text-slate-400 text-[10px] mb-0.5">Team Leader</p>
            <p class="font-bold text-white">${tl}</p>
          </div>
          <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <p class="text-slate-400 text-[10px] mb-0.5">Tanggal Lahir</p>
            <p class="font-bold text-white">${formattedTgl}</p>
          </div>
        </div>

        <div class="bg-slate-900/60 p-3 rounded-xl border border-white/5 text-xs">
          <p class="text-slate-400 text-[10px] mb-0.5">Keterangan / Biodata</p>
          <p class="text-slate-200">${biodata}</p>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  triggerPhotoUpload(id) {
    this.selectedId = id;
    const input = document.getElementById('global-agent-photo-input');
    if (input) input.click();
  },

  async handlePhotoSelected(event) {
    const file = event.target.files[0];
    const id = this.selectedId;
    if (!file || !id) return;

    const statusMsg = document.getElementById('upload-status-msg');
    if (statusMsg) {
      statusMsg.className = "text-xs p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20";
      statusMsg.innerText = "Mengunggah foto baru...";
      statusMsg.classList.remove('hidden');
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target.result;
      try {
        const res = await fetch(CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            action: 'uploadPhoto',
            agent_id: id,
            image: base64Data
          })
        });

        const data = await res.json();
        if (data && (data.status === 'success' || data.photo_url)) {
          if (statusMsg) {
            statusMsg.className = "text-xs p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
            statusMsg.innerText = "Foto berhasil diperbarui!";
          }
          const img = document.getElementById('modal-agent-img');
          if (img) img.src = data.photo_url || base64Data;

          const contentArea = document.getElementById('app-content');
          if (contentArea) this.render(contentArea);
        } else {
          throw new Error((data && data.message) || 'Gagal menyimpan foto');
        }
      } catch (err) {
        if (statusMsg) {
          statusMsg.className = "text-xs p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20";
          statusMsg.innerText = "Error: " + err.message;
        }
      }
    };
    reader.readAsDataURL(file);
  },

  formatDateIndo(dateStr) {
    if (!dateStr || dateStr === '-' || dateStr === 'null' || dateStr === 'undefined') return '-';
    const cleanStr = String(dateStr).trim().split('T')[0].split(' ')[0];
    let parts = cleanStr.split('-');
    if (parts.length !== 3) parts = cleanStr.split('/');

    if (parts.length === 3) {
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      if (parts[0].length === 4) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const day = parts[2].padStart(2, '0');
        if (monthNum >= 1 && monthNum <= 12) return `${day} ${months[monthNum - 1]} ${year}`;
      } else if (parts[2].length === 4) {
        const day = parts[0].padStart(2, '0');
        const monthNum = parseInt(parts[1], 10);
        const year = parts[2];
        if (monthNum >= 1 && monthNum <= 12) return `${day} ${months[monthNum - 1]} ${year}`;
      }
    }
    return dateStr;
  }
};

// Global Aliases agar tombol di HTML lawas tidak error
window.Agents_uploadPhoto = (id) => StructureModule.triggerPhotoUpload(id);
window.openDetailModalById = (id) => StructureModule.openModal(id);
