document.addEventListener("DOMContentLoaded", () => {
  initThemeEngine();
  checkAuthSession();
});

function initThemeEngine() {
  const isDark = localStorage.getItem("app_dark_mode") !== "false";
  const accent = localStorage.getItem("app_accent") || "blue";

  const darkIcon = document.getElementById("theme-icon-dark");
  const lightIcon = document.getElementById("theme-icon-light");

  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    if (darkIcon) darkIcon.classList.remove("hidden");
    if (lightIcon) lightIcon.classList.add("hidden");
  } else {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
    if (darkIcon) darkIcon.classList.add("hidden");
    if (lightIcon) lightIcon.classList.remove("hidden");
  }

  setAccentTheme(accent, false);
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.contains("dark");
  localStorage.setItem("app_dark_mode", !isDark);
  initThemeEngine();
}

function setAccentTheme(color, close = true) {
  localStorage.setItem("app_accent", color);
  const root = document.documentElement;

  const colorMap = {
    blue: { 500: '#2563eb', 600: '#1d4ed8', glow: 'rgba(37, 99, 235, 0.25)' },
    emerald: { 500: '#10b981', 600: '#059669', glow: 'rgba(16, 185, 129, 0.25)' },
    purple: { 500: '#a855f7', 600: '#9333ea', glow: 'rgba(168, 85, 247, 0.25)' },
    orange: { 500: '#f97316', 600: '#ea580c', glow: 'rgba(249, 115, 22, 0.25)' }
  };

  const selected = colorMap[color] || colorMap.blue;
  root.style.setProperty('--brand-500', selected[500]);
  root.style.setProperty('--brand-600', selected[600]);
  root.style.setProperty('--brand-glow', selected.glow);

  if (close) closeSettingsModal();
}

function openSettingsModal() {
  document.getElementById("settings-modal").classList.remove("hidden");
}

function closeSettingsModal() {
  document.getElementById("settings-modal").classList.add("hidden");
}

function filterSidebarMenu() {
  const query = document.getElementById("menu-search").value.toLowerCase();
  const buttons = document.querySelectorAll("#sidebar-nav-list button");

  buttons.forEach(btn => {
    const text = btn.innerText.toLowerCase();
    if (text.includes(query)) {
      btn.classList.remove("hidden");
    } else {
      btn.classList.add("hidden");
    }
  });
}

function checkAuthSession() {
  const user = Auth.getUser();
  const overlay = document.getElementById("login-overlay");
  const authContainer = document.getElementById("sidebar-auth-container");
  
  if (!user) {
    if (overlay) overlay.classList.remove("hidden");
    showAuthScreen('login');

    if (authContainer) {
      authContainer.innerHTML = `
        <button onclick="showAuthScreen('login')" 
                class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-brand-glow">
          <i data-lucide="log-in" class="w-4 h-4"></i>
          <span>Login Ke Akun</span>
        </button>
      `;
    }
  } else {
    if (overlay) overlay.classList.add("hidden");
    const initial = user.username ? user.username.substring(0, 2).toUpperCase() : 'US';
    const roleTitle = user.role === "TL" ? "Team Leader" : "Agent";
    
    if (authContainer) {
      authContainer.innerHTML = `
        <div class="flex items-center justify-between p-2.5 bg-slate-900/60 light:bg-white rounded-xl border border-white/10 light:border-slate-200 shadow-sm w-full">
          <div class="flex items-center gap-2.5 overflow-hidden">
            <div class="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-500 shrink-0">
              ${initial}
            </div>
            <div class="truncate">
              <p class="text-xs font-bold text-white light:text-slate-900 truncate">${user.username}</p>
              <p class="text-[10px] text-brand-500 font-medium truncate">${roleTitle}</p>
            </div>
          </div>
          
          <button onclick="Auth.logout()" title="Logout Sesi" 
                  class="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition shrink-0">
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </button>
        </div>
      `;
    }
  }

  if (window.lucide) lucide.createIcons();
  switchTab("structure");
}

