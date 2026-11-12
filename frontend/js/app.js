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
import {
  getActivityLogs,
  getDemoUsers,
  logActivity,
  removeDemoUser,
  saveDemoUser,
  syncDemoUser
} from './management.js';

const app = document.querySelector('#app');
let reportRange = { from: '', to: '' };
let activityQuery = '';

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
            <label class="field-label" for="demoRole">Masuk sebagai (mode demo)</label>
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
      const session = await login(
        document.querySelector('#username').value,
        document.querySelector('#password').value,
        document.querySelector('#demoRole').value
      );
      syncDemoUser(session.user);
      logActivity('Masuk ke sistem', session.user);
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
  if (route !== '#/dashboard' && !roleMenus.some(item => item.route === route)) {
    location.hash = '#/dashboard';
    return;
  }
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
  document.querySelector('#logoutButton').addEventListener('click', () => {
    recordActivity('Keluar dari sistem');
    logout();
  });
}

function renderPage(pageKey, title, description, role) {
  if (pageKey === 'users' && role === 'admin') return usersContent();
  if (pageKey === 'log-aktivitas' && role === 'admin') return activityContent();
  if (pageKey === 'parkir-masuk' && role === 'petugas') return entryContent();
  if (pageKey === 'parkir-keluar' && role === 'petugas') return exitContent();
  if (pageKey === 'tarif-area' && role === 'admin') return settingsContent();
  if (pageKey === 'kendaraan' && role === 'admin') return vehiclesContent();
  if (pageKey === 'rekap' && role === 'owner') return reportsContent();
  return placeholderContent(title, description, role);
}

