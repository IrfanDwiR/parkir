const USERS_KEY = 'parkirku_demo_users';
const ACTIVITY_KEY = 'parkirku_activity_log';
const USER_ROLES = ['admin', 'petugas', 'owner'];
const MAX_ACTIVITY_LOGS = 250;

function readList(key) {
  const saved = localStorage.getItem(key);
  if (!saved) return [];
  const value = JSON.parse(saved);
  if (!Array.isArray(value)) throw new Error('Data demo tidak valid. Bersihkan data situs lalu coba lagi.');
  return value;
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDemoUsers() {
  return readList(USERS_KEY);
}

export function saveDemoUser(user) {
  const name = user.name.trim();
  const username = user.username.trim();
  if (!name) throw new Error('Nama pengguna wajib diisi.');
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
    throw new Error('Username harus 3–30 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.');
  }
  if (!USER_ROLES.includes(user.role)) throw new Error('Role pengguna tidak valid.');

  const users = readList(USERS_KEY);
  const duplicate = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() && item.id !== user.id
  );
  if (duplicate) throw new Error('Username tersebut sudah terdaftar.');

  const current = users.find(item => item.id === user.id);
  const savedUser = {
    id: current?.id || createId('user'),
    name,
    username,
    role: user.role,
    createdAt: current?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const index = users.findIndex(item => item.id === savedUser.id);
  if (index >= 0) users[index] = savedUser;
  else users.unshift(savedUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return savedUser;
}

export function removeDemoUser(id, currentUsername) {
  const users = readList(USERS_KEY);
  const user = users.find(item => item.id === id);
  if (!user) throw new Error('Pengguna tidak ditemukan.');
  if (user.username.toLowerCase() === currentUsername.toLowerCase()) {
    throw new Error('Akun yang sedang digunakan tidak bisa dihapus.');
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users.filter(item => item.id !== id)));
  return user;
}

export function syncDemoUser(sessionUser) {
  const username = String(sessionUser.username || '').trim();
  if (!username) return;
  const users = readList(USERS_KEY);
  const current = users.find(item => item.username.toLowerCase() === username.toLowerCase());
  const role = current?.role || (USER_ROLES.includes(sessionUser.role) ? sessionUser.role : 'admin');
  const user = {
    id: current?.id || createId('user'),
    name: current?.name || username,
    username,
    role,
    createdAt: current?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const index = users.findIndex(item => item.id === user.id);
  if (index >= 0) users[index] = user;
  else users.unshift(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getActivityLogs() {
  return readList(ACTIVITY_KEY);
}

export function logActivity(action, actor) {
  const logs = readList(ACTIVITY_KEY);
  logs.unshift({
    id: createId('activity'),
    action,
    username: actor?.username || 'Sistem',
    role: USER_ROLES.includes(actor?.role) ? actor.role : 'sistem',
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(logs.slice(0, MAX_ACTIVITY_LOGS)));
}
