// SSRF protection for server-side "fetch a user-supplied URL" endpoints.
//
// Without this, /api/download/proxy would happily fetch ANY url the caller
// passes — including http://127.0.0.1:3000/... (the app's own internal APIs),
// http://169.254.169.254/ (cloud instance metadata / credentials) and hosts
// inside the deployment's private network. It also made the site usable as a
// free open proxy for arbitrary traffic.
//
// Node.js runtime only (uses `dns`). Do not import from Edge middleware.

import dns from 'node:dns/promises'
import net from 'node:net'

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const MAX_REDIRECTS = 5

/** True for loopback / private / link-local / reserved addresses. */
function isBlockedAddress(ip) {
  const type = net.isIP(ip)
  if (type === 4) return isBlockedIPv4(ip)
  if (type === 6) return isBlockedIPv6(ip)
  return true // not a parseable IP → refuse
}

function isBlockedIPv4(ip) {
  const p = ip.split('.').map(Number)
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true

  const [a, b] = p
  if (a === 0) return true                          // 0.0.0.0/8   this network
  if (a === 10) return true                         // 10/8        private
  if (a === 127) return true                        // 127/8       loopback
  if (a === 169 && b === 254) return true           // 169.254/16  link-local (metadata)
  if (a === 172 && b >= 16 && b <= 31) return true  // 172.16/12   private
  if (a === 192 && b === 168) return true           // 192.168/16  private
  if (a === 192 && b === 0) return true             // 192.0.0/24 + 192.0.2/24
  if (a === 100 && b >= 64 && b <= 127) return true // 100.64/10   CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true // 198.18/15 benchmarking
  if (a === 198 && b === 51) return true            // 198.51.100/24 TEST-NET-2
  if (a === 203 && b === 0) return true             // 203.0.113/24  TEST-NET-3
  if (a >= 224) return true                         // multicast + reserved + broadcast
  return false
}

function isBlockedIPv6(ip) {
  const addr = ip.toLowerCase().split('%')[0] // strip zone index

  if (addr === '::' || addr === '::1') return true          // unspecified / loopback
  if (addr.startsWith('fe80')) return true                  // link-local
  if (/^f[cd]/.test(addr)) return true                      // fc00::/7 unique-local
  if (addr.startsWith('ff')) return true                    // multicast

  // IPv4-mapped / IPv4-compatible (::ffff:127.0.0.1) — validate the embedded v4.
  const mapped = /^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/.exec(addr)
  if (mapped) return isBlockedIPv4(mapped[1])

  // NAT64 / well-known prefix 64:ff9b::/96 can also reach internal v4 space.
  if (addr.startsWith('64:ff9b:')) return true

  return false
}

/**
 * Validates a single URL: correct scheme, resolvable host, and no address that
 * points back into private/internal space.
 *
 * @returns {Promise<{ ok: true, url: URL } | { ok: false, reason: string }>}
 */
export async function assertPublicUrl(rawUrl) {
  let url
  try {
    url = new URL(rawUrl)
  } catch {
    return { ok: false, reason: 'Invalid URL.' }
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { ok: false, reason: 'Only http:// and https:// URLs are supported.' }
  }

  // Credentials in the URL are a common filter-bypass trick (http://evil@127.0.0.1).
  if (url.username || url.password) {
    return { ok: false, reason: 'URLs containing credentials are not allowed.' }
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '') // unwrap [::1]

  // Literal IP supplied directly.
  if (net.isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      return { ok: false, reason: 'That address is not allowed.' }
    }
    return { ok: true, url }
  }

  if (/^localhost$|\.localhost$|\.local$|\.internal$/i.test(hostname)) {
    return { ok: false, reason: 'That address is not allowed.' }
  }

  // Resolve the hostname and check EVERY address it maps to, so a domain that
  // resolves to 127.0.0.1 (DNS rebinding style) is rejected too.
  let addresses
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true })
  } catch {
    return { ok: false, reason: 'Could not resolve that host.' }
  }

  if (!addresses.length) return { ok: false, reason: 'Could not resolve that host.' }
  if (addresses.some(a => isBlockedAddress(a.address))) {
    return { ok: false, reason: 'That address is not allowed.' }
  }

  return { ok: true, url }
}

/**
 * fetch() that validates the target URL and re-validates every redirect hop,
 * so an allowed public host can't bounce the request to an internal one.
 */
export async function safeFetch(rawUrl, init = {}) {
  let current = rawUrl

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const check = await assertPublicUrl(current)
    if (!check.ok) {
      const err = new Error(check.reason)
      err.code = 'BLOCKED_URL'
      throw err
    }

    const res = await fetch(check.url, { ...init, redirect: 'manual' })

    // 3xx with a Location → validate the next hop before following it.
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location) return res
      current = new URL(location, check.url).toString()
      continue
    }

    return res
  }

  const err = new Error('Too many redirects.')
  err.code = 'TOO_MANY_REDIRECTS'
  throw err
}
