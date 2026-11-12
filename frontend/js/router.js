import { getSession } from './auth.js';

export function navigate() {
  const session = getSession();
  const route = location.hash || '#/login';
  if (!session && route !== '#/login') {
    location.hash = '#/login';
    return '#/login';
  }
  if (session && route === '#/login') {
    location.hash = '#/dashboard';
    return '#/dashboard';
  }
  return route;
}
