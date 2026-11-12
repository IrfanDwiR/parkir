import { API_BASE_URL, DEMO_MODE } from './config.js';

const SESSION_KEY = 'parkirku_session';
const VALID_ROLES = ['admin', 'petugas', 'owner'];

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export async function login(username, password, demoRole = 'admin') {
  const cleanUsername = username.trim();
  if (!cleanUsername || !password.trim()) {
    throw new Error('Username dan password wajib diisi.');
  }

  let session;
  if (DEMO_MODE) {
    if (!VALID_ROLES.includes(demoRole)) throw new Error('Role tidak valid.');
    session = {
      token: 'demo-token',
      user: { id: 1, username: cleanUsername, role: demoRole }
    };
  } else {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password })
      });
    } catch {
      throw new Error('Server backend belum bisa dihubungi. Pastikan server sudah berjalan.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Username atau password salah.');
    if (!data.token || !data.user) throw new Error('Format respons login backend belum sesuai.');
    session = { token: data.token, user: data.user };
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  location.hash = '#/login';
}
