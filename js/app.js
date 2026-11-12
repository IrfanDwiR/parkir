import { login, getSession, logout } from './auth.js';
import { navigate } from './router.js';
import {
  calculateFee,
  completeExit,
  findActiveVehicle,
  getParkingData,
  getSlotCounts,
  registerEntry,
  updateParkingSettings
} from './parking.js';

const app = document.querySelector('#app');

const menus = {
  admin: [
    { label: 'Dashboard', route: '#/dashboard', icon: '▦' },
    { label: 'Manajemen User', route: '#/users', icon: '♙' },
    { label: 'Tarif & Area Parkir', route: '#/tarif-area', icon: '▤' },
    { label: 'Manajemen Kendaraan', route: '#/kendaraan', icon: '▣' },
    { label: 'Log Aktivitas', route: '#/log-aktivitas', icon: '◷' }
  ],
  petugas: [
    { label: 'Dashboard', route: '#/dashboard', icon: '▦' },
    { label: 'Parkir Masuk', route: '#/parkir-masuk', icon: '↘' },
    { label: 'Parkir Keluar', route: '#/parkir-keluar', icon: '↗' }
  ],
  owner: [
    { label: 'Dashboard', route: '#/dashboard', icon: '▦' },
    { label: 'Rekap Transaksi', route: '#/rekap', icon: '▤' }
  ]
};

const pageDescriptions = {
  dashboard: ['Dashboard', 'Ringkasan aktivitas sistem parkir.'],
  users: ['Manajemen User', 'Kelola akun admin dan petugas yang menggunakan sistem.'],
  'tarif-area': ['Tarif & Area Parkir', 'Kelola tarif parkir dan area atau slot kendaraan.'],
  kendaraan: ['Manajemen Kendaraan', 'Lihat dan kelola data kendaraan yang tercatat.'],
  'log-aktivitas': ['Log Aktivitas', 'Pantau aktivitas pengguna di dalam sistem.'],
  'parkir-masuk': ['Parkir Masuk', 'Catat nomor kendaraan dan waktu kendaraan memasuki area parkir.'],
  'parkir-keluar': ['Parkir Keluar', 'Cari karcis, hitung biaya parkir, dan proses pembayaran.'],
  rekap: ['Rekap Transaksi', 'Lihat ringkasan transaksi dan pendapatan parkir.']
};

function renderLogin() {
  app.innerHTML = `
    <main class="login-page">
      <section class="login-card">
        <div class="brand">parkir<span>ku.</span></div>
        <p class="login-subtitle">Sistem Manajemen Parkir</p>
        <div class="login-heading"><h1>Selamat datang</h1><p>Masuk untuk melanjutkan ke dashboard.</p></div>
        <form id="loginForm">
          <label class="field-label" for="username">Username</label>
          <input class="field-input" id="username" name="username" placeholder="Masukkan username" autocomplete="username" required>
          <label class="field-label" for="password">Password</label>
          <input class="field-input" id="password" name="password" type="password" placeholder="Masukkan password" autocomplete="current-password" required>
          <div class="demo-role-wrap" id="demoRoleWrap">
            <label class="field-label" for="demoRole">Parkir praktis tinggal buka aplikasi</label>
            <select class="field-input" id="demoRole"><option value="admin">Admin</option><option value="petugas">Petugas</option><option value="owner">Owner</option></select>
          </div>
          <p class="form-error" id="loginError" role="alert"></p>
          <button class="primary-button" id="loginButton" type="submit">Masuk ke Sistem <span>→</span></button>
        </form>
        <p class="login-footnote">Mode demo aktif · Gunakan username dan password bebas.</p>
      </section>
      <div class="login-side"><div class="side-mark"></div><div><p class="side-kicker">PARKIRKU SYSTEM</p><h2>Kelola parkir<br>lebih teratur.</h2><p class="side-copy">Satu tempat untuk mengelola kendaraan, transaksi, dan aktivitas parkir.</p></div><span class="side-version"></span></div>
    </main>`;

  const form = document.querySelector('#loginForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = document.querySelector('#loginButton');
    const error = document.querySelector('#loginError');
    button.disabled = true;
    button.innerHTML = 'Memproses...';
    error.textContent = '';
    try {
      await login(
        document.querySelector('#username').value,
        document.querySelector('#password').value,
        document.querySelector('#demoRole').value
      );
      location.hash = '#/dashboard';
    } catch (err) {
      error.textContent = err.message;
    } finally {
      button.disabled = false;
      button.innerHTML = 'Masuk ke Sistem <span>→</span>';
    }
  });
}