function showAuthScreen(screen) {
  const overlay = document.getElementById("login-overlay");
  const formLogin = document.getElementById("form-login");
  const formForgot = document.getElementById("form-forgot");
  const formReset = document.getElementById("form-reset");
  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");

  if (overlay) overlay.classList.remove("hidden");
  if (formLogin) formLogin.classList.add("hidden");
  if (formForgot) formForgot.classList.add("hidden");
  if (formReset) formReset.classList.add("hidden");

  if (screen === 'login' && formLogin) {
    title.innerText = "Login Dashboard";
    subtitle.innerText = "Masukkan akun terdaftar untuk mengakses sistem";
    formLogin.classList.remove("hidden");
  } else if (screen === 'forgot' && formForgot) {
    title.innerText = "Lupa Password";
    subtitle.innerText = "Masukkan email untuk menerima kode verifikasi OTP";
    formForgot.classList.remove("hidden");
  } else if (screen === 'reset' && formReset) {
    title.innerText = "Reset Password";
    subtitle.innerText = "Masukkan OTP dari email beserta password baru kamu";
    formReset.classList.remove("hidden");
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const userErr = document.getElementById("login-error");
  const btn = document.getElementById("btn-login-submit");
  
  userErr.classList.add("hidden");
  btn.innerText = "Memverifikasi...";
  btn.disabled = true;

  const res = await Auth.login(
    document.getElementById("login-username").value,
    document.getElementById("login-password").value
  );

  btn.innerText = "Masuk ke Dashboard";
  btn.disabled = false;

  if (res.status === "success") {
    checkAuthSession();
  } else {
    userErr.innerText = res.message;
    userErr.classList.remove("hidden");
  }
}

async function handleForgotSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("forgot-email").value;
  const msg = document.getElementById("forgot-msg");
  const btn = document.getElementById("btn-forgot-submit");

  btn.innerText = "Mengirim OTP...";
  btn.disabled = true;

  const res = await Auth.requestOTP(email);

  btn.innerText = "Kirim Kode OTP";
  btn.disabled = false;

  msg.className = `text-xs p-3 rounded-xl ${res.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`;
  msg.innerText = res.message;
  msg.classList.remove("hidden");

  if (res.status === "success") {
    setTimeout(() => showAuthScreen('reset'), 1500);
  }
}

async function handleResetSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("forgot-email").value;
  const otp = document.getElementById("reset-otp").value;
  const newPwd = document.getElementById("reset-new-password").value;
  const msg = document.getElementById("reset-msg");
  const btn = document.getElementById("btn-reset-submit");

  btn.innerText = "Memproses...";
  btn.disabled = true;

  const res = await Auth.verifyOTPAndReset(email, otp, newPwd);

  btn.innerText = "Simpan Password Baru";
  btn.disabled = false;

  msg.className = `text-xs p-3 rounded-xl ${res.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`;
  msg.innerText = res.message;
  msg.classList.remove("hidden");

  if (res.status === "success") {
    setTimeout(() => showAuthScreen('login'), 2000);
  }
}

function switchTab(tabName) {
  const contentArea = document.getElementById("app-content");
  const pageTitle = document.getElementById("page-title");
  
  ["structure", "schedule", "kpi"].forEach(tab => {
    const navBtn = document.getElementById(`nav-${tab}`);
    if (navBtn) {
      if (tab === tabName) {
        navBtn.className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-brand-500 bg-brand-500/10 border border-brand-500/20 shadow-sm";
      } else {
        navBtn.className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-slate-400 light:text-slate-600 hover:text-white hover:bg-white/5";
      }
    }
  });

  if (!contentArea) return;

  contentArea.classList.remove("page-enter");
  contentArea.classList.add("page-exit");

  setTimeout(() => {
    contentArea.innerHTML = `
      <div class="space-y-4 animate-pulse">
        <div class="h-16 bg-slate-900/60 rounded-2xl border border-white/5 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="h-24 bg-slate-900/60 rounded-2xl border border-white/5 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
          <div class="h-24 bg-slate-900/60 rounded-2xl border border-white/5 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
          <div class="h-24 bg-slate-900/60 rounded-2xl border border-white/5 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
          <div class="h-24 bg-slate-900/60 rounded-2xl border border-white/5 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        </div>
        <div class="h-64 bg-slate-900/60 rounded-2xl border border-white/5 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        </div>
      </div>
    `;

    if (tabName === "structure" && typeof StructureModule !== 'undefined') {
      if (pageTitle) pageTitle.innerText = "Profil Tim";
      StructureModule.render(contentArea);
    } else if (tabName === "schedule" && typeof ScheduleModule !== 'undefined') {
      if (pageTitle) pageTitle.innerText = "Schedule Agent";
      ScheduleModule.render(contentArea);
    } else if (tabName === "kpi" && typeof KPIModule !== 'undefined') {
      if (pageTitle) pageTitle.innerText = "KPI Performance";
      KPIModule.render(contentArea);
    }

    contentArea.classList.remove("page-exit");
    contentArea.classList.add("page-enter");
    if (window.lucide) lucide.createIcons();
  }, 200);
}

let sidebarOpen = true;
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const openBtn = document.getElementById('btn-sidebar-open');
  
  sidebarOpen = !sidebarOpen;
  if (sidebarOpen) {
    sidebar.style.transform = 'translateX(0)';
    sidebar.style.marginRight = '0';
    if (openBtn) openBtn.classList.add('hidden');
  } else {
    sidebar.style.transform = 'translateX(-100%)';
    sidebar.style.marginRight = '-16rem';
    if (openBtn) openBtn.classList.remove('hidden');
  }
}
