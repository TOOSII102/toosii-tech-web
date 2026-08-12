import { request as httpsRequest } from 'node:https'
import { Readable } from 'node:stream'
import { HttpsProxyAgent } from 'https-proxy-agent'

const WEBSHARE_PROXY_HOST = process.env.WEBSHARE_PROXY_HOST || 'p.webshare.io'
const WEBSHARE_PROXY_PORT = process.env.WEBSHARE_PROXY_PORT || '80'
const WEBSHARE_LIST_URL = 'https://proxy.webshare.io/api/v2/proxy/list/?mode=backbone&page=1&page_size=100'
const PROXY_CACHE_TTL = 5 * 60 * 1000
const RETRYABLE_STATUS = new Set([400, 403, 404, 407, 408, 425, 429, 500, 502, 503, 504])
const MAX_PROXY_ATTEMPTS = Number(process.env.WEBSHARE_MAX_ATTEMPTS || 2)
const PROXY_TIMEOUT_MS = Number(process.env.WEBSHARE_PROXY_TIMEOUT_MS || 4000)

let cachedPool = []
let cachedAt = 0
let cursor = 0

function proxyUrl(proxy) {
  const username = encodeURIComponent(proxy.username || '')
  const password = encodeURIComponent(proxy.password || '')
  return `http://${username}:${password}@${WEBSHARE_PROXY_HOST}:${WEBSHARE_PROXY_PORT}`
}

async function loadProxyPool() {
  const apiKey = process.env.WEBSHARE_API_KEY
  if (!apiKey) return []
  if (cachedPool.length && Date.now() - cachedAt < PROXY_CACHE_TTL) return cachedPool

  try {
    const response = await fetch(WEBSHARE_LIST_URL, {
      headers: { Authorization: `Token ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    })
    if (!response.ok) return cachedPool
    const payload = await response.json()
    cachedPool = (payload.results || [])
      .filter(proxy => proxy.valid && proxy.proxy_address && proxy.port)
      .map(proxyUrl)
    cachedAt = Date.now()
    cursor = 0
  } catch {
    return cachedPool
  }

  return cachedPool
}

function requestThroughProxy(url, init, proxy) {
  return new Promise((resolve, reject) => {
    const target = new URL(url)
    const headers = Object.fromEntries(new Headers(init.headers || {}).entries())
    const request = httpsRequest(target, {
      method: init.method || 'GET',
      headers,
      agent: new HttpsProxyAgent(proxy),
      signal: init.signal,
    }, response => {
      const responseHeaders = new Headers()
      for (let index = 0; index < response.rawHeaders.length; index += 2) {
        responseHeaders.append(response.rawHeaders[index], response.rawHeaders[index + 1])
      }
      resolve(new Response(Readable.toWeb(response), {
        status: response.statusCode || 500,
        headers: responseHeaders,
      }))
    })

    request.once('error', reject)
    if (init.body) request.write(init.body)
    request.end()
  })
}

export async function fetchWithWebshare(url, init = {}) {
  const pool = await loadProxyPool()
  const attempts = Math.min(pool.length, MAX_PROXY_ATTEMPTS)

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const proxy = pool[cursor % pool.length]
    cursor = (cursor + 1) % pool.length
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS)
    try {
      const response = await requestThroughProxy(url, { ...init, signal: controller.signal }, proxy)
      if (!RETRYABLE_STATUS.has(response.status)) return response
      await response.body?.cancel()
    } catch {
      // Try another Webshare proxy, then fall back to the direct upstream.
    } finally {
      clearTimeout(timer)
    }
  }

  return fetch(url, init)
}

export function webshareEnabled() {
  return Boolean(process.env.WEBSHARE_API_KEY)
}
