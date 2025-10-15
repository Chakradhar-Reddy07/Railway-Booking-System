// services/auth.js
export function saveToken(token) {
  localStorage.setItem('rb_token', token);
}
export function getTokenFromStorage() {
  return localStorage.getItem('rb_token');
}
export function removeToken() {
  localStorage.removeItem('rb_token');
}
export function authHeader() {
  const token = getTokenFromStorage();
  return token ? { Authorization: 'Bearer ' + token } : {};
}
