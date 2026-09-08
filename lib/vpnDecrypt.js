// Client for the external VPN config decryptor service.
//
// The public inspector can parse plaintext formats (ovpn, ss, v2ray, singbox)
// on its own, but the tunnel apps ship *encrypted* container files — .hc,
// .ehi, .dark, .npvt and friends — which need app-specific key derivation to
// open. That work is delegated to the decryptor service.
//
// IMPORTANT: the upstream response includes a `raw` field holding the complete
// decrypted plaintext, and `data` contains live credentials (password, user,
// keys). Callers must run `data` through the inspector's redaction pass and
// must never forward `raw` to the client.

const DEFAULT_BASE = 'https://hat-slip-howdy--youtubepremken1.replit.app'
const TIMEOUT_MS = 30_000

// Extension/alias -> decryptor endpoint.
const ENDPOINTS = {
  hc: 'hc',
  hcc: 'hc',
  ehi: 'ehi',
  dark: 'dark',
  npvt: 'npvt',
  npv: 'npvt',
  dtlink: 'dtlink',
  darktunnel: 'dtlink',
  naruto: 'naruto',
  ssc: 'ssc',
}

/** Human labels so the UI can name the source app without a second lookup. */
export const DECRYPTABLE_LABELS = {
  hc: 'HTTP Custom',
  hcc: 'HTTP Custom',
  ehi: 'HTTP Injector',
  dark: 'Dark Tunnel',
  npvt: 'NPV Tunnel',
  npv: 'NPV Tunnel',
  dtlink: 'Dark Tunnel link',
  darktunnel: 'Dark Tunnel link',
  naruto: 'Dark Tunnel (.NARUTO)',
  ssc: 'SSC Custom',
}

export const DECRYPTABLE_TYPES = new Set(Object.keys(ENDPOINTS))

export function isDecryptableType(type) {
  return DECRYPTABLE_TYPES.has(String(type || '').toLowerCase())
}

function baseUrl() {
  return (process.env.VPN_DECRYPTOR_URL || DEFAULT_BASE).replace(/\/+$/, '')
}

/**
 * Sends the encrypted config to the decryptor service.
 *
 * @param {string} type      one of DECRYPTABLE_TYPES
 * @param {Buffer|Uint8Array} bytes  raw file bytes (NOT text — these are binary)
 * @param {string} filename
 * @returns {Promise<{ ok: true, app: string, type: string, data: any } | { ok: false, status: number, code: string, message: string }>}
 */
export async function decryptConfig(type, bytes, filename = 'config') {
  const key = String(type || '').toLowerCase()
  const endpoint = ENDPOINTS[key]
  if (!endpoint) {
    return { ok: false, status: 400, code: 'UNSUPPORTED_FORMAT', message: `No decryptor is available for .${key} files.` }
  }

  const form = new FormData()
  form.append('file', new Blob([bytes]), filename || `config.${key}`)

  let res
  try {
    res = await fetch(`${baseUrl()}/api/decrypt/${endpoint}`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError'
    return {
      ok: false,
      status: 504,
      code: timedOut ? 'DECRYPTOR_TIMEOUT' : 'DECRYPTOR_UNREACHABLE',
      message: timedOut
        ? 'The decryption service took too long to respond. Please try again.'
        : 'The decryption service is unreachable right now. Please try again shortly.',
    }
  }

  let payload
  try {
    payload = await res.json()
  } catch {
    return { ok: false, status: 502, code: 'DECRYPTOR_BAD_RESPONSE', message: 'The decryption service returned an unreadable response.' }
  }

  if (!res.ok) {
    // The service uses 422 for "recognised format, but this variant is not supported".
    return {
      ok: false,
      status: res.status === 422 ? 422 : 502,
      code: res.status === 422 ? 'FORMAT_VARIANT_UNSUPPORTED' : 'DECRYPTOR_ERROR',
      message: String(payload?.error || 'The file could not be decrypted.').slice(0, 300),
    }
  }

  if (!payload || typeof payload !== 'object' || payload.data === undefined) {
    return { ok: false, status: 502, code: 'DECRYPTOR_BAD_RESPONSE', message: 'The decryption service returned no configuration data.' }
  }

  // `payload.raw` is deliberately dropped here — it is the full decrypted
  // plaintext and must never leave the server.
  return {
    ok: true,
    app: payload.app || DECRYPTABLE_LABELS[key] || 'VPN config',
    type: payload.type || key,
    data: payload.data,
  }
}