function dashboardContent(role) {
  const data = getParkingData();
  const users = getDemoUsers();
  const activities = getActivityLogs();
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
    <div class="stats-grid"><article class="stat-card"><span class="stat-icon">♙</span><p>Pengguna Demo</p><strong>${users.length}</strong><small>Terdaftar di browser ini</small></article><article class="stat-card"><span class="stat-icon">▣</span><p>Kendaraan Aktif</p><strong>${data.active.length}</strong><small>${data.transactions.length} transaksi selesai</small></article><article class="stat-card"><span class="stat-icon">◷</span><p>Aktivitas Tercatat</p><strong>${activities.length}</strong><small>Maksimal 250 aktivitas</small></article></div>
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

function usersContent() {
  const users = getDemoUsers();
  const currentUsername = getSession()?.user?.username || '';
  return `<div class="notice-card"><strong>Mode demo</strong><span>Daftar ini disimpan di browser ini. Login demo masih bebas dan belum memakai akun di tabel ini sebagai autentikasi.</span></div>
    <div class="management-layout"><form class="section-card workflow-form" id="userForm">
      <div class="card-heading"><div><h2 id="userFormTitle">Tambah pengguna</h2><p>Catat profil dan role pengguna demo.</p></div></div>
      <input type="hidden" name="userId" value="">
      <label class="field-label" for="userName">Nama lengkap</label><input class="field-input" id="userName" name="name" maxlength="60" placeholder="Contoh: Dung Pratama" required>
      <label class="field-label" for="userUsername">Username</label><input class="field-input" id="userUsername" name="username" maxlength="30" placeholder="Contoh: dung.petugas" required>
      <label class="field-label" for="userRole">Role</label><select class="field-input" id="userRole" name="role"><option value="petugas">Petugas</option><option value="admin">Admin</option><option value="owner">Owner</option></select>
      <div class="form-error" id="userError" role="alert"></div><div class="success-message" id="userSuccess" role="status"></div>
      <div class="form-actions"><button class="primary-button" type="submit" id="userSubmit">Tambah pengguna <span>→</span></button><button class="secondary-button hidden" type="button" id="cancelUserEdit">Batal edit</button></div>
    </form>
    <section class="section-card user-list-card"><div class="card-heading"><div><h2>Daftar pengguna</h2><p>${users.length} profil demo tersimpan.</p></div></div>
      ${users.length ? `<div class="table-wrap"><table><thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Terdaftar</th><th>Aksi</th></tr></thead><tbody>${users.map(user => `<tr><td>${escapeHTML(user.name)}</td><td>${escapeHTML(user.username)}</td><td><span class="role-badge ${escapeHTML(user.role)}">${escapeHTML(roleLabel(user.role))}</span></td><td>${formatDate(user.createdAt)}</td><td><div class="table-actions"><button class="small-button" type="button" data-edit-user="${escapeHTML(user.id)}">Edit</button><button class="small-button danger-button" type="button" data-delete-user="${escapeHTML(user.id)}" ${user.username.toLowerCase() === currentUsername.toLowerCase() ? 'disabled title="Akun yang sedang digunakan tidak bisa dihapus"' : ''}>Hapus</button></div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">Belum ada profil pengguna. Profil demo akan tercatat setelah login.</div>'}
    </section></div>`;
}

function activityContent() {
  const logs = getActivityLogs();
  const filtered = logs.filter(item =>
    `${item.action} ${item.username} ${roleLabel(item.role)}`.toLowerCase().includes(activityQuery.toLowerCase())
  );
  return `<section class="section-card"><div class="card-heading"><div><h2>Jejak aktivitas</h2><p>${filtered.length} dari ${logs.length} aktivitas terakhir.</p></div><label class="search-field"><span>⌕</span><input id="activitySearch" value="${escapeHTML(activityQuery)}" placeholder="Cari aktivitas atau pengguna" aria-label="Cari aktivitas"></label></div>
    <div class="notice-card compact-notice"><strong>Catatan demo</strong><span>Log tersimpan lokal di browser ini dan dibatasi hingga 250 aktivitas.</span></div>
    ${filtered.length ? `<div class="table-wrap"><table><thead><tr><th>Waktu</th><th>Pengguna</th><th>Role</th><th>Aktivitas</th></tr></thead><tbody>${filtered.map(item => `<tr><td>${formatDate(item.createdAt)}</td><td>${escapeHTML(item.username)}</td><td>${escapeHTML(roleLabel(item.role))}</td><td>${escapeHTML(item.action)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">Belum ada aktivitas yang cocok.</div>'}
  </section>`;
}

function reportsContent() {
  const data = getParkingData();
  const transactions = filterTransactions(data.transactions, reportRange);
  const revenue = transactions.reduce((sum, item) => sum + item.amount, 0);
  return `<div class="report-filter-wrap"><form class="section-card report-filter" id="reportFilterForm"><div class="filter-fields"><label class="field-label">Dari tanggal<input class="field-input" name="from" type="date" value="${reportRange.from}"></label><label class="field-label">Sampai tanggal<input class="field-input" name="to" type="date" value="${reportRange.to}"></label></div><div class="filter-actions"><button class="secondary-button" type="button" id="clearReportFilter">Reset</button><button class="primary-button" type="submit">Terapkan filter <span>→</span></button><button class="secondary-button" type="button" id="exportCsvButton">Unduh CSV ↓</button></div></form><div class="form-error report-error" id="reportError" role="alert"></div></div>
    <div class="stats-grid"><article class="stat-card"><span class="stat-icon">▤</span><p>Transaksi pada periode</p><strong>${transactions.length}</strong></article><article class="stat-card"><span class="stat-icon">Rp</span><p>Pendapatan pada periode</p><strong>${formatRupiah(revenue)}</strong></article><article class="stat-card"><span class="stat-icon">▣</span><p>Kendaraan Aktif</p><strong>${data.active.length}</strong></article></div>${recentTransactions(transactions, transactions.length, 'Riwayat transaksi')}`;
}

function filterTransactions(transactions, range) {
  return transactions.filter(item => {
    const date = localDateValue(item.exitedAt);
    return (!range.from || date >= range.from) && (!range.to || date <= range.to);
  });
}

function localDateValue(value) {
  const date = new Date(value);
  const pad = number => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function exportTransactionsCsv() {
  const transactions = filterTransactions(getParkingData().transactions, reportRange);
  const rows = [
    ['Nomor karcis', 'Nomor kendaraan', 'Jenis', 'Waktu masuk', 'Waktu keluar', 'Durasi (jam)', 'Biaya (Rp)', 'Pembayaran'],
    ...transactions.map(item => [
      item.ticket, item.plate, item.type === 'motor' ? 'Motor' : 'Mobil',
      formatDate(item.enteredAt), formatDate(item.exitedAt), item.hours, item.amount, item.paymentMethod
    ])
  ];
  const blob = new Blob([`\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `parkirku-${reportRange.from || 'semua'}-${reportRange.to || 'data'}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  return ({ admin: 'Administrator', petugas: 'Petugas Parkir', owner: 'Owner', sistem: 'Sistem' })[role] || 'Pengguna';
}

function recordActivity(action) {
  const user = getSession()?.user;
  logActivity(action, {
    username: user?.username,
    role: String(user?.role || '').toLowerCase()
  });
}

function printTicketMarkup(vehicle, transaction = null) {
  const title = transaction ? 'STRUK PARKIR' : 'KARCIS PARKIR';
  const rows = [
    ['Nomor karcis', vehicle.ticket],
    ['Nomor kendaraan', vehicle.plate],
    ['Jenis kendaraan', vehicle.type === 'motor' ? 'Motor' : 'Mobil'],
    ['Slot parkir', vehicle.slot],
    ['Waktu masuk', formatDate(vehicle.enteredAt)],
    ...(transaction ? [
      ['Waktu keluar', formatDate(transaction.exitedAt)],
      ['Durasi', `${transaction.hours} jam`],
      ['Pembayaran', transaction.paymentMethod],
      ['Total', formatRupiah(transaction.amount)]
    ] : [])
  ];
  const note = transaction ? 'Terima kasih, hati-hati di jalan.' : 'Simpan karcis ini sampai kendaraan keluar.';
  return `<div class="ticket-result ticket-print"><div class="ticket-brand">parkir<span>ku.</span></div><p class="ticket-kicker">${title}</p><div class="ticket-rule"></div>${rows.map(([label, value]) => `<div class="ticket-line"><span>${label}</span><strong>${escapeHTML(value)}</strong></div>`).join('')}<p class="ticket-thanks">${note}</p><button class="secondary-button print-trigger" type="button" data-print-trigger>Cetak ${transaction ? 'struk' : 'karcis'} ↗</button></div>`;
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
      recordActivity(`Mencatat kendaraan masuk ${vehicle.plate} (${vehicle.ticket})`);
      const ticketMarkup = printTicketMarkup(vehicle);
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
        recordActivity(`Menyelesaikan transaksi ${transaction.plate} sebesar ${formatRupiah(transaction.amount)}`);
        const receiptMarkup = `<div class="ticket-result transaction-success"><strong>Transaksi selesai</strong><span>${escapeHTML(transaction.plate)} · ${escapeHTML(transaction.ticket)}</span><span>Total dibayar ${formatRupiah(transaction.amount)} melalui ${escapeHTML(transaction.paymentMethod)}.</span><span>Slot ${escapeHTML(transaction.slot)} sekarang tersedia.</span></div>${printTicketMarkup(transaction, transaction)}`;
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
      recordActivity('Memperbarui tarif dan kapasitas slot parkir');
      success.textContent = 'Pengaturan tarif dan kapasitas berhasil disimpan.';
    } catch (err) {
      error.textContent = err.message;
    }
  }
});

document.addEventListener('submit', event => {
  if (event.target.id === 'userForm') {
    event.preventDefault();
    const form = event.target;
    const error = document.querySelector('#userError');
    error.textContent = '';
    try {
      const isEditing = Boolean(form.elements.namedItem('userId').value);
      const user = saveDemoUser({
        id: form.elements.namedItem('userId').value,
        name: form.elements.namedItem('name').value,
        username: form.elements.namedItem('username').value,
        role: form.elements.namedItem('role').value
      });
      recordActivity(`${isEditing ? 'Memperbarui' : 'Menambahkan'} pengguna ${user.username} (${roleLabel(user.role)})`);
      render();
      document.querySelector('#userSuccess').textContent = `Profil ${user.username} berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}.`;
    } catch (err) {
      error.textContent = err.message;
    }
  } else if (event.target.id === 'reportFilterForm') {
    event.preventDefault();
    const from = event.target.elements.namedItem('from').value;
    const to = event.target.elements.namedItem('to').value;
    if (from && to && from > to) {
      document.querySelector('#reportError').textContent = 'Tanggal awal tidak boleh melewati tanggal akhir.';
      return;
    }
    reportRange = { from, to };
    render();
  }
});

document.addEventListener('click', event => {
  const editButton = event.target.closest('[data-edit-user]');
  if (editButton) {
    const user = getDemoUsers().find(item => item.id === editButton.dataset.editUser);
    if (!user) return;
    const form = document.querySelector('#userForm');
    form.elements.namedItem('userId').value = user.id;
    form.elements.namedItem('name').value = user.name;
    form.elements.namedItem('username').value = user.username;
    form.elements.namedItem('role').value = user.role;
    document.querySelector('#userFormTitle').textContent = 'Edit pengguna';
    document.querySelector('#userSubmit').innerHTML = 'Simpan perubahan <span>→</span>';
    document.querySelector('#cancelUserEdit').classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form.elements.namedItem('name').focus();
    return;
  }

  const deleteButton = event.target.closest('[data-delete-user]');
  if (deleteButton) {
    const currentUsername = getSession()?.user?.username || '';
    try {
      if (!window.confirm('Hapus profil demo ini?')) return;
      const user = removeDemoUser(deleteButton.dataset.deleteUser, currentUsername);
      recordActivity(`Menghapus pengguna ${user.username}`);
      render();
    } catch (err) {
      const error = document.querySelector('#userError');
      if (error) error.textContent = err.message;
    }
    return;
  }

  if (event.target.closest('#cancelUserEdit')) {
    render();
    return;
  }

  if (event.target.closest('#clearReportFilter')) {
    reportRange = { from: '', to: '' };
    render();
    return;
  }

  if (event.target.closest('#exportCsvButton')) {
    exportTransactionsCsv();
    return;
  }

  if (event.target.closest('[data-print-trigger]')) {
    document.body.classList.add('print-ticket-mode');
    window.addEventListener('afterprint', () => document.body.classList.remove('print-ticket-mode'), { once: true });
    window.print();
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'activitySearch') {
    const cursor = event.target.selectionStart;
    activityQuery = event.target.value;
    render();
    const search = document.querySelector('#activitySearch');
    search.focus();
    search.setSelectionRange(cursor, cursor);
  }
});

window.addEventListener('hashchange', render);
render();
