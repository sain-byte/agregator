// HELPER FORMAT TANGGAL INDONESIA (Contoh: 1990-10-03 atau 03/10/1990 -> 03 Oktober 1990)
function formatDateIndo(dateStr) {
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

window.agentCacheMap = {};
window.selectedAgentForPhoto = null;

window.Agents_uploadPhoto = function(agentId) {
  window.selectedAgentForPhoto = agentId;
  let fileInput = document.getElementById('global-agent-photo-input');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'global-agent-photo-input';
    fileInput.accept = 'image/*';
    fileInput.className = 'hidden';
    fileInput.onchange = window.handlePhotoSelected;
    document.body.appendChild(fileInput);
  }
  fileInput.click();
};

window.handlePhotoSelected = async function(event) {
  const file = event.target.files[0];
  const agentId = window.selectedAgentForPhoto;
  if (!file || !agentId) return;

  const statusMsg = document.getElementById('upload-status-msg');
  if (statusMsg) {
    statusMsg.className = "text-xs p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20";
    statusMsg.innerText = "Mengunggah foto baru...";
    statusMsg.classList.remove('hidden');
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Data = e.target.result;
    
    try {
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'uploadPhoto',
          agent_id: agentId,
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
        if (contentArea) StructureModule.render(contentArea);
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
};

window.openDetailModalById = function(id) {
  const person = window.agentCacheMap[id];
  if (!person) return;

  window.selectedAgentForPhoto = id;
  const rawTgl = person.tgl_lahir || person.tanggal_lahir || person.birth_date;
  const formattedTgl = formatDateIndo(rawTgl);
  const photo = person.photo || person.foto || person.avatar || 'https://via.placeholder.com/150';
  const roleStr = String(person.role || person.jabatan || '').toUpperCase();
  const isTL = person.is_tl || person.isTL || roleStr === 'TL' || roleStr.includes('LEADER');
  const role = isTL ? 'Team Leader' : 'Agent';
  const agg = person.aggregator ? `Agregator ${person.aggregator}` : 'Agregator -';
  const nama = person.nama || person.name || '-';
  const batch = person.batch || '-';
  const vendor = person.vendor || person.mitra || '-';
  const tl = person.tl || person.team_leader || person.teamLeader || '-';
  const biodata = person.biodata || person.keterangan || person.bio || '-';
  
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
          <button onclick="window.Agents_uploadPhoto('${id}')" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 text-xs font-semibold rounded-lg border border-brand-500/30 transition">
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
};

const StructureModule = {
  async render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    `;

    try {
      const res = await fetch(`${CONFIG.API_URL}?action=getStructure`);
      const data = await res.json();
      this.renderData(container, data);
    } catch (err) {
      container.innerHTML = `<div class="text-red-400 p-4 font-semibold">Error koneksi: ${err.message}</div>`;
    }
  },

  extractLists(data) {
    let tls = [];
    let agents = [];

    if (!data) return { tls, agents };

    const candidates = [data, data.data, data.result, data.structure, data.payload].filter(Boolean);

    for (const obj of candidates) {
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          const roleStr = String(item.role || item.jabatan || item.position || '').toUpperCase();
          if (item.is_tl || item.isTL || roleStr === 'TL' || roleStr.includes('LEADER')) {
            tls.push(item);
          } else {
            agents.push(item);
          }
        });
        if (tls.length > 0 || agents.length > 0) return { tls, agents };
      } else if (typeof obj === 'object') {
        const foundTL = obj.team_leaders || obj.teamLeaders || obj.tls || obj.TL || obj.tl_list;
        const foundAgents = obj.agents || obj.agentList || obj.agent_list || obj.agents_list;

        if (Array.isArray(foundTL)) tls = foundTL;
        if (Array.isArray(foundAgents)) agents = foundAgents;

        if (tls.length > 0 || agents.length > 0) return { tls, agents };
      }
    }

    return { tls, agents };
  },

  renderData(container, data) {
    const { tls, agents } = this.extractLists(data);

    window.agentCacheMap = {};
    const registerCache = (item) => {
      const id = item.id || item.agent_id || item.agentId || item.nama;
      if (id) window.agentCacheMap[id] = item;
    };
    tls.forEach(registerCache);
    agents.forEach(registerCache);

    let html = `
      <div class="space-y-6">
        <div>
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i data-lucide="shield" class="w-4 h-4 text-brand-500"></i>
            Team Leader (${tls.length})
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${tls.map(tl => this.createCardHtml(tl, true)).join('')}
          </div>
        </div>

        <div>
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i data-lucide="users" class="w-4 h-4 text-brand-500"></i>
            Daftar Agent (${agents.length})
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${agents.map(ag => this.createCardHtml(ag, false)).join('')}
          </div>
        </div>
      </div>

      <input type="file" id="global-agent-photo-input" accept="image/*" class="hidden" onchange="window.handlePhotoSelected(event)">
    `;

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  createCardHtml(person, isTL) {
    const id = person.id || person.agent_id || person.agentId || person.nama;
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
        <button onclick="window.openDetailModalById('${id}')" 
                class="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition">
          <i data-lucide="chevron-right" class="w-5 h-5"></i>
        </button>
      </div>
    `;
  }
};
