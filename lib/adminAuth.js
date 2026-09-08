// Admin session tokens — HMAC-SHA256 signed, expiring, tamper-evident.
//
// Implemented with the Web Crypto API (globalThis.crypto.subtle) so the exact same
// module works in BOTH the Edge runtime (middleware.js) and the Node.js runtime
// (app/api/admin/* route handlers). Node's `crypto` module is NOT available in
// middleware, which is why this deliberately avoids it.
//
// Security properties:
//   * The cookie is a signed token, NOT the secret itself. Leaking a session
//     cookie no longer leaks ADMIN_SECRET.
//   * Tokens carry an expiry that is covered by the signature, so it can't be
//     extended by an attacker.
//   * There is NO insecure default secret. If ADMIN_SECRET is unset the admin
//     area fails closed (locked) instead of accepting a well-known value.

const encoder = new TextEncoder()

const SESSION_COOKIE = 'admin_token'
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MIN_SECRET_LENGTH = 16

function base64url(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// The token payload is delimited by '.', and an email address contains dots, so
// the email is base64url-encoded first. base64url output is [A-Za-z0-9_-] only,
// which keeps the token safely splittable into exactly three parts.
function encodeEmail(email) {
  return base64url(encoder.encode(email))
}

function decodeEmail(encoded) {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Returns the configured admin secret, or null when it is missing/too weak.
 * Callers MUST treat null as "admin access disabled".
 */
export function getAdminSecret() {
  const secret = process.env.ADMIN_SECRET
  if (typeof secret !== 'string') return null
  const trimmed = secret.trim()
  if (trimmed.length < MIN_SECRET_LENGTH) return null
  return trimmed
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(data)))
}

/** Length-independent constant-time-ish string compare (avoids early-exit leaks). */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Builds a signed session token of the form `base64url(email).expiry.signature`. */
export async function createSessionToken(email, ttlMs = DEFAULT_TTL_MS) {
  const secret = getAdminSecret()
  if (!secret) throw new Error('ADMIN_SECRET is not configured')
  const expiresAt = Date.now() + ttlMs
  const payload = `${encodeEmail(email)}.${expiresAt}`
  return `${payload}.${await hmac(secret, payload)}`
}

/** Verifies signature + expiry. Returns the email on success, null on any failure. */
export async function verifySessionToken(token) {
  const secret = getAdminSecret()
  if (!secret || typeof token !== 'string') return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [rawEmail, rawExpiry, signature] = parts
  const payload = `${rawEmail}.${rawExpiry}`

  // Verify the signature BEFORE trusting anything inside the payload.
  const expected = await hmac(secret, payload)
  if (!safeEqual(signature, expected)) return null

  const expiresAt = Number(rawExpiry)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null

  try {
    return decodeEmail(rawEmail)
  } catch {
    return null
  }
}

/** Standard cookie options for the admin session. */
export function sessionCookieOptions(maxAgeMs = DEFAULT_TTL_MS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(maxAgeMs / 1000),
    path: '/',
  }
}

export { SESSION_COOKIE, DEFAULT_TTL_MS, MIN_SECRET_LENGTH }
