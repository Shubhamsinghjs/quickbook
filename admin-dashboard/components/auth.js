export const TOKEN_KEY = 'quickbookToken';

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setAdminToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}
