
/* ═══════════════════════════════════════════════════════════
   STATE & CONFIG
   ═══════════════════════════════════════════════════════════ */
const API = '/api';
let currentUser = null;
let activeDeviceId = null; // Menyimpan ID perangkat yang sedang dipilih
let currentPage = 'dashboard';
let liveInterval = null;
let sensorHistory = { temperature:[], humidity:[], gas:[] };
const MAX_HISTORY = 20;

/* ═══════════════════════════════════════════════════════════
   API HELPERS
   ═══════════════════════════════════════════════════════════ */
async function api(method, path, body) {
  try {
    const res = await fetch(API + path, {
      method,
      headers: body ? {'Content-Type':'application/json'} : {},
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    
    // Perbaikan Bug 1: Jangan return null! Biarkan JSON-nya dibaca agar pesan error dapat ditangkap frontend.
    // Kita hanya logout otomatis jika 401 terjadi BUKAN di halaman login.
    if (res.status === 401 && path !== '/users/login') { 
        logout(); 
    }
    
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return { ok: res.ok, status: res.status };
    
    const data = await res.json();
    
    // Perbaikan Bug 2: HAPUS renderPrediction(data) dari sini!
    
    return { ok: res.ok, status: res.status, data };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

const GET  = (p)    => api('GET', p);
const POST = (p, b) => api('POST', p, b);
const PUT  = (p, b) => api('PUT', p, b);
const DEL  = (p)    => api('DELETE', p);

/* ═══════════════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════════════ */
function toast(msg, type='info', duration=3500) {
  const icons = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||'•'}</span> <span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(24px)'; el.style.transition='.3s'; setTimeout(()=>el.remove(), 300); }, duration);
}

/* ═══════════════════════════════════════════════════════════
   MODAL
   ═══════════════════════════════════════════════════════════ */
function openModal(title, sub, content, buttons) {
  closeModal();
  const html = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal">
        <div class="modal-title">${title}</div>
        <div class="modal-sub">${sub}</div>
        ${content}
        <div class="flex gap-2 mt-4 justify-between">
          ${buttons}
          <button class="btn btn-ghost" onclick="closeModal()">Tutup</button>
        </div>
      </div>
    </div>`;
  document.getElementById('modal-container').innerHTML = html;
}
function closeModal() { document.getElementById('modal-container').innerHTML = ''; }

/* ═══════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════ */
// === FUNGSI PINDAH DARI ARTIKEL KE LOGIN ===
function goToLogin() {
  document.getElementById('landing-page').classList.add('hidden');

  const auth = document.getElementById('auth-page');
  auth.style.display = 'flex';
  auth.classList.remove('hidden');
}

function goToDemo() {
    const demoSection = document.getElementById("demo-ai");

    if (demoSection) {
        demoSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

const API_URL = "http://127.0.0.1:8000/prediction/predict";

async function predictDemo() {

    const response = await fetch(API_URL,{
    method:"POST",
    headers:{
        "Content-Type":"application/json"
    },
    body:JSON.stringify({
        temperature,
        mc,
        ammonia
    })
});

const data = await response.json();

console.log(response.status);
console.log(JSON.stringify(data, null, 2));

if (!response.ok) {
    alert(JSON.stringify(data, null, 2));
    return;
}

renderPrediction(data);

}

function renderPrediction(data) {

    const box = document.getElementById("predictionResult");

    let color = "#22c55e";
    let icon = "🟢";

    if (data.label === "Mentah") {

        color = "#ef4444";
        icon = "🔴";

    }

    if (data.label === "Fase Termofilik") {

        color = "#f59e0b";
        icon = "🟠";

    }

    box.innerHTML = `

    <div class="result-card">

        <div class="score-circle"
            style="border-color:${color};color:${color};">

            ${data.score.toFixed(1)}

        </div>

        <h2 style="color:${color}">

            ${icon} ${data.label}

        </h2>

        <p>

            Confidence :
            <b>${data.confidence}%</b>

        </p>

        <hr>

        <div class="parameter-list">

            <div>

                🌡 Temperature

                <span>

                    ${data.analysis.temperature.status}

                </span>

            </div>

            <div>

                💧 Moisture

                <span>

                    ${data.analysis.mc.status}

                </span>

            </div>

            <div>

                ☁ Ammonia

                <span>

                    ${data.analysis.ammonia.status}

                </span>

            </div>

        </div>

        <hr>

        <div class="recommendation">

            <h4>Rekomendasi AI</h4>

            <ul>

                ${data.recommendation.map(item => `<li>✔ ${item}</li>`).join("")}

            </ul>

        </div>

    </div>

    `;

}

function backToBlog() {
  document.getElementById('auth-page').classList.add('hidden');
  document.getElementById('landing-page').classList.remove('hidden');
}


function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t,i) => t.classList.toggle('active', (tab==='login'&&i===0)||(tab==='register'&&i===1)));
  document.getElementById('login-form').classList.toggle('hidden', tab!=='login');
  document.getElementById('register-form').classList.toggle('hidden', tab!=='register');
}



// Pastikan Anda sudah memiliki fungsi helper POST yang benar (Contoh)
// async function POST(endpoint, data) { ... }

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    errEl.classList.add('hidden');
    
    if (!email || !password) { 
        showErr(errEl, 'Email dan password wajib diisi.'); 
        return; 
    }

    btn.classList.add('btn-loading'); 
    btn.disabled = true;

    // Fetch otomatis ditembak ke /api/users/login (berkat helper API)
    const r = await POST('/users/login', { email, password }); 
    
    btn.classList.remove('btn-loading'); 
    btn.disabled = false;

    if (!r || !r.ok) {
        // Sekarang error dari FastAPI bisa terbaca sempurna!
        const errorMsg = r?.data?.detail || 'Email atau password salah.';
        showErr(errEl, errorMsg);
        return;
    }

    currentUser = r.data;
    enterApp();
}

async function handleRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;
  const errEl    = document.getElementById('reg-error');
  const btn      = document.getElementById('reg-btn');

  errEl.classList.add('hidden');
  if (!name||!email||!password) { showErr(errEl,'Semua field wajib diisi.'); return; }
  if (password !== confirm)      { showErr(errEl,'Password tidak cocok.'); return; }
  if (password.length < 6)      { showErr(errEl,'Password minimal 6 karakter.'); return; }

  btn.classList.add('btn-loading'); 
  btn.disabled = true;
  
  // Mengirim data register sebagai JSON
  const r = await POST('/users/register', { 
      name: name, 
      email: email, 
      password: password, 
      confirm_password: confirm 
  });
  
  btn.classList.remove('btn-loading'); 
  btn.disabled = false;

  if (!r || !r.ok) {
    showErr(errEl, r?.data?.detail || 'Pendaftaran gagal.');
    return;
  }
  
  toast('Akun berhasil dibuat! Silakan login.', 'success');
  switchAuthTab('login');
  document.getElementById('login-email').value = email;
}

function showErr(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function handleLogout() {
  await POST('/users/logout');
  logout();
}

function logout() {
  currentUser = null;
  stopLive();
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('auth-page').classList.remove('hidden');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

/* ═══════════════════════════════════════════════════════════
   APP SHELL
   ═══════════════════════════════════════════════════════════ */
function enterApp() {
  document.getElementById('auth-page').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');

  const av = document.getElementById('sidebar-avatar');
  const nm = document.getElementById('sidebar-name');
  const rl = document.getElementById('sidebar-role');
  av.textContent = (currentUser.name||'U')[0].toUpperCase();
  nm.textContent = currentUser.name || 'User';
  rl.textContent = currentUser.role || 'user';

  if (currentUser.role === 'admin') {
    document.getElementById('nav-admin-section').classList.remove('hidden');
  }

  navigate('dashboard');
}

function navigate(page) {
  currentPage = page;
  stopLive();

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.getElementById('nav-' + page);
  if (nav) nav.classList.add('active');

  const titles = {
    dashboard:'⬡ Dashboard', devices:'📟 Perangkat IoT', monitoring:'📊 Monitoring Real-time',
    ml:'🤖 ML & Klasifikasi', dss:'🌿 Rekomendasi DSS', reports:'📄 Ekspor Laporan',
    admin:'⚙ Manajemen User', profile:'👤 Profil Saya', 
    feedback:'📥 Kotak Masuk Masukan' // <-- TAMBAHAN BARU: Judul untuk Topbar
  };
  document.getElementById('topbar-title').textContent = titles[page] || page;

  const pages = { 
    dashboard: renderDashboard, devices: renderDevices, monitoring: renderMonitoring,
    ml: renderML, dss: renderDSS, reports: renderReports, admin: renderAdmin, profile: renderProfile, 
    feedback: renderAdminFeedbackPage // <-- TAMBAHAN BARU: Memanggil fungsi render
  };
  
  const fn = pages[page];
  if (fn) fn();
}

function changeActiveDevice(deviceId) {
  activeDeviceId = deviceId;
  refreshCurrentPage(); // Otomatis me-refresh grafik saat alat diganti
}

function refreshCurrentPage() { navigate(currentPage); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

function changeActiveDevice(deviceId) {
  activeDeviceId = deviceId;
  refreshCurrentPage(); // Otomatis me-refresh grafik saat alat diganti
}

function refreshCurrentPage() { navigate(currentPage); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

/* ═══════════════════════════════════════════════════════════
   PAGE: DASHBOARD
   ═══════════════════════════════════════════════════════════ */
async function renderDashboard() {
  setContent(`<div style="text-align:center;padding:40px;color:var(--text3)">Memuat data...</div>`);

  // 1. Ambil daftar alat milik user
  const devR = await GET('/devices/');
  const devices = devR?.data || [];
  
  // Jika belum ada alat yang dipilih, otomatis pilih alat pertama
  if (!activeDeviceId && devices.length > 0) {
    activeDeviceId = devices[0].id;
  }

  // 2. Buat HTML untuk Dropdown Pilihan Alat
  let deviceSelectHtml = `<select class="form-input btn-sm" style="min-width:200px" onchange="changeActiveDevice(this.value)">`;
  if (devices.length === 0) {
    deviceSelectHtml += `<option value="">-- Anda Belum Punya Alat --</option>`;
  } else {
    devices.forEach(d => {
      deviceSelectHtml += `<option value="${d.id}" ${activeDeviceId == d.id ? 'selected' : ''}>📟 ${d.name}</option>`;
    });
  }
  deviceSelectHtml += `</select>`;

  // 3. Tempelkan parameter device_id di akhir URL jika ada
  const qs = activeDeviceId ? `?device_id=${activeDeviceId}` : '';

  // 4. Tembak API dengan spesifik membawa ID alat yang dipilih
  const [latestR, predR] = await Promise.all([
    GET(`/monitoring/latest${qs}`),
    GET(`/ml/latest${qs}`) 
  ]);

  const s = latestR?.data;
  const p = predR?.data;

  const tempStatus = s ? (s.temperature > 65 ? 'danger' : s.temperature < 40 ? 'warn' : 'ok') : '';
  const humStatus  = s ? (s.humidity < 40 ? 'danger' : s.humidity > 70 ? 'warn' : 'ok') : '';
  const gasStatus  = s ? (s.gas > 500 ? 'danger' : s.gas > 300 ? 'warn' : 'ok') : '';

  const phaseIcons = { awal:'🌱', aktif:'🔥', matang:'✅' };
  const matPct = p?.maturity ?? 0;
  const matColor = matPct < 30 ? 'red' : matPct < 60 ? 'amber' : matPct < 85 ? 'amber' : 'green';
  const ts = s?.timestamp ? new Date(s.timestamp).toLocaleString('id-ID') : '—';

  setContent(`
    <div class="section-header mb-4">
      <div>
        <div class="section-title">Dashboard Sistem</div>
        <div class="text-sm text-muted text-mono mt-2">
          ${s ? `<span class="live-dot"></span>Update terakhir: ${ts}` : 'Belum ada data sensor'}
        </div>
      </div>
      <div class="flex gap-2 items-center">
        ${deviceSelectHtml} <!-- TAMPILKAN DROPDOWN DI SINI -->
        <button class="btn btn-secondary btn-sm" onclick="navigate('monitoring')">📊 Monitoring</button>
        <button class="btn btn-primary btn-sm" onclick="navigate('ml')">🤖 Analisis ML</button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card ${tempStatus}">
        <div class="stat-icon">🌡️</div>
        <div class="stat-label">Suhu</div>
        <div class="stat-value">${s ? s.temperature.toFixed(1) : '—'}</div>
        <div class="stat-unit">°C</div>
        ${s ? `<div class="stat-trend mt-2 ${tempStatus==='danger'?'trend-up':tempStatus==='warn'?'trend-up':'trend-stable'}">
          ${tempStatus==='danger'?'▲ Terlalu tinggi':tempStatus==='warn'?'▼ Terlalu rendah':'● Normal'}
        </div>` : ''}
      </div>
      <div class="stat-card ${humStatus}">
        <div class="stat-icon">💧</div>
        <div class="stat-label">Kelembapan</div>
        <div class="stat-value">${s ? s.humidity.toFixed(1) : '—'}</div>
        <div class="stat-unit">%</div>
        ${s ? `<div class="stat-trend mt-2 ${humStatus==='danger'?'trend-up':humStatus==='warn'?'trend-up':'trend-stable'}">
          ${humStatus==='danger'?'▼ Terlalu kering':humStatus==='warn'?'▲ Terlalu basah':'● Normal'}
        </div>` : ''}
      </div>
      <div class="stat-card ${gasStatus}">
        <div class="stat-icon">🔬</div>
        <div class="stat-label">Gas Metana</div>
        <div class="stat-value">${s ? s.gas.toFixed(0) : '—'}</div>
        <div class="stat-unit">ppm</div>
        ${s ? `<div class="stat-trend mt-2 ${gasStatus==='danger'?'trend-up':gasStatus==='warn'?'trend-up':'trend-stable'}">
          ${gasStatus==='danger'?'▲ Berlebih':gasStatus==='warn'?'▲ Perhatikan':'● Normal'}
        </div>` : ''}
      </div>
      <div class="stat-card ${matColor==='green'?'ok':matColor==='amber'?'warn':'danger'}">
        <div class="stat-icon">${p ? (phaseIcons[p.phase]||'🌿') : '🌿'}</div>
        <div class="stat-label">Kematangan</div>
        <div class="stat-value">${p ? matPct.toFixed(0) : '—'}</div>
        <div class="stat-unit">%</div>
        ${p ? `<div class="mt-2"><div class="progress-wrap"><div class="progress-bar progress-${matColor}" style="width:${matPct}%"></div></div></div>` : ''}
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Fase Kompos</div>
            <div class="card-subtitle">Hasil klasifikasi ML terbaru</div>
          </div>
          ${p ? `<span class="badge badge-${p.phase==='matang'?'green':p.phase==='aktif'?'amber':'blue'}">${phaseIcons[p.phase]} ${p.phase_label || p.phase}</span>` : ''}
        </div>
        ${p ? `
          <div class="phase-timeline">
            <div class="phase-step ${p.phase==='awal'?'active':''}">
              <div class="phase-step-icon">🌱</div>
              <div class="phase-step-name">Awal</div>
            </div>
            <div class="phase-step ${p.phase==='aktif'?'active':''}">
              <div class="phase-step-icon">🔥</div>
              <div class="phase-step-name">Aktif</div>
            </div>
            <div class="phase-step ${p.phase==='matang'?'active':''}">
              <div class="phase-step-icon">✅</div>
              <div class="phase-step-name">Matang</div>
            </div>
          </div>
          <div class="text-sm text-muted mt-2">${p.phase_description || 'Klik Analisis ML untuk detail.'}</div>
          <div class="text-xs text-mono text-muted mt-2">Dianalisis: ${new Date(p.created_at).toLocaleString('id-ID')}</div>
        ` : `
          <div style="text-align:center;padding:24px;color:var(--text3)">
            Belum ada prediksi.<br>
            <button class="btn btn-primary btn-sm mt-3" onclick="navigate('ml')">Jalankan ML →</button>
          </div>`}
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Aksi Cepat</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-secondary w-full" onclick="navigate('monitoring')" style="justify-content:flex-start;gap:12px">
            📊 <span>Lihat Monitoring Real-time</span>
          </button>
          <button class="btn btn-secondary w-full" onclick="runMLFromDashboard()" style="justify-content:flex-start;gap:12px" id="dash-ml-btn">
            🤖 <span>Jalankan Prediksi ML</span>
          </button>
          <button class="btn btn-secondary w-full" onclick="navigate('dss')" style="justify-content:flex-start;gap:12px">
            🌿 <span>Lihat Rekomendasi DSS</span>
          </button>
          <button class="btn btn-secondary w-full" onclick="navigate('devices')" style="justify-content:flex-start;gap:12px">
            📟 <span>Kelola Perangkat IoT</span>
          </button>
          <button class="btn btn-secondary w-full" onclick="exportReport()" style="justify-content:flex-start;gap:12px">
            📄 <span>Ekspor Laporan CSV</span>
          </button>
        </div>
      </div>
    </div>

    ${!s ? `<div class="alert alert-info mt-4">
      ℹ️ Belum ada data sensor. Hubungkan perangkat IoT di menu <b>Perangkat IoT</b> atau kirim data via <code>POST /api/iot/data</code>.
    </div>` : ''}
  `);
}

async function runMLFromDashboard() {
  const btn = document.getElementById('dash-ml-btn');
  if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }
  const r = await POST('/ml/predict?last_n=20');
  if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  if (r?.ok) {
    toast('Prediksi ML berhasil!', 'success');
    renderDashboard();
  } else {
    toast(r?.data?.detail || 'Gagal menjalankan ML', 'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   PAGE: DEVICES
   ═══════════════════════════════════════════════════════════ */
async function renderDevices() {
  setContent(`<div style="text-align:center;padding:40px;color:var(--text3)">Memuat perangkat...</div>`);
  const r = await GET('/devices/');
  const devices = r?.data || [];

  let deviceListHtml = '';
  if (devices.length === 0) {
    deviceListHtml = `
      <div class="card" style="text-align:center;padding:40px;color:var(--text3)">
        📟 Belum ada perangkat terdaftar.<br>
        <span class="text-sm">Scan jaringan atau daftarkan perangkat secara manual.</span>
      </div>
    `;
  } else {
    deviceListHtml = `
      <div class="device-grid">
        ${devices.map(d => {
          const lastSeen = d.last_seen ? new Date(d.last_seen) : null;
          const minsAgo = lastSeen ? Math.floor((Date.now() - lastSeen.getTime()) / 60000) : null;
          const online = minsAgo !== null && minsAgo < 5;
          return `
            <div class="device-card ${online ? 'online' : 'offline'}">
              <div class="flex justify-between items-center mb-2">
                <div class="device-status">
                  <div class="status-dot ${online?'online':'offline'}"></div>
                  ${online ? 'Online' : 'Offline'}
                </div>
                <div class="flex gap-2">
                  <button class="btn btn-ghost btn-sm" onclick="pingDevice(${d.id})">Ping</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteDevice(${d.id}, '${d.name}')">Hapus</button>
                </div>
              </div>
              <div class="font-bold" style="margin-bottom:4px">${d.name}</div>
              <div class="device-ip">${d.ip_address || '-'}</div>
              <div class="text-xs text-muted">${d.location || 'Lokasi tidak diset'}</div>
              <!-- [PERBAIKAN] Tampilkan Device Token di sini -->
              <div class="text-xs mt-2" style="background:var(--bg3);padding:4px 6px;border-radius:4px;user-select:all;border:1px dashed var(--border)">
                <span class="text-muted">Token:</span> <code style="color:var(--accent)">${d.device_token}</code>
              </div>
              <div class="text-xs text-mono text-muted mt-2">
                ${lastSeen ? `Terakhir: ${lastSeen.toLocaleString('id-ID')}` : 'Belum ada koneksi'}
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  }

  setContent(`
    <div class="section-header">
      <div>
        <div class="section-title">Perangkat IoT</div>
        <div class="text-sm text-muted mt-2">Deteksi otomatis perangkat di jaringan lokal</div>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" onclick="scanDevices()" id="scan-btn">🔍 Scan Jaringan</button>
        <button class="btn btn-primary" onclick="showRegisterDevice()">+ Daftarkan</button>
      </div>
    </div>

    <div id="scan-result" class="hidden mb-4"></div>

    <div class="mb-4">
      <div class="text-xs text-muted text-mono mb-3">PERANGKAT TERDAFTAR (${devices.length})</div>
      ${deviceListHtml}
    </div>

    <div class="card">
      <div class="card-title mb-2">Kirim Data Sensor Manual</div>
      <div class="card-subtitle mb-3">Simulasikan pengiriman data dari perangkat IoT</div>
      
      <!-- [PERBAIKAN] Tambahkan Dropdown Pilihan Alat -->
      <div class="form-group mb-3">
        <label class="form-label">Pilih Perangkat Pengirim</label>
        ${devices.length > 0 
          ? `<select id="iot-device-token" class="form-input">
               ${devices.map(d => `<option value="${d.device_token}">${d.name}</option>`).join('')}
             </select>`
          : `<div class="alert alert-error text-xs">Anda harus mendaftarkan perangkat terlebih dahulu!</div>`
        }
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Suhu (°C)</label>
          <input id="iot-temp" type="number" step="0.1" class="form-input" placeholder="62.5" value="62.5"/>
        </div>
        <div class="form-group">
          <label class="form-label">Kelembapan (%)</label>
          <input id="iot-hum" type="number" step="0.1" class="form-input" placeholder="45.0" value="45.0"/>
        </div>
      </div>
      <div class="flex gap-2">
        <div class="form-group" style="flex:1">
          <label class="form-label">Gas Metana (ppm)</label>
          <input id="iot-gas" type="number" step="1" class="form-input" placeholder="380" value="380"/>
        </div>
        <div style="display:flex;align-items:flex-end;padding-bottom:16px">
          <button class="btn btn-primary" onclick="sendSensorData()" id="send-btn" ${devices.length === 0 ? 'disabled' : ''}>Kirim Data</button>
        </div>
      </div>
      <div id="iot-result" class="hidden mt-3"></div>
    </div>
  `);
}

async function scanDevices() {
  const btn = document.getElementById('scan-btn');
  btn.classList.add('btn-loading'); btn.disabled = true;
  btn.textContent = 'Scanning...';

  const r = await GET('/devices/scan');
  btn.classList.remove('btn-loading'); btn.disabled = false;
  btn.innerHTML = '🔍 Scan Jaringan';

  const el = document.getElementById('scan-result');
  if (!el) return;
  el.classList.remove('hidden');

  if (!r?.ok) {
    el.innerHTML = `<div class="alert alert-error">Gagal scan jaringan.</div>`;
    return;
  }
  const found = r.data?.found || [];
  el.innerHTML = `
    <div class="alert alert-info">
      🔍 Scan selesai. Ditemukan <b>${found.length}</b> port aktif dari ${r.data?.scanned} host yang diperiksa.
      ${found.length > 0 ? `<div class="mt-2 text-mono text-xs">${found.map(f=>`${f.ip}:${f.port}`).join(' · ')}</div>` : ''}
    </div>`;
}

async function pingDevice(id) {
  const r = await PUT(`/devices/${id}/ping`);
  if (r?.ok) { toast('Ping berhasil! Status diperbarui.', 'success'); renderDevices(); }
  else toast('Ping gagal.', 'error');
}

async function deleteDevice(id, name) {
  if (!confirm(`Apakah Anda yakin ingin menghapus perangkat "${name}"?`)) {
    return;
  }
  const r = await DEL(`/devices/${id}`);
  if (r?.ok) {
    toast('Perangkat berhasil dihapus!', 'success');
    renderDevices(); 
  } else {
    toast(r?.data?.detail || 'Gagal menghapus perangkat.', 'error');
  }
}

function showRegisterDevice() {
  openModal(
    'Daftarkan Perangkat IoT',
    'Masukkan detail perangkat yang akan dihubungkan',
    `<div class="form-group"><label class="form-label">Nama Perangkat</label>
     <input id="dev-name" class="form-input" placeholder="Sensor Kompos #1" value="Sensor Kompos #1"/></div>
     <div class="form-group"><label class="form-label">Alamat IP</label>
     <input id="dev-ip" class="form-input" placeholder="192.168.1.50" value="192.168.1.50"/></div>
     <div class="form-group"><label class="form-label">Lokasi</label>
     <input id="dev-loc" class="form-input" placeholder="Bak Kompos A"/></div>`,
    `<button class="btn btn-primary" onclick="registerDevice()">Daftarkan</button>`
  );
}

async function registerDevice() {
  const name = document.getElementById('dev-name').value.trim();
  const ip   = document.getElementById('dev-ip').value.trim();
  const loc  = document.getElementById('dev-loc').value.trim();
  
  if (!name) { toast('Nama perangkat wajib diisi.', 'error'); return; }
  
  // [PERBAIKAN] Kirim data sebagai JSON Body, bukan lewat URL
  const payload = {
    name: name,
    ip_address: ip || null,
    location: loc || null
  };

  const r = await POST(`/devices/register`, payload);
  
  if (r?.ok) {
    toast('Perangkat berhasil didaftarkan!', 'success');
    closeModal(); 
    renderDevices();
  } else {
    toast(r?.data?.detail || 'Gagal mendaftarkan perangkat.', 'error');
  }
}

async function sendSensorData() {
  const btn = document.getElementById('send-btn');
  const tokenSelect = document.getElementById('iot-device-token'); // Ambil element dropdown
  
  // Validasi jika belum punya alat
  if (!tokenSelect || !tokenSelect.value) {
    toast('Silakan daftarkan perangkat terlebih dahulu.', 'error');
    return;
  }

  btn.classList.add('btn-loading'); btn.disabled = true;

  // [PERBAIKAN] Tambahkan device_token ke dalam struktur JSON
  const payload = {
    device_token: tokenSelect.value, 
    temperature: parseFloat(document.getElementById('iot-temp').value),
    humidity:    parseFloat(document.getElementById('iot-hum').value),
    gas:         parseFloat(document.getElementById('iot-gas').value),
  };

  if (isNaN(payload.temperature) || isNaN(payload.humidity) || isNaN(payload.gas)) {
    toast('Semua nilai sensor harus diisi.', 'error');
    btn.classList.remove('btn-loading'); btn.disabled = false; 
    return;
  }

  // Asumsi endpoint Anda adalah /api/iot/data
  const r = await POST('/iot/data', payload); 
  
  btn.classList.remove('btn-loading'); btn.disabled = false;

  const el = document.getElementById('iot-result');
  if (r?.ok) {
    el.className = 'alert alert-success';
    el.innerHTML = `✓ Data tersimpan! ID Sensor: <b>${r.data.sensor_data.id}</b>`;
    el.classList.remove('hidden');
    toast('Data sensor terkirim!', 'success');
  } else {
    el.className = 'alert alert-error';
    el.textContent = r?.data?.detail || 'Gagal mengirim data.';
    el.classList.remove('hidden');
    toast('Validasi gagal: ' + (r?.data?.detail || 'error'), 'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   PAGE: MONITORING
   ═══════════════════════════════════════════════════════════ */
async function renderMonitoring() {
  setContent(`<div style="text-align:center;padding:40px;color:var(--text3)">Memuat monitoring...</div>`);

  // 1. Ambil daftar alat
  const devR = await GET('/devices/');
  const devices = devR?.data || [];
  if (!activeDeviceId && devices.length > 0) activeDeviceId = devices[0].id;

  // 2. Buat HTML Dropdown
  let deviceSelectHtml = `<select class="form-input btn-sm" style="min-width:200px" onchange="changeActiveDevice(this.value)">`;
  if (devices.length === 0) deviceSelectHtml += `<option value="">-- Belum ada alat --</option>`;
  else devices.forEach(d => { deviceSelectHtml += `<option value="${d.id}" ${activeDeviceId == d.id ? 'selected' : ''}>📟 ${d.name}</option>`; });
  deviceSelectHtml += `</select>`;

  // 3. Susun parameter URL
  const qsLatest = activeDeviceId ? `?device_id=${activeDeviceId}` : '';
  const qsHistory = activeDeviceId ? `?limit=20&device_id=${activeDeviceId}` : '?limit=20';

  // 4. Tarik data
  const [latR, histR] = await Promise.all([
    GET(`/monitoring/latest${qsLatest}`), 
    GET(`/monitoring/history${qsHistory}`)
  ]);
  
  const latest = latR?.data;
  const hist   = histR?.data || [];

  // 5. Reset & Populate history (DILUAR IF)
  sensorHistory = { temperature:[], humidity:[], gas:[] }; 
  if (Array.isArray(hist)) {
    [...hist].reverse().forEach(d => {
      sensorHistory.temperature.push(d.temperature);
      sensorHistory.humidity.push(d.humidity);
      sensorHistory.gas.push(d.gas);
      if (sensorHistory.temperature.length > MAX_HISTORY) {
        sensorHistory.temperature.shift(); 
        sensorHistory.humidity.shift(); 
        sensorHistory.gas.shift();
      }
    });
  }

  const tempStatus = latest ? (latest.temperature > 65 ? 'danger' : latest.temperature < 40 ? 'warn' : 'ok') : '';
  const humStatus  = latest ? (latest.humidity < 40 ? 'danger' : latest.humidity > 70 ? 'warn' : 'ok') : '';
  const gasStatus  = latest ? (latest.gas > 500 ? 'danger' : latest.gas > 300 ? 'warn' : 'ok') : '';

  // 6. Tabel HTML
  let historyTableHtml = '';
  if (hist.length === 0) {
    historyTableHtml = '<div class="text-muted text-sm" style="text-align:center;padding:24px">Belum ada data sensor.</div>';
  } else {
    const rowsHtml = [...hist].reverse().slice(0, 15).map(d => {
      const ts = d.temperature > 65 ? 'danger' : d.temperature < 40 ? 'warn' : 'ok';
      const statusBadge = ts === 'ok' ? '<span class="badge badge-green">Normal</span>' :
                          ts === 'warn' ? '<span class="badge badge-amber">Perhatian</span>' :
                          '<span class="badge badge-red">Kritis</span>';
      return `<tr>
        <td class="text-mono">${d.id}</td>
        <td class="text-mono">${new Date(d.timestamp).toLocaleString('id-ID')}</td>
        <td>${d.temperature.toFixed(1)}</td>
        <td>${d.humidity.toFixed(1)}</td>
        <td>${d.gas.toFixed(0)}</td>
        <td>${statusBadge}</td>
        <td><button class="btn btn-ghost btn-sm" style="color:var(--red); padding:4px 8px" onclick="deleteHistory(${d.id})">Hapus</button></td>
      </tr>`;
    }).join('');

    historyTableHtml = `<div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Timestamp</th><th>Suhu (°C)</th><th>Kelembapan (%)</th><th>Gas (ppm)</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table></div>`;
  }

  // 7. Render ke Layar
  setContent(`
    <div class="section-header">
      <div>
        <div class="section-title">Monitoring Real-time</div>
        <div class="text-sm text-muted mt-2" id="mon-last-update">
          ${latest ? `<span class="live-dot"></span>Terakhir: ${new Date(latest.timestamp).toLocaleString('id-ID')}` : 'Belum ada data'}
        </div>
      </div>
      <div class="flex gap-2 items-center">
        ${deviceSelectHtml}
        <button class="btn btn-secondary btn-sm" id="live-toggle" onclick="toggleLive()">▶ Mulai Live</button>
        <button class="btn btn-secondary btn-sm" onclick="renderMonitoring()">↺</button>
      </div>
    </div>

    <div class="sensor-live">
      <div class="sensor-box ${tempStatus}">
        <div class="sensor-label">🌡️ Suhu</div>
        <div class="sensor-val" id="mon-temp">${latest ? latest.temperature.toFixed(1) : '—'}</div>
        <div class="sensor-unit-sm">°C</div>
        <div class="mini-chart" id="chart-temp">${renderMiniChart(sensorHistory.temperature, 100)}</div>
      </div>
      <div class="sensor-box ${humStatus}">
        <div class="sensor-label">💧 Kelembapan</div>
        <div class="sensor-val" id="mon-hum">${latest ? latest.humidity.toFixed(1) : '—'}</div>
        <div class="sensor-unit-sm">%</div>
        <div class="mini-chart" id="chart-hum">${renderMiniChart(sensorHistory.humidity, 100)}</div>
      </div>
      <div class="sensor-box ${gasStatus}">
        <div class="sensor-label">🔬 Gas</div>
        <div class="sensor-val" id="mon-gas">${latest ? latest.gas.toFixed(0) : '—'}</div>
        <div class="sensor-unit-sm">ppm</div>
        <div class="mini-chart" id="chart-gas">${renderMiniChart(sensorHistory.gas, 1000)}</div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header"><div class="card-title">Tabel Data Historis</div><div class="card-subtitle">${hist.length} record terbaru</div></div>
      ${historyTableHtml}
    </div>
  `);

  document.getElementById('live-indicator').classList.remove('hidden');
}

async function deleteHistory(id) {
  if (!confirm(`Apakah Anda yakin ingin menghapus data historis dengan ID #${id}?`)) {
    return;
  }
  const r = await DEL(`/monitoring/${id}`);
  
  if (r?.ok) {
    toast('Data historis berhasil dihapus!', 'success');
    renderMonitoring(); 
  } else {
    toast(r?.data?.detail || 'Gagal menghapus data.', 'error');
  }
}

function renderMiniChart(data, maxVal) {
  if (!data.length) return '';
  const max = Math.max(...data, maxVal * 0.1) || 1;
  return data.map(v => {
    const pct = Math.max(4, Math.min(100, (v / max) * 100));
    return `<div class="bar" style="height:${pct}%" title="${v.toFixed(1)}"></div>`;
  }).join('');
}

let liveRunning = false;
function toggleLive() {
  if (liveRunning) { stopLive(); }
  else { startLive(); }
}

function startLive() {
  liveRunning = true;
  document.getElementById('live-toggle').innerHTML = '⏹ Stop Live';
  
  // Ambil data terbaru HANYA dari alat yang sedang dipilih
  const qs = activeDeviceId ? `?device_id=${activeDeviceId}` : '';
  
  liveInterval = setInterval(async () => {
    const r = await GET(`/monitoring/latest${qs}`); // <-- Ini yang diubah
    if (!r?.ok || !r.data) return;
    const d = r.data;
    
    updateLiveSensor('mon-temp', d.temperature, '°C', d.temperature > 65 || d.temperature < 40);
    updateLiveSensor('mon-hum', d.humidity, '%', d.humidity < 40 || d.humidity > 70);
    updateLiveSensor('mon-gas', d.gas, 'ppm', d.gas > 500);

    sensorHistory.temperature.push(d.temperature);
    sensorHistory.humidity.push(d.humidity);
    sensorHistory.gas.push(d.gas);
    if (sensorHistory.temperature.length > MAX_HISTORY) {
      sensorHistory.temperature.shift(); sensorHistory.humidity.shift(); sensorHistory.gas.shift();
    }

    const lastEl = document.getElementById('mon-last-update');
    if (lastEl) lastEl.innerHTML = `<span class="live-dot"></span>Live: ${new Date(d.timestamp).toLocaleString('id-ID')}`;
  }, 3000);
}

function stopLive() {
  liveRunning = false;
  if (liveInterval) { clearInterval(liveInterval); liveInterval = null; }
  const toggle = document.getElementById('live-toggle');
  if (toggle) toggle.innerHTML = '▶ Mulai Live';
  document.getElementById('live-indicator').classList.add('hidden');
}

function updateLiveSensor(id, val, unit, alert) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = unit === 'ppm' ? val.toFixed(0) : val.toFixed(1);
    el.style.color = alert ? 'var(--red)' : 'var(--text)';
  }
}

/* ═══════════════════════════════════════════════════════════
   PAGE: ML & KLASIFIKASI
   ═══════════════════════════════════════════════════════════ */
async function renderML() {
  setContent(`<div style="text-align:center;padding:40px;color:var(--text3)">Memuat data ML...</div>`);

  // 1. Ambil daftar alat
  const devR = await GET('/devices/');
  const devices = devR?.data || [];
  if (!activeDeviceId && devices.length > 0) activeDeviceId = devices[0].id;

  // 2. Buat HTML Dropdown
  let deviceSelectHtml = `<select class="form-input btn-sm" style="min-width:200px" onchange="changeActiveDevice(this.value)">`;
  if (devices.length === 0) deviceSelectHtml += `<option value="">-- Belum ada alat --</option>`;
  else devices.forEach(d => { deviceSelectHtml += `<option value="${d.id}" ${activeDeviceId == d.id ? 'selected' : ''}>📟 ${d.name}</option>`; });
  deviceSelectHtml += `</select>`;

  const qs = activeDeviceId ? `?device_id=${activeDeviceId}` : '';

  const [latestPredR, phasesR] = await Promise.all([GET(`/ml/latest${qs}`), GET('/ml/phases')]);
  const pred    = latestPredR?.data;
  const phases = phasesR?.data || {};
  const phaseIcons = { awal:'🌱', aktif:'🔥', matang:'✅' };
  const matPct = pred?.maturity ?? 0;
  const matColor = matPct < 30 ? 'red' : matPct < 60 ? 'amber' : 'green';

  setContent(`
    <div class="section-header">
      <div>
        <div class="section-title">ML & Klasifikasi Fase</div>
      </div>
      <div class="flex gap-2 items-center">
        ${deviceSelectHtml} <!-- TAMPILKAN DROPDOWN DI SINI -->
        <button class="btn btn-secondary btn-sm" onclick="renderML()">↺</button>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Jalankan Prediksi</div>
            <div class="card-subtitle">Trigger manual pipeline ML</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah Data Yang Diagregasi</label>
          <input id="ml-n" type="number" class="form-input" value="20" min="1" max="200"/>
          <div class="form-hint">Semakin banyak data → prediksi lebih akurat</div>
        </div>
        <button class="btn btn-primary w-full" onclick="runMLPredict()" id="ml-predict-btn" ${!activeDeviceId ? 'disabled' : ''}>
          🤖 Jalankan Prediksi
        </button>
        <div class="divider"></div>
        <button class="btn btn-secondary w-full" onclick="runMLClassify()" id="ml-classify-btn" ${!activeDeviceId ? 'disabled' : ''}>
          📊 Klasifikasi Detail
        </button>
      </div>

      <div class="card" id="ml-result-card">
        <div class="card-header">
          <div class="card-title">Hasil Prediksi Terakhir</div>
        </div>
        ${pred ? `
          <div class="flex items-center gap-3 mb-4">
            <div style="font-size:40px">${phaseIcons[pred.phase]||'🌿'}</div>
            <div>
              <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--accent2)">${pred.phase_label || pred.phase}</div>
              <div class="text-xs text-muted text-mono">${pred.phase?.toUpperCase()}</div>
            </div>
          </div>
          <div class="mb-3">
            <div class="flex justify-between text-xs text-muted mb-1">
              <span>Kematangan</span><span>${matPct.toFixed(1)}%</span>
            </div>
            <div class="progress-wrap" style="height:12px">
              <div class="progress-bar progress-${matColor}" style="width:${matPct}%"></div>
            </div>
          </div>
          <div class="text-sm text-muted">${pred.phase_description || ''}</div>
          <div class="divider"></div>
          <div class="text-xs text-mono text-muted">
            Sensor: T=${pred.temperature_used?.toFixed(1) || '—'}°C · H=${pred.humidity_used?.toFixed(1) || '—'}% · G=${pred.gas_used?.toFixed(0) || '—'}ppm
          </div>
        ` : `<div class="text-muted text-sm" style="text-align:center;padding:20px">
          Belum ada prediksi untuk perangkat ini. Klik "Jalankan Prediksi" untuk memulai.
        </div>`}
      </div>
    </div>

    <div class="card mb-4" id="ml-classify-detail" style="display:none">
      <div class="card-title mb-4">Hasil Klasifikasi Detail</div>
      <div id="ml-classify-content"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Panduan Fase Kompos</div>
        <div class="card-subtitle">Referensi karakteristik tiap fase</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        ${Object.entries(phases).map(([key, val]) => `
          <div style="background:var(--bg3);border-radius:var(--r);padding:16px;border:1px solid var(--border);${pred?.phase===key?'border-color:rgba(168,192,96,0.4);background:var(--glow)':''}">
            <div style="font-size:28px;margin-bottom:8px">${val.icon}</div>
            <div class="font-bold text-accent" style="font-size:13px;margin-bottom:4px">${val.label}</div>
            <div class="text-xs text-muted text-mono mb-2">⏱ ${val.expected_duration_weeks}</div>
            <div class="text-xs text-muted" style="line-height:1.6">${val.description}</div>
            ${pred?.phase===key ? '<div class="badge badge-green mt-2">● Fase Saat Ini</div>' : ''}
          </div>`).join('')}
      </div>
    </div>
  `);
}

async function runMLPredict() {
  const n = document.getElementById('ml-n').value || 20;
  const btn = document.getElementById('ml-predict-btn');
  btn.classList.add('btn-loading'); btn.disabled = true;

  // [PERBAIKAN] Sisipkan parameter alat spesifik
  const qs = activeDeviceId ? `&device_id=${activeDeviceId}` : '';
  const r = await POST(`/ml/predict?last_n=${n}${qs}`);
  
  btn.classList.remove('btn-loading'); btn.disabled = false;

  if (r?.ok) {
    toast('Prediksi berhasil!', 'success');
    renderML();
  } else {
    toast(r?.data?.detail || 'Gagal prediksi.', 'error');
  }
}

async function runMLClassify() {
  const n = document.getElementById('ml-n').value || 20;
  const btn = document.getElementById('ml-classify-btn');
  btn.classList.add('btn-loading'); btn.disabled = true;

  // [PERBAIKAN] Sisipkan parameter alat spesifik
  const qs = activeDeviceId ? `&device_id=${activeDeviceId}` : '';
  const r = await POST(`/ml/classify?last_n=${n}${qs}`);
  
  btn.classList.remove('btn-loading'); btn.disabled = false;

  const el = document.getElementById('ml-classify-detail');
  const content = document.getElementById('ml-classify-content');
  if (!r?.ok) { toast(r?.data?.detail || 'Gagal klasifikasi.', 'error'); return; }

  const d = r.data;
  el.style.display = 'block';

  // [KODE ALL PHASES & MATURITY TETAP SAMA SEPERTI SEBELUMNYA]
  const allPhases = d.all_phases || {};
  content.innerHTML = `
    <div class="grid-2 mb-4">
      <div>
        <div class="text-xs text-muted text-mono mb-2">FASE TERDETEKSI</div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:36px">${d.classification?.icon}</div>
          <div>
            <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--accent2)">${d.classification?.label}</div>
            <div class="text-xs text-muted text-mono">${d.classification?.expected_duration || ''}</div>
          </div>
        </div>
        <div class="text-sm text-muted mt-3" style="line-height:1.6">${d.classification?.description}</div>
      </div>
      <div>
        <div class="text-xs text-muted text-mono mb-2">KEMATANGAN</div>
        <div style="font-family:'Syne',sans-serif;font-size:36px;font-weight:800;color:var(--accent2)">${d.maturity_percent?.toFixed(1)}%</div>
        <div class="progress-wrap mt-2 mb-2" style="height:10px">
          <div class="progress-bar progress-${d.maturity_percent < 30 ? 'red' : d.maturity_percent < 85 ? 'amber' : 'green'}" style="width:${d.maturity_percent}%"></div>
        </div>
        <div class="text-sm text-muted">${d.maturity_status}</div>
      </div>
    </div>
    <div class="text-xs text-muted text-mono mb-2">POSISI ANTAR FASE</div>
    <div class="phase-timeline">
      ${Object.entries(allPhases).map(([k,v]) => `
        <div class="phase-step ${v.is_current ? 'active' : ''}">
          <div class="phase-step-icon">${v.icon}</div>
          <div class="phase-step-name">${v.label}</div>
          ${v.is_current ? '<div class="badge badge-green" style="margin-top:4px;font-size:9px">Saat ini</div>' : ''}
        </div>`).join('')}
    </div>`;

  toast('Klasifikasi detail selesai!', 'success');
}

/* ═══════════════════════════════════════════════════════════
   PAGE: DSS REKOMENDASI
   ═══════════════════════════════════════════════════════════ */
async function renderDSS() {
  setContent(`<div style="text-align:center;padding:40px;color:var(--text3)">Memuat rekomendasi...</div>`);

  // 1. Ambil daftar alat
  const devR = await GET('/devices/');
  const devices = devR?.data || [];
  if (!activeDeviceId && devices.length > 0) activeDeviceId = devices[0].id;

  // 2. Buat HTML Dropdown
  let deviceSelectHtml = `<select class="form-input btn-sm" style="min-width:200px" onchange="changeActiveDevice(this.value)">`;
  if (devices.length === 0) deviceSelectHtml += `<option value="">-- Belum ada alat --</option>`;
  else devices.forEach(d => { deviceSelectHtml += `<option value="${d.id}" ${activeDeviceId == d.id ? 'selected' : ''}>📟 ${d.name}</option>`; });
  deviceSelectHtml += `</select>`;

  const qs = activeDeviceId ? `?device_id=${activeDeviceId}` : '';

  const r = await GET(`/dss/recommendation${qs}`);
  const d = r?.data;

  if (!r?.ok || !d || d.status === 'no_data') {
    setContent(`
      <div class="section-header">
        <div class="section-title">🌿 Rekomendasi DSS</div>
        <div class="flex gap-2 items-center">${deviceSelectHtml}</div>
      </div>
      <div class="alert alert-warning mt-4">
        ⚠️ Belum ada prediksi ML untuk perangkat ini. Jalankan prediksi terlebih dahulu.
      </div>
      <button class="btn btn-primary mt-2" onclick="navigate('ml')">Ke Halaman ML →</button>
    `);
    return;
  }

  const statusColor = d.status === 'optimal' ? 'green' : d.status === 'perlu_perhatian' ? 'red' : 'amber';
  const statusLabel = d.status === 'optimal' ? '✅ Optimal' : d.status === 'perlu_perhatian' ? '⚠️ Perlu Perhatian' : '👁 Pantau';
  const phaseIcons = { awal:'🌱', aktif:'🔥', matang:'✅' };
  const sensor = d.sensor_snapshot || {};

  setContent(`
    <div class="section-header">
      <div>
        <div class="section-title">Rekomendasi DSS</div>
        <div class="text-sm text-muted mt-2">Berdasarkan hasil prediksi ML</div>
      </div>
      <div class="flex gap-2 items-center">
        ${deviceSelectHtml} <!-- TAMPILKAN DROPDOWN DI SINI -->
        <span class="badge badge-${statusColor}">${statusLabel}</span>
        <button class="btn btn-secondary btn-sm" onclick="renderDSS()">↺ Refresh</button>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card" style="border-top:3px solid var(--${statusColor==='green'?'accent':statusColor==='amber'?'amber':'red'})">
        <div class="card-header">
          <div class="card-title">Status Sistem</div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
          <div style="font-size:48px">${phaseIcons[d.phase] || '🌿'}</div>
          <div>
            <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--accent2)">${(d.phase || '').toUpperCase()}</div>
            <div class="text-xs text-muted text-mono">FASE KOMPOS</div>
          </div>
        </div>
        <div class="mb-3">
          <div class="flex justify-between text-xs text-muted mb-1"><span>Kematangan</span><span>${(d.maturity||0).toFixed(1)}%</span></div>
          <div class="progress-wrap" style="height:10px">
            <div class="progress-bar progress-${d.maturity < 30 ? 'red' : d.maturity < 85 ? 'amber' : 'green'}" style="width:${d.maturity}%"></div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="text-xs text-mono text-muted mb-1">SNAPSHOT SENSOR</div>
        <div class="flex gap-3 flex-wrap">
          ${sensor.temperature != null ? `<div class="text-sm"><span class="text-muted">T</span> <b>${sensor.temperature}°C</b></div>` : ''}
          ${sensor.humidity    != null ? `<div class="text-sm"><span class="text-muted">H</span> <b>${sensor.humidity}%</b></div>` : ''}
          ${sensor.gas         != null ? `<div class="text-sm"><span class="text-muted">G</span> <b>${sensor.gas} ppm</b></div>` : ''}
        </div>
        <div class="text-xs text-muted text-mono mt-2">${sensor.timestamp ? new Date(sensor.timestamp).toLocaleString('id-ID') : ''}</div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Tindakan yang Disarankan</div>
          <div class="card-subtitle">${d.actions?.length || 0} rekomendasi</div>
        </div>
        <div class="rec-list">
          ${(d.actions || []).map(a => {
            const isCrit = a.includes('segera') || a.includes('terlalu tinggi') || a.includes('terlalu rendah');
            const isOk   = a.includes('✅') || a.includes('optimal');
            return `<div class="rec-item ${isCrit ? 'critical' : isOk ? 'ok' : ''}">
              ${a}
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title mb-3">Panduan Ambang Batas Parameter</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        ${[
          {label:'Suhu', value: sensor.temperature, unit:'°C', lo:40, hi:65, okRange:'40–65°C'},
          {label:'Kelembapan', value: sensor.humidity, unit:'%', lo:40, hi:70, okRange:'40–70%'},
          {label:'Gas Metana', value: sensor.gas, unit:'ppm', lo:0, hi:500, okRange:'< 500 ppm'},
        ].map(p => {
          const stat = p.value == null ? 'unknown' : (p.value > p.hi ? 'danger' : p.value < p.lo ? 'warn' : 'ok');
          const color = stat === 'danger' ? 'red' : stat === 'warn' ? 'amber' : 'accent';
          return `<div style="background:var(--bg3);border-radius:var(--r);padding:14px;border:1px solid var(--border)">
            <div class="text-xs text-muted text-mono mb-2">${p.label}</div>
            <div style="font-family:'DM Mono',monospace;font-size:22px;color:var(--${color});font-weight:500">
              ${p.value != null ? p.value.toFixed(p.unit==='ppm'?0:1) : '—'}<span class="text-xs text-muted" style="margin-left:2px">${p.unit}</span>
            </div>
            <div class="text-xs text-muted mt-1">Rentang aman: ${p.okRange}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `);
}

/* ═══════════════════════════════════════════════════════════
   PAGE: LAPORAN (MULTI-DEVICE)
   ═══════════════════════════════════════════════════════════ */
async function renderReports() {
  setContent(`<div style="text-align:center;padding:40px;color:var(--text3)">Memuat laporan...</div>`);

  // 1. Ambil daftar alat
  const devR = await GET('/devices/');
  const devices = devR?.data || [];
  if (!activeDeviceId && devices.length > 0) activeDeviceId = devices[0].id;

  // 2. Buat HTML Dropdown
  let deviceSelectHtml = `<select class="form-input btn-sm" style="min-width:200px" onchange="changeActiveDevice(this.value)">`;
  if (devices.length === 0) deviceSelectHtml += `<option value="">-- Belum ada alat --</option>`;
  else devices.forEach(d => { deviceSelectHtml += `<option value="${d.id}" ${activeDeviceId == d.id ? 'selected' : ''}>📟 ${d.name}</option>`; });
  deviceSelectHtml += `</select>`;

  setContent(`
    <div class="section-header">
      <div>
        <div class="section-title">Ekspor Laporan</div>
        <div class="text-sm text-muted mt-2">Unduh riwayat data spesifik per perangkat</div>
      </div>
      <div class="flex gap-2 items-center">
        ${deviceSelectHtml} <!-- TAMPILKAN DROPDOWN DI SINI -->
        <button class="btn btn-secondary btn-sm" onclick="renderReports()">↺</button>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">📄 Laporan CSV Lengkap</div>
            <div class="card-subtitle">Data sensor + ML + DSS dalam satu file</div>
          </div>
        </div>
        <p class="text-sm text-muted mb-4" style="line-height:1.7">
          File CSV berisi:<br>
          ✓ Semua data sensor historis (timestamp, suhu, kelembapan, gas)<br>
          ✓ Semua hasil prediksi ML (fase, kematangan, label)<br>
          ✓ Rekomendasi DSS per prediksi
        </p>
        <div class="form-group">
          <label class="form-label">Batas Data (maks)</label>
          <input id="export-limit" type="number" class="form-input" value="500" min="10" max="5000"/>
        </div>
        <button class="btn btn-primary w-full" onclick="exportReport()" id="export-btn" ${!activeDeviceId ? 'disabled' : ''}>
          ⬇ Unduh CSV
        </button>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">📊 Ringkasan Sistem</div>
          <div class="card-subtitle">Statistik keseluruhan perangkat terpilih</div>
        </div>
        <div id="report-summary" style="color:var(--text3);text-align:center;padding:20px">Memuat...</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title mb-3">Preview Data Terbaru</div>
      <div id="report-preview" style="color:var(--text3)">Memuat preview...</div>
    </div>
  `);

  if (activeDeviceId) {
    loadReportSummary();
  } else {
    document.getElementById('report-summary').innerHTML = '<div class="alert alert-warning">Pilih perangkat terlebih dahulu.</div>';
    document.getElementById('report-preview').innerHTML = '<div class="alert alert-warning">Pilih perangkat terlebih dahulu.</div>';
  }
}

async function loadReportSummary() {
  const qs = activeDeviceId ? `?device_id=${activeDeviceId}` : '';
  const qsHist = activeDeviceId ? `?limit=1000&device_id=${activeDeviceId}` : '?limit=1000';

  const [sR, pR] = await Promise.all([
    GET(`/monitoring/history${qsHist}`), 
    GET(`/ml/latest${qs}`)
  ]);
  
  const sensors = sR?.data || [];
  const pred    = pR?.data;
  
  const el = document.getElementById('report-summary');
  if (el) el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:left">
      <div style="background:var(--bg3);padding:12px;border-radius:var(--r);border:1px solid var(--border)">
        <div class="text-xs text-muted text-mono mb-1">TOTAL DATA SENSOR</div>
        <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:var(--accent2)">${sensors.length}</div>
        <div class="text-xs text-muted">record tersimpan</div>
      </div>
      <div style="background:var(--bg3);padding:12px;border-radius:var(--r);border:1px solid var(--border)">
        <div class="text-xs text-muted text-mono mb-1">FASE TERAKHIR</div>
        <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--accent2)">${pred?.phase_label || pred?.phase || '—'}</div>
        <div class="text-xs text-muted">kematangan ${pred?.maturity?.toFixed(1) || '—'}%</div>
      </div>
    </div>`;

  const prevEl = document.getElementById('report-preview');
  if (prevEl && sensors.length) {
    const top5 = sensors.slice(0, 5);
    prevEl.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>#</th><th>Timestamp</th><th>Suhu</th><th>Kelembapan</th><th>Gas</th></tr></thead>
      <tbody>${top5.map(s=>`<tr>
        <td class="text-mono">${s.id}</td>
        <td class="text-mono">${new Date(s.timestamp).toLocaleString('id-ID')}</td>
        <td>${s.temperature.toFixed(1)}°C</td>
        <td>${s.humidity.toFixed(1)}%</td>
        <td>${s.gas.toFixed(0)} ppm</td>
      </tr>`).join('')}</tbody>
    </table></div>
    <div class="text-xs text-muted text-mono mt-2">Menampilkan 5 dari ${sensors.length} record.</div>`;
  } else if (prevEl) {
    prevEl.innerHTML = '<div class="text-muted text-sm" style="text-align:center;padding:20px">Belum ada data pada perangkat ini.</div>';
  }
}

async function exportReport() {
  if (!activeDeviceId) {
    toast('Pilih perangkat terlebih dahulu!', 'error');
    return;
  }
  
  const limit = document.getElementById('export-limit')?.value || 500;
  const btn = document.getElementById('export-btn');
  if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }

  try {
    // Susun URL endpoint laporan
    const urlTarget = `${API}/reports/export?limit=${limit}&device_id=${activeDeviceId}`;
    
    // Tarik JWT Token dari local storage agar bisa tembus keamanan Backend
    const token = localStorage.getItem('token'); 
    
    const res = await fetch(urlTarget, { 
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) { 
      const errData = await res.json().catch(()=>({}));
      toast(errData.detail || 'Gagal mengunduh laporan.', 'error'); 
      return; 
    }
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Tangkap nama file dinamis dari Backend
    let filename = `laporan_kompos_${Date.now()}.csv`;
    const cd = res.headers.get('content-disposition');
    if (cd) {
      const match = cd.match(/filename=(.+)/);
      if (match) filename = match[1].replace(/["']/g, ""); // hilangkan tanda kutip
    }
    
    a.download = filename;
    document.body.appendChild(a); 
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast('Laporan berhasil diunduh!', 'success');
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally {
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }
}
/* ═══════════════════════════════════════════════════════════
   PAGE: PROFILE
   ═══════════════════════════════════════════════════════════ */
async function renderProfile() {
  const r = await GET('/users/profile');
  const u = r?.data || currentUser;
  setContent(`
    <div class="section-title mb-4">👤 Profil Saya</div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title">Informasi Akun</div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
          <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:var(--bg);font-family:'Syne',sans-serif">
            ${(u?.name||'U')[0].toUpperCase()}
          </div>
          <div>
            <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700">${u?.name}</div>
            <div class="text-sm text-muted">${u?.email}</div>
            <div class="badge badge-${u?.role==='admin'?'amber':'blue'} mt-2">${u?.role}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="form-group">
          <label class="form-label">Nama Lengkap</label>
          <input id="prof-name" class="form-input" value="${u?.name||''}"/>
        </div>
        <button class="btn btn-primary" onclick="updateProfile()">Simpan Perubahan</button>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Ganti Password</div></div>
        <div class="form-group">
          <label class="form-label">Password Lama</label>
          <input id="pw-old" type="password" class="form-input" placeholder="••••••"/>
        </div>
        <div class="form-group">
          <label class="form-label">Password Baru</label>
          <input id="pw-new" type="password" class="form-input" placeholder="Min 6 karakter"/>
        </div>
        <div class="form-group">
          <label class="form-label">Konfirmasi Password Baru</label>
          <input id="pw-confirm" type="password" class="form-input" placeholder="Ulangi password baru"/>
        </div>
        <button class="btn btn-secondary" onclick="changePassword()">Ganti Password</button>
      </div>
    </div>
  `);
}

async function updateProfile() {
  const name = document.getElementById('prof-name').value.trim();
  const r = await PUT('/users/profile', { name });
  if (r?.ok) {
    currentUser = r.data;
    document.getElementById('sidebar-name').textContent = r.data.name;
    document.getElementById('sidebar-avatar').textContent = (r.data.name||'U')[0].toUpperCase();
    toast('Profil berhasil diperbarui!', 'success');
  } else toast(r?.data?.detail || 'Gagal update profil.', 'error');
}

async function changePassword() {
  const old = document.getElementById('pw-old').value;
  const nw  = document.getElementById('pw-new').value;
  const cfm = document.getElementById('pw-confirm').value;
  if (nw !== cfm) { toast('Password baru tidak cocok.', 'error'); return; }
  if (nw.length < 6) { toast('Password minimal 6 karakter.', 'error'); return; }
  const r = await PUT('/users/profile/password', { old_password: old, new_password: nw, confirm_new_password: cfm });
  if (r?.ok) toast('Password berhasil diubah!', 'success');
  else toast(r?.data?.detail || 'Gagal ganti password.', 'error');
}

/* ═══════════════════════════════════════════════════════════
   PAGE: ADMIN
   ═══════════════════════════════════════════════════════════ */
async function renderAdmin() {
  if (currentUser?.role !== 'admin') {
    setContent(`<div class="alert alert-error">Akses ditolak. Hanya admin.</div>`);
    return;
  }
  const r = await GET('/users/admin/users');
  const users = r?.data || [];

  setContent(`
    <div class="section-header">
      <div class="section-title">⚙ Manajemen User</div>
      <div class="text-sm text-muted">${users.length} pengguna terdaftar</div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>#</th><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Daftar</th><th>Aksi</th>
        </tr></thead>
        <tbody>
          ${users.map(u => `<tr>
            <td class="text-mono">${u.id}</td>
            <td>${u.name}</td>
            <td class="text-mono text-muted">${u.email}</td>
            <td><span class="badge badge-${u.role==='admin'?'amber':'blue'}">${u.role}</span></td>
            <td><span class="badge badge-${u.is_active?'green':'red'}">${u.is_active?'Aktif':'Nonaktif'}</span></td>
            <td class="text-mono text-muted">${new Date(u.created_at).toLocaleDateString('id-ID')}</td>
            <td>
              <div class="flex gap-2">
                ${u.id !== currentUser.id ? `
                  <button class="btn btn-ghost btn-sm" onclick="toggleUserActive(${u.id})">
                    ${u.is_active ? '🔒' : '🔓'}
                  </button>
                  <button class="btn btn-ghost btn-sm" onclick="changeRole(${u.id},'${u.role}')">
                    ${u.role === 'admin' ? '↓ user' : '↑ admin'}
                  </button>` : '<span class="text-xs text-muted">Anda</span>'}
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `);
}

async function toggleUserActive(id) {
  const r = await PUT(`/users/admin/users/${id}/toggle-active`);
  if (r?.ok) { toast('Status user diperbarui.', 'success'); renderAdmin(); }
  else toast('Gagal mengubah status.', 'error');
}

async function changeRole(id, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  const r = await PUT(`/users/admin/users/${id}/role`, { role: newRole });
  if (r?.ok) { toast(`Role diubah ke ${newRole}.`, 'success'); renderAdmin(); }
  else toast('Gagal mengubah role.', 'error');
}

/* ═══════════════════════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════════════════════ */
function setContent(html) {
  document.getElementById('content').innerHTML = html;
}

/* ═══════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   INIT (LOGIKA PENGATUR ALUR)
   ═══════════════════════════════════════════════════════════ */
async function init() {
  await ensureAdminExists();
  const r = await GET('/users/profile');
  if (r?.ok && r.data) currentUser = r.data;
  
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.style.opacity = '0';
    
    setTimeout(() => {
      splash.style.display = 'none';

      // --- PERBAIKAN: SEMBUNYIKAN SEMUA SEBELUM MEMILIH ---
      document.getElementById('landing-page').classList.add('hidden');
      document.getElementById('auth-page').classList.add('hidden');
      document.getElementById('main-app').classList.add('hidden');

      // --- TAMPILKAN SESUAI KONDISI ---
      if (currentUser) {
        enterApp(); // Jika sudah login, masuk ke dashboard
      } else {
        document.getElementById('landing-page').classList.remove('hidden'); // Jika belum, tampilkan Blog
      }
    }, 400);
  }, 1300);
}

async function ensureAdminExists() {
  await POST('/users/register', {
    name: 'Admin Kompos',
    email: 'admin@kompos.id',
    password: 'admin123',
    confirm_password: 'admin123',
  });
}

window.addEventListener('DOMContentLoaded', init);

async function loadSystemStats() {
    try {
        const response = await fetch(`${API}/system/stats`); // PERBAIKAN: Gunakan base URL yang benar

        if (!response.ok) {
            console.warn("Gagal mengambil statistik (API mungkin belum siap/belum login)");
            return; // Keluar diam-diam, tidak usah lempar error yang merusak aplikasi
        }

        const data = await response.json();

        // PERBAIKAN: Cek dulu elemennya ada atau tidak sebelum diubah
        const statUsers = document.getElementById("stat-users");
        if (statUsers) statUsers.textContent = data.users + "+";

        const statDevices = document.getElementById("stat-devices");
        if (statDevices) statDevices.textContent = data.devices;

        const statFeatures = document.getElementById("stat-features");
        if (statFeatures) statFeatures.textContent = data.features;

        const statExports = document.getElementById("stat-exports");
        if (statExports) statExports.textContent = data.predictions;

    } catch (err) {
        console.error("Error loadSystemStats:", err);
    }
}

document.addEventListener("DOMContentLoaded", loadSystemStats);

async function submitFeedback() {
    const name = document.getElementById('fb-name').value;
    const email = document.getElementById('fb-email').value;
    const category = document.getElementById('fb-category').value;
    const message = document.getElementById('fb-message').value;
    const btn = document.querySelector('button[onclick="submitFeedback()"]');

    if (!message.trim()) {
        toast("Pesan tidak boleh kosong!", "error");
        return;
    }

    // Ubah tulisan tombol agar terlihat merespons
    const originalText = btn.innerHTML;
    btn.innerHTML = "Menyimpan...";
    btn.disabled = true;

    try {
        const payload = {
            name: name || null,
            email: email || null,
            category: category,
            message: message
        };

        const response = await fetch(`${API}/feedback/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Gagal mengirim masukan.");

        toast("Terima kasih! Masukan Anda berhasil disimpan.", "success");
        
        // Bersihkan form setelah berhasil
        document.getElementById('fb-message').value = '';
        document.getElementById('fb-name').value = '';
        document.getElementById('fb-email').value = '';
        document.getElementById('fb-category').value = 'Saran';

    } catch (e) {
        toast(e.message, "error");
    } finally {
        // Kembalikan tombol seperti semula
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// =========================================================
// RENDER UI & LOGIKA ADMIN FEEDBACK
// =========================================================

// 1. Fungsi untuk menggambar (render) halaman UI ke layar
function renderAdminFeedbackPage() {
    // PERBAIKAN: Menggunakan fungsi bawaan setContent dari kode Anda
    setContent(`
        <div id="admin-feedback-page" style="padding: 20px; max-width: 1200px; margin: auto; animation: fadeIn 0.3s ease;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h1 style="font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--text);">
                        Kotak Masuk Masukan
                    </h1>
                    <p class="text-sm text-muted">Kelola saran, kritik, dan laporan dari pengguna.</p>
                </div>
                <button class="btn btn-outline" onclick="loadAdminFeedback()">🔄 Segarkan Data</button>
            </div>

            <div class="card table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">No</th>
                            <th style="width: 15%;">Tanggal</th>
                            <th style="width: 15%;">Pengirim</th>
                            <th style="width: 15%;">Kategori</th>
                            <th style="width: 40%;">Pesan</th>
                            <th style="width: 10%; text-align: center;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="feedback-table-body">
                        <tr>
                            <td colspan="6" style="text-align: center; color: var(--text3);">Memuat data...</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    `);

    // Langsung panggil data dari API sesaat setelah kerangka tabel selesai dibuat
    loadAdminFeedback();
}

// 2. Fungsi untuk mengambil data dari Backend API
// 2. Fungsi untuk mengambil data dari Backend API
async function loadAdminFeedback() {
    const tbody = document.getElementById('feedback-table-body');

    try {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text3);">Memuat data...</td></tr>';
        
        // PERBAIKAN: Gunakan fungsi GET bawaan Anda yang sudah otomatis mengurus Token!
        const r = await GET('/feedback/');

        if (!r?.ok) {
            throw new Error(r?.data?.detail || "Gagal memuat masukan.");
        }

        const data = r.data || [];

        // Jika database masih kosong
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text3);">Belum ada masukan.</td></tr>';
            return;
        }

        // Hapus tulisan "Memuat data..." dan isi dengan data asli
        tbody.innerHTML = '';
        data.forEach((item, index) => {
            const date = new Date(item.created_at).toLocaleString('id-ID', {
                year: 'numeric', month: 'short', day: 'numeric', 
                hour: '2-digit', minute: '2-digit'
            });

            // Pewarnaan Badge Kategori Dinamis
            let badgeClass = 'badge-gray';
            if(item.category === 'Bug') badgeClass = 'badge-red';
            if(item.category === 'Saran') badgeClass = 'badge-green';
            if(item.category === 'Fitur') badgeClass = 'badge-blue';

            // Rakit baris tabel
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td style="font-size: 13px; color: var(--text2);">${date}</td>
                <td>
                    <div style="font-weight: bold; color: var(--text);">${item.name || 'Anonim'}</div>
                    <div style="font-size: 12px; color: var(--text3);">${item.email || '-'}</div>
                </td>
                <td><span class="badge ${badgeClass}">${item.category}</span></td>
                <td style="color: var(--text2); line-height: 1.5; font-size: 14px;">${item.message}</td>
                <td style="text-align: center;">
                    <button class="btn btn-sm" style="background: #ef4444; color: white; border: none; cursor: pointer;" onclick="deleteFeedback(${item.id})">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Error: ${e.message}</td></tr>`;
        toast(e.message, "error");
    }
}

// 3. Fungsi untuk menghapus masukan
async function deleteFeedback(id) {
    if (!confirm("Yakin ingin menghapus masukan ini secara permanen?")) return;

    // PERBAIKAN: Gunakan fungsi DEL bawaan Anda!
    const r = await DEL(`/feedback/${id}`);

    if (r?.ok) {
        toast("Masukan berhasil dihapus.", "success");
        loadAdminFeedback(); // Segarkan ulang tabel
    } else {
        toast(r?.data?.detail || "Gagal menghapus masukan.", "error");
    }
}
