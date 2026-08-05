// Einfache, zustandslose Admin-Session: ein HttpOnly-Cookie mit
// Ablaufzeitpunkt + HMAC-Signatur (Secret = env.SESSION_SECRET). Kein
// zusätzliches D1-Sessions-Table nötig, siehe Briefing Punkt 6 "Admin-Auth".

const COOKIE_NAME = "radlhias_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 Stunden

function toBase64Url(bytes) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function hmacSign(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toBase64Url(new Uint8Array(sig));
}

export async function createSessionCookie(env) {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${expires}`;
  const sig = await hmacSign(env.SESSION_SECRET, payload);
  const token = `${payload}.${sig}`;

  const secureAttr = "Secure; ";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; ${secureAttr}SameSite=None; Max-Age=${Math.floor(
    SESSION_TTL_MS / 1000
  )}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

export async function isAuthenticated(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  const token = cookies[COOKIE_NAME];
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [kind, expiresStr, sig] = parts;
  if (kind !== "admin") return false;

  const expected = await hmacSign(env.SESSION_SECRET, `${kind}.${expiresStr}`);
  if (expected !== sig) return false;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  return true;
}
