const encoder = new TextEncoder();
const cookieName = 'sticker-admin-auth';
const sessionLifetimeSeconds = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.BLOB_READ_WRITE_TOKEN || process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET ontbreekt.');
  return secret;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(getSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

export async function createAdminSessionToken() {
  const payload = `${Date.now()}.${crypto.randomUUID()}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyAdminSessionToken(token: string | undefined) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [issuedAt, nonce, signature] = parts;
  const timestamp = Number(issuedAt);
  if (!nonce || !Number.isFinite(timestamp) || Date.now() - timestamp > sessionLifetimeSeconds * 1000 || timestamp > Date.now() + 60_000) return false;
  try {
    const key = await crypto.subtle.importKey('raw', encoder.encode(getSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    return crypto.subtle.verify('HMAC', key, fromBase64Url(signature), encoder.encode(`${issuedAt}.${nonce}`));
  } catch {
    return false;
  }
}

export { cookieName, sessionLifetimeSeconds };
