const StructureModule = {
  async fetchAgents() {
    try {
      const response = await fetch(`${CONFIG.API_URL}?action=getAgents`);
      const result = await response.json();
      return result.status === "success" ? result.data : [];
    } catch (err) {
      console.error("Fetch Agents Error:", err);
      return [];
    }
  },

  async render(container) {
    const agentsData = await this.fetchAgents();

    if (agentsData.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl">
          Belum ada data Agent di Sheet atau data gagal dimuat.
        </div>
      `;
      return;
    }

    const isTeamLeader = (levelVal) => {
      const lvl = String(levelVal || '').toUpperCase();
      return lvl.includes("TL") || lvl.includes("LEADER");
    };

    const teamLeaders = agentsData.filter(a => isTeamLeader(a.level));
    const agents = agentsData.filter(a => !isTeamLeader(a.level));

    container.innerHTML = `
      <div class="space-y-8">
        
        <!-- TOP LAYER: TEAM LEADER SECTION -->
        <div>
          <h3 class="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
            <i data-lucide="shield-check" class="w-4 h-4 text-blue-400"></i>
            Team Leader (${teamLeaders.length})
          </h3>
          ${teamLeaders.length > 0 ? `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${teamLeaders.map(tl => this.createCardHTML(tl, true)).join('')}
            </div>
          ` : `
            <div class="p-4 bg-slate-800/40 border border-slate-800 rounded-xl text-xs text-slate-500">
              Belum ada data Team Leader yang terdaftar.
            </div>
          `}
        </div>

        <!-- BOTTOM LAYER: REGULAR AGENTS GRID -->
        <div>
          <h3 class="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
            <i data-lucide="users" class="w-4 h-4 text-slate-400"></i>
            Daftar Agent (${agents.length})
          </h3>
          ${agents.length > 0 ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              ${agents.map(agt => this.createCardHTML(agt, false)).join('')}
            </div>
          ` : `
            <div class="p-4 bg-slate-800/40 border border-slate-800 rounded-xl text-xs text-slate-500">
              Belum ada data Agent yang terdaftar.
            </div>
          `}
        </div>

      </div>

      <!-- MODAL PREVIEW BIODATA -->
      <div id="profile-modal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
        <div id="modal-content" class="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        </div>
      </div>
    `;

    lucide.createIcons();
  },

  createCardHTML(item, isTL) {
    const avatarFallback = item.nama_agent ? item.nama_agent.split(' ').map(n=>n[0]).slice(0,2).join('') : 'AG';
    const borderAccent = isTL ? 'border-blue-500/40 bg-slate-800/80 hover:border-blue-500' : 'border-slate-800 bg-slate-800/40 hover:border-slate-700';

    return `
      <div onclick="StructureModule.openModal('${encodeURIComponent(JSON.stringify(item))}')" 
           class="p-4 rounded-2xl border ${borderAccent} transition cursor-pointer flex items-center gap-4 group">
        <div class="relative">
          ${item.foto_url 
            ? `<img src="${item.foto_url}" class="w-14 h-14 rounded-xl object-cover border border-slate-700">`
            : `<div class="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-slate-200 text-base border border-slate-600">
                ${avatarFallback}
               </div>`
          }
          <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${item.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}"></span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${isTL ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-700 text-slate-300'}">
              ${item.section || 'Agregator'}
            </span>
            <span class="text-[10px] text-slate-500 font-mono">${item.batch || ''}</span>
          </div>
          <h4 class="font-bold text-sm text-white truncate group-hover:text-blue-400 transition">${item.nama_agent}</h4>
          <p class="text-xs text-slate-400 truncate mt-0.5">${item.vendor || 'Mitracomm'} • <span class="text-slate-500">${item.level}</span></p>
        </div>
      </div>
    `;
  },

  openModal(encodedData) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    const modal = document.getElementById("profile-modal");
    const modalContent = document.getElementById("modal-content");

    const avatarFallback = data.nama_agent ? data.nama_agent.split(' ').map(n=>n[0]).slice(0,2).join('') : 'AG';

    modalContent.innerHTML = `
      <button onclick="StructureModule.closeModal()" class="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>

      <div class="flex items-center gap-4 border-b border-slate-700/60 pb-4">
        <div class="relative group">
          <div id="modal-avatar-container">
            ${data.foto_url 
              ? `<img src="${data.foto_url}" class="w-16 h-16 rounded-2xl object-cover border border-slate-600">`
              : `<div class="w-16 h-16 rounded-2xl bg-slate-700 flex items-center justify-center font-bold text-slate-200 text-xl border border-slate-600">
                  ${avatarFallback}
                 </div>`
            }
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-base text-white truncate">${data.nama_agent}</h3>
          <p class="text-xs text-blue-400 font-medium">${data.level} — ${data.section}</p>
          <div class="mt-2 flex items-center gap-2">
            <label for="input-avatar-file" id="btn-upload-label" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 text-[11px] font-semibold cursor-pointer transition">
              <i data-lucide="camera" class="w-3.5 h-3.5"></i>
              Ubah Foto
            </label>
            <input type="file" id="input-avatar-file" accept="image/*" class="hidden" onchange="StructureModule.handlePhotoUpload(event, '${data.agent_id}')">
          </div>
        </div>
      </div>

      <div id="upload-status-msg" class="text-xs p-2.5 rounded-xl hidden"></div>

      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="bg-slate-900/50 p-3 rounded-xl border border-slate-700/40">
          <p class="text-slate-500 font-medium mb-1">Batch</p>
          <p class="text-slate-200 font-semibold">${data.batch || '-'}</p>
        </div>
        <div class="bg-slate-900/50 p-3 rounded-xl border border-slate-700/40">
          <p class="text-slate-500 font-medium mb-1">Vendor</p>
          <p class="text-slate-200 font-semibold">${data.vendor || '-'}</p>
        </div>
        <div class="bg-slate-900/50 p-3 rounded-xl border border-slate-700/40">
          <p class="text-slate-500 font-medium mb-1">Team Leader</p>
          <p class="text-slate-200 font-semibold">${data.team_leader || '-'}</p>
        </div>
        <div class="bg-slate-900/50 p-3 rounded-xl border border-slate-700/40">
          <p class="text-slate-500 font-medium mb-1">Tanggal Lahir</p>
          <p class="text-slate-200 font-semibold">${data.ttl ? String(data.ttl).substring(0,10) : '-'}</p>
        </div>
      </div>

      <div class="bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/40 text-xs">
        <p class="text-slate-500 font-medium mb-1">Keterangan / Biodata</p>
        <p class="text-slate-300 leading-relaxed">${data.keterangan || 'Tidak ada keterangan tambahan.'}</p>
      </div>
    `;

    modal.classList.remove("hidden");
    lucide.createIcons();
  },

  handlePhotoUpload(event, agentId) {
    const file = event.target.files[0];
    if (!file) return;

    const btnLabel = document.getElementById("btn-upload-label");
    const statusMsg = document.getElementById("upload-status-msg");

    btnLabel.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Mengompres...`;
    lucide.createIcons();

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Auto Compress via Canvas (Max 350px width/height)
        const canvas = document.createElement("canvas");
        const maxDim = 350;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const base64Data = canvas.toDataURL("image/jpeg", 0.85);

        // Upload ke Backend GAS
        btnLabel.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Mengunggah...`;
        lucide.createIcons();

        fetch(CONFIG.API_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "uploadPhoto",
            agentId: agentId,
            base64Data: base64Data
          })
        })
        .then(res => res.json())
        .then(res => {
          if (res.status === "success") {
            statusMsg.className = "text-xs p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
            statusMsg.innerText = "Foto profil berhasil diunggah!";
            statusMsg.classList.remove("hidden");

            // Update Avatar di Modal secara instant
            document.getElementById("modal-avatar-container").innerHTML = `
              <img src="${res.photoUrl}" class="w-16 h-16 rounded-2xl object-cover border border-slate-600">
            `;
            
            // Refresh halaman belakang
            setTimeout(() => {
              StructureModule.render(document.getElementById("app-content"));
            }, 1000);
          } else {
            statusMsg.className = "text-xs p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20";
            statusMsg.innerText = res.message || "Gagal mengunggah foto.";
            statusMsg.classList.remove("hidden");
          }
        })
        .catch(err => {
          statusMsg.className = "text-xs p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20";
          statusMsg.innerText = "Error koneksi saat mengunggah.";
          statusMsg.classList.remove("hidden");
        })
        .finally(() => {
          btnLabel.innerHTML = `<i data-lucide="camera" class="w-3.5 h-3.5"></i> Ubah Foto`;
          lucide.createIcons();
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  closeModal() {
    document.getElementById("profile-modal").classList.add("hidden");
  }
};

// ===== PATCH UPLOAD FOTO =====
// 'form' = form-urlencoded (e.parameter di GAS) | 'json' = JSON string (JSON.parse(e.postData.contents))
window.STRUCT_UPLOAD_MODE = 'json';

// Simpan container biar bisa render ulang setelah upload
(function () {
  const origRender = StructureModule.render;
  StructureModule.render = async function (container) {
    if (container) StructureModule._container = container;
    return origRender.call(this, container);
  };
})();

StructureModule.compressImage = function (file, maxDim = 350) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal baca file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('File bukan gambar valid'));
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h) {
          if (w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
        } else if (h > maxDim) {
          w = Math.round(w * maxDim / h); h = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

StructureModule.handlePhotoUpload = async function (event, agentId) {
  const input = event.target;
  const file = input.files[0];
  if (!file) return;

  const btn = document.getElementById('btn-upload-label');
  const status = document.getElementById('upload-status-msg');
  const idleHtml = btn ? btn.innerHTML : '';

  const setStatus = (type, msg) => {
    if (!status) return;
    const c = {
      info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      ok: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      err: 'bg-red-500/10 text-red-400 border-red-500/20'
    }[type];
    status.className = `text-xs p-3 rounded-xl border ${c}`;
    status.innerText = msg;
  };

  try {
    if (btn) btn.innerHTML = 'Mengompres...';
    setStatus('info', 'Mengompres foto...');
    const base64Data = await StructureModule.compressImage(file, 350);

    setStatus('info', 'Mengunggah foto baru...');
    const payload = { action: 'uploadPhoto', agent_id: agentId, image: base64Data };
    const body = window.STRUCT_UPLOAD_MODE === 'json'
      ? JSON.stringify(payload)
      : new URLSearchParams(payload);

    const res = await fetch(CONFIG.API_URL, { method: 'POST', body });
    const text = await res.text();

    let data;
    try { data = JSON.parse(text); }
    catch (e) { throw new Error('Respons GAS bukan JSON: ' + text.slice(0, 100)); }

    if (!(data && (data.status === 'success' || data.photo_url))) {
      throw new Error((data && data.message) || 'Gagal menyimpan foto');
    }

    // Update preview di modal
    const newSrc = data.photo_url || base64Data;
    const holder = document.getElementById('modal-avatar-container');
    if (holder) {
      holder.innerHTML = `<img src="${newSrc}" class="w-16 h-16 rounded-2xl object-cover border border-slate-600">`;
    }
    setStatus('ok', 'Foto berhasil diperbarui!');

    // Render ulang list biar kartu ikut update
    const c = StructureModule._container;
    if (c) setTimeout(() => StructureModule.render(c), 1200);
  } catch (err) {
    console.error('Upload foto error:', err);
    setStatus('err', 'Error: ' + err.message);
  } finally {
    if (btn) btn.innerHTML = idleHtml;
    input.value = '';
    if (window.lucide) lucide.createIcons();
  }
};