function renderDashboard(route) {
  const session = getSession();
  const role = String(session.user?.role || 'admin').toLowerCase();
  const roleMenus = menus[role] || menus.admin;
  const pageKey = route.replace('#/', '') || 'dashboard';
  const [pageTitle, pageDescription] = pageDescriptions[pageKey] || pageDescriptions.dashboard;
  const activeMenu = roleMenus.some(item => item.route === route) ? route : '#/dashboard';
  const username = session.user?.username || 'Pengguna';

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand sidebar-brand" href="#/dashboard">parkir<span>ku.</span></a>
        <div class="sidebar-caption">MENU UTAMA</div>
        <nav class="navigation">${roleMenus.map(item => `
          <a class="nav-item ${activeMenu === item.route ? 'active' : ''}" href="${item.route}">
            <span class="nav-icon">${item.icon}</span><span>${item.label}</span>
          </a>`).join('')}</nav>
        <div class="sidebar-bottom"><div class="status-dot"></div><div><strong>Sistem Parkir</strong><small></small></div></div>
      </aside>
      <main class="main-area">
        <header class="topbar"><div class="mobile-brand">parkir<span>ku.</span></div><div class="breadcrumb">Halaman <span>/</span> <strong>${pageTitle}</strong></div>
          <div class="profile-area"><div class="avatar">${username.charAt(0).toUpperCase()}</div><div class="profile-text"><strong>${escapeHTML(username)}</strong><small>${escapeHTML(roleLabel(role))}</small></div><button class="logout-button" id="logoutButton" title="Keluar" aria-label="Keluar">↪</button></div>
        </header>
        <section class="page-content">
          <div class="page-heading"><div><p class="eyebrow">PARKIRKU / ${pageTitle.toUpperCase()}</p><h1>${pageTitle}</h1><p class="page-description">${pageDescription}</p></div><span class="date-chip">● Sistem aktif</span></div>
          ${pageKey === 'dashboard' ? dashboardContent(role) : renderPage(pageKey, pageTitle, pageDescription, role)}
        </section>
      </main>
    </div>`;
  document.querySelector('#logoutButton').addEventListener('click', logout);
}

function renderPage(pageKey, title, description, role) {
  if (pageKey === 'parkir-masuk' && role === 'petugas') return entryContent();
  if (pageKey === 'parkir-keluar' && role === 'petugas') return exitContent();
  if (pageKey === 'tarif-area' && role === 'admin') return settingsContent();
  if (pageKey === 'kendaraan' && role === 'admin') return vehiclesContent();
  if (pageKey === 'rekap' && role === 'owner') return reportsContent();
  return placeholderContent(title, description, role);
}

function dashboardContent(role) {
  const data = getParkingData();
  const today = new Date().toDateString();
  const todayTransactions = data.transactions.filter(item => new Date(item.exitedAt).toDateString() === today);
  const todayEntries = data.active.filter(item => new Date(item.enteredAt).toDateString() === today).length +
    data.transactions.filter(item => new Date(item.enteredAt).toDateString() === today).length;
  const occupied = data.active.length;
  if (role === 'petugas') return `
    <div class="stats-grid"><article class="stat-card"><span class="stat-icon">↘</span><p>Kendaraan Masuk Hari Ini</p><strong>${todayEntries}</strong></article><article class="stat-card"><span class="stat-icon">↗</span><p>Kendaraan Keluar Hari Ini</p><strong>${todayTransactions.length}</strong></article><article class="stat-card"><span class="stat-icon">▣</span><p>Slot Terisi</p><strong>${occupied}</strong><small>dari ${data.settings.capacity.motor + data.settings.capacity.mobil} slot</small></article></div>
    <div class="section-card"><div class="card-heading"><div><h2>Aktivitas Parkir</h2><p>Pilih proses yang ingin dilakukan.</p></div></div><div class="quick-actions"><a href="#/parkir-masuk" class="action-card"><span>↘</span><div><strong>Parkir Masuk</strong><small>Catat kendaraan yang masuk</small></div><b>→</b></a><a href="#/parkir-keluar" class="action-card"><span>↗</span><div><strong>Parkir Keluar</strong><small>Proses karcis dan pembayaran</small></div><b>→</b></a></div></div>${recentTransactions(data.transactions, 5)}`;
  if (role === 'owner') return `
    <div class="stats-grid"><article class="stat-card"><span class="stat-icon">▤</span><p>Transaksi Hari Ini</p><strong>${todayTransactions.length}</strong></article><article class="stat-card"><span class="stat-icon">Rp</span><p>Pendapatan Hari Ini</p><strong>${formatRupiah(todayTransactions.reduce((sum, item) => sum + item.amount, 0))}</strong></article><article class="stat-card"><span class="stat-icon">◷</span><p>Kendaraan di Area</p><strong>${occupied}</strong></article></div>
    <div class="section-card"><div class="card-heading"><div><h2>Informasi Laporan</h2><p>Pantau ringkasan transaksi dan pendapatan parkir.</p></div><a class="text-link" href="#/rekap">Lihat rekap →</a></div>${recentTransactions(data.transactions, 5)}</div>`;
  return `
    <div class="stats-grid"><article class="stat-card"><span class="stat-icon">♙</span><p>Total Pengguna</p><strong>—</strong><small>Menunggu integrasi data</small></article><article class="stat-card"><span class="stat-icon">▣</span><p>Data Kendaraan</p><strong>—</strong><small>Menunggu integrasi data</small></article><article class="stat-card"><span class="stat-icon">◷</span><p>Log Aktivitas</p><strong>—</strong><small>Menunggu integrasi data</small></article></div>
    <div class="section-card"><div class="card-heading"><div><h2>Ringkasan Sistem</h2><p>Kelola data utama aplikasi parkir dari dashboard admin.</p></div></div><div class="quick-actions"><a href="#/users" class="action-card"><span>♙</span><div><strong>Manajemen User</strong><small>Kelola akun pengguna</small></div><b>→</b></a><a href="#/tarif-area" class="action-card"><span>▤</span><div><strong>Tarif & Area Parkir</strong><small>Atur tarif dan area parkir</small></div><b>→</b></a></div></div>`;
}

function entryContent() {
  const data = getParkingData();
  const motor = getSlotCounts(data, 'motor');
  const mobil = getSlotCounts(data, 'mobil');
  return `<div class="form-layout">
    <form class="section-card workflow-form" id="entryForm">
      <div class="card-heading"><div><h2>Catat kendaraan masuk</h2><p>Isi nomor kendaraan untuk membuat karcis parkir.</p></div></div>
      <label class="field-label" for="entryPlate">Nomor kendaraan</label><input class="field-input" id="entryPlate" name="plate" placeholder="Contoh: B 1234 ABC" maxlength="15" required>
      <label class="field-label" for="entryType">Jenis kendaraan</label><select class="field-input" id="entryType" name="type"><option value="motor">Motor — ${formatRupiah(data.settings.rates.motor)}/jam</option><option value="mobil">Mobil — ${formatRupiah(data.settings.rates.mobil)}/jam</option></select>
      <div class="form-error" id="entryError" role="alert"></div><button class="primary-button" type="submit">Simpan & buat karcis <span>→</span></button>
    </form>
    <section class="section-card"><div class="card-heading"><div><h2>Ketersediaan slot</h2><p>Kapasitas parkir saat ini.</p></div></div><div class="slot-list"><div><span>Motor</span><strong>${motor.available} <small>/ ${motor.capacity} tersedia</small></strong></div><div><span>Mobil</span><strong>${mobil.available} <small>/ ${mobil.capacity} tersedia</small></strong></div></div></section>
  </div><div id="entryResult"></div>${activeVehiclesTable(data.active)}`;
}

function exitContent() {
  return `<div class="form-layout">
    <form class="section-card workflow-form" id="lookupForm">
      <div class="card-heading"><div><h2>Cari karcis</h2><p>Masukkan nomor karcis atau nomor kendaraan.</p></div></div>
      <label class="field-label" for="ticketQuery">Nomor karcis / kendaraan</label><input class="field-input" id="ticketQuery" placeholder="Contoh: PK-... atau B 1234 ABC" required>
      <div class="form-error" id="exitError" role="alert"></div><button class="primary-button" type="submit">Cari kendaraan <span>→</span></button>
    </form><div id="exitResult"></div>
  </div>${activeVehiclesTable(getParkingData().active)}`;
}

function settingsContent() {
  const { settings } = getParkingData();
  return `<form class="section-card workflow-form settings-form" id="settingsForm">
    <div class="card-heading"><div><h2>Tarif dan kapasitas slot</h2><p>Tarif dihitung per jam dan dibulatkan ke atas, minimum satu jam.</p></div></div>
    <div class="settings-grid"><div><h3>Motor</h3><label class="field-label" for="motorRate">Tarif per jam (Rp)</label><input class="field-input" id="motorRate" name="motorRate" type="number" min="1" step="1" value="${settings.rates.motor}" required><label class="field-label" for="motorCapacity">Kapasitas slot</label><input class="field-input" id="motorCapacity" name="motorCapacity" type="number" min="1" step="1" value="${settings.capacity.motor}" required></div>
    <div><h3>Mobil</h3><label class="field-label" for="carRate">Tarif per jam (Rp)</label><input class="field-input" id="carRate" name="carRate" type="number" min="1" step="1" value="${settings.rates.mobil}" required><label class="field-label" for="carCapacity">Kapasitas slot</label><input class="field-input" id="carCapacity" name="carCapacity" type="number" min="1" step="1" value="${settings.capacity.mobil}" required></div></div>
    <div class="form-error" id="settingsError" role="alert"></div><div class="success-message" id="settingsSuccess" role="status"></div><button class="primary-button" type="submit">Simpan pengaturan <span>→</span></button>
  </form>`;
}

function vehiclesContent() {
  const data = getParkingData();
  return `<div class="section-card"><div class="card-heading"><div><h2>Kendaraan aktif</h2><p>Daftar kendaraan yang sedang berada di area parkir.</p></div></div>${activeVehiclesTable(data.active)}</div>${recentTransactions(data.transactions, 10, 'Riwayat kendaraan keluar')}`;
}

function reportsContent() {
  const data = getParkingData();
  const transactions = data.transactions;
  return `<div class="stats-grid"><article class="stat-card"><span class="stat-icon">▤</span><p>Total Transaksi</p><strong>${transactions.length}</strong></article><article class="stat-card"><span class="stat-icon">Rp</span><p>Total Pendapatan</p><strong>${formatRupiah(transactions.reduce((sum, item) => sum + item.amount, 0))}</strong></article><article class="stat-card"><span class="stat-icon">▣</span><p>Kendaraan Aktif</p><strong>${data.active.length}</strong></article></div>${recentTransactions(transactions, 20, 'Riwayat transaksi')}`;
}

function activeVehiclesTable(vehicles) {
  if (!vehicles.length) return '<div class="empty-state">Belum ada kendaraan di area parkir.</div>';
  return `<div class="table-wrap"><table><thead><tr><th>Nomor karcis</th><th>Kendaraan</th><th>Jenis</th><th>Slot</th><th>Waktu masuk</th></tr></thead><tbody>${vehicles.map(vehicle => `<tr><td>${escapeHTML(vehicle.ticket)}</td><td>${escapeHTML(vehicle.plate)}</td><td>${vehicle.type === 'motor' ? 'Motor' : 'Mobil'}</td><td>${escapeHTML(vehicle.slot)}</td><td>${formatDate(vehicle.enteredAt)}</td></tr>`).join('')}</tbody></table></div>`;
}

function recentTransactions(transactions, limit, title = 'Transaksi terbaru') {
  const rows = transactions.slice(0, limit);
  return `<div class="section-card transaction-section"><div class="card-heading"><div><h2>${title}</h2><p>Data transaksi tersimpan di browser ini.</p></div></div>${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Kendaraan</th><th>Jenis</th><th>Masuk</th><th>Keluar</th><th>Durasi</th><th>Biaya</th></tr></thead><tbody>${rows.map(item => `<tr><td>${escapeHTML(item.plate)}<small class="table-subtext">${escapeHTML(item.ticket)}</small></td><td>${item.type === 'motor' ? 'Motor' : 'Mobil'}</td><td>${formatDate(item.enteredAt)}</td><td>${formatDate(item.exitedAt)}</td><td>${item.hours} jam</td><td>${formatRupiah(item.amount)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">Belum ada transaksi parkir selesai.</div>'}</div>`;
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function placeholderContent(title, description, role) {
  let extra = 'Konten halaman ini akan dibuat pada sprint berikutnya.';
  if (title === 'Parkir Masuk') extra = 'Halaman ini nantinya digunakan petugas untuk mencatat nomor kendaraan dan waktu masuk, lalu sistem menyimpan data serta memperbarui slot parkir.';
  if (title === 'Parkir Keluar') extra = 'Halaman ini nantinya digunakan petugas untuk memeriksa nomor karcis, menghitung biaya parkir, mengonfirmasi pembayaran, dan menyelesaikan transaksi keluar.';
  if (title === 'Rekap Transaksi') extra = 'Halaman ini nantinya menampilkan laporan transaksi, pendapatan, dan aktivitas parkir untuk owner.';
  return `<div class="section-card placeholder-card"><div class="placeholder-icon">▤</div><h2>${title}</h2><p>${description}</p><div class="empty-state">${extra}</div><span class="role-note">Akses: ${roleLabel(role)}</span></div>`;
}

function roleLabel(role) {
  return ({ admin: 'Administrator', petugas: 'Petugas Parkir', owner: 'Owner' })[role] || 'Pengguna';
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function render() {
  const route = navigate();
  const session = getSession();
  if (!session || route === '#/login') renderLogin();
  else renderDashboard(route);
}

document.addEventListener('submit', event => {
  if (event.target.id === 'entryForm') {
    event.preventDefault();
    const error = document.querySelector('#entryError');
    const result = document.querySelector('#entryResult');
    error.textContent = '';
    result.innerHTML = '';
    try {
      const vehicle = registerEntry(event.target.elements.namedItem('plate').value, event.target.elements.namedItem('type').value);
      const ticketMarkup = `<div class="ticket-result"><strong>Karcis berhasil dibuat</strong><span>Nomor karcis <b>${escapeHTML(vehicle.ticket)}</b></span><span>Kendaraan ${escapeHTML(vehicle.plate)} · Slot ${escapeHTML(vehicle.slot)}</span><span>Waktu masuk ${formatDate(vehicle.enteredAt)}</span></div>`;
      render();
      document.querySelector('#entryResult').innerHTML = ticketMarkup;
    } catch (err) {
      error.textContent = err.message;
    }
  } else if (event.target.id === 'lookupForm') {
    event.preventDefault();
    const error = document.querySelector('#exitError');
    const result = document.querySelector('#exitResult');
    error.textContent = '';
    result.innerHTML = '';
    const vehicle = findActiveVehicle(event.target.elements.namedItem('ticketQuery').value);
    if (!vehicle) {
      error.textContent = 'Karcis atau kendaraan tidak ditemukan di area parkir.';
      return;
    }
    const fee = calculateFee(vehicle, getParkingData().settings.rates);
    result.innerHTML = `<div class="section-card fee-card"><div class="card-heading"><div><h2>Rincian parkir</h2><p>Periksa data sebelum menyelesaikan transaksi.</p></div></div><dl><div><dt>Nomor karcis</dt><dd>${escapeHTML(vehicle.ticket)}</dd></div><div><dt>Kendaraan</dt><dd>${escapeHTML(vehicle.plate)} · ${vehicle.type === 'motor' ? 'Motor' : 'Mobil'}</dd></div><div><dt>Waktu masuk</dt><dd>${formatDate(vehicle.enteredAt)}</dd></div><div><dt>Durasi</dt><dd>${fee.hours} jam (pembulatan ke atas)</dd></div><div class="fee-total"><dt>Total biaya</dt><dd>${formatRupiah(fee.amount)}</dd></div></dl><form id="paymentForm" data-ticket="${escapeHTML(vehicle.ticket)}"><label class="field-label" for="paymentMethod">Metode pembayaran</label><select class="field-input" id="paymentMethod"><option>Tunai</option><option>QRIS</option></select><div class="form-error" id="paymentError" role="alert"></div><button class="primary-button" type="submit">Konfirmasi pembayaran & keluar <span>→</span></button></form></div>`;
    document.querySelector('#paymentForm').addEventListener('submit', paymentEvent => {
      paymentEvent.preventDefault();
      try {
        const transaction = completeExit(vehicle.ticket, document.querySelector('#paymentMethod').value);
        const receiptMarkup = `<div class="ticket-result"><strong>Transaksi selesai</strong><span>${escapeHTML(transaction.plate)} · ${escapeHTML(transaction.ticket)}</span><span>Total dibayar ${formatRupiah(transaction.amount)} melalui ${escapeHTML(transaction.paymentMethod)}.</span><span>Slot ${escapeHTML(transaction.slot)} sekarang tersedia.</span></div>`;
        render();
        document.querySelector('#exitResult').innerHTML = receiptMarkup;
      } catch (err) {
        document.querySelector('#paymentError').textContent = err.message;
      }
    });
  } else if (event.target.id === 'settingsForm') {
    event.preventDefault();
    const error = document.querySelector('#settingsError');
    const success = document.querySelector('#settingsSuccess');
    error.textContent = '';
    success.textContent = '';
    try {
      updateParkingSettings(
        { motor: Number(event.target.elements.namedItem('motorRate').value), mobil: Number(event.target.elements.namedItem('carRate').value) },
        { motor: Number(event.target.elements.namedItem('motorCapacity').value), mobil: Number(event.target.elements.namedItem('carCapacity').value) }
      );
      success.textContent = 'Pengaturan tarif dan kapasitas berhasil disimpan.';
    } catch (err) {
      error.textContent = err.message;
    }
  }
});

window.addEventListener('hashchange', render);
render();
