const encoder = new TextEncoder();
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_COOKIE = 'goodness_session';
const ITERATIONS = 100_000;
export function randomToken() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''); }
export async function digest(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), b => b.toString(16).padStart(2, '0')).join(''); }
function hex(bytes: Uint8Array) { return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''); }
function unhex(value: string) { return new Uint8Array(value.match(/.{2}/g)?.map(v => parseInt(v, 16)) || []); }
async function derive(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(salt).buffer, iterations: ITERATIONS }, key, 256));
}
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${ITERATIONS}$${hex(salt)}$${hex(await derive(password, salt))}`;
}
export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split('$');
  if (parts[0] !== 'pbkdf2-sha256' || parts[1] !== String(ITERATIONS) || !/^[a-f0-9]{32}$/.test(parts[2] || '') || !/^[a-f0-9]{64}$/.test(parts[3] || '')) return false;
  const actual = await derive(password, unhex(parts[2]));
  const expected = unhex(parts[3]);
  let diff = actual.length ^ expected.length;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
export function sameOrigin(request: Request) { const origin = request.headers.get('origin'); return !!origin && origin === new URL(request.url).origin; }
export function sessionToken(cookieHeader: string | null) {
  const cookie = cookieHeader?.split(';').map(v => v.trim()).find(v => v.startsWith(`${SESSION_COOKIE}=`));
  const value = cookie?.slice(SESSION_COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export function sessionCookie(token: string, secure: boolean, maxAge = SESSION_SECONDS) { return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`; }
