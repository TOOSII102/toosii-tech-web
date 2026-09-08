// Live-stream health checking.
//
// The iptv-org catalogue lists streams; it does not guarantee they are up. In
// practice a large share are dead — a single dead host (goliveafrica.media)
// accounts for 31 of Kenya's 37 listed channels, which made the directory look
// broken even though the data was "correct".
//
// Rather than hand users a wall of channels that fail on click, each stream is
// probed server-side and only working ones are shown. Verdicts are cached so
// the cost is paid once per stream per TTL, not once per page view.

const TTL_OK_MS = 5 * 60 * 1000    // healthy verdicts go stale fast — streams die without warning
const TTL_BAD_MS = 5 * 60 * 1000   // re-test failures too, they may recover
const PROBE_TIMEOUT_MS = 6000
const MAX_CONCURRENT = 24

if (!global.__streamHealth) global.__streamHealth = new Map()
const cache = global.__streamHealth

function cached(url, maxAgeMs) {
  const hit = cache.get(url)
  if (!hit) return undefined
  const ttl = maxAgeMs ?? (hit.ok ? TTL_OK_MS : TTL_BAD_MS)
  if (Date.now() - hit.ts > ttl) { cache.delete(url); return undefined }
  return hit.ok
}

/**
 * Probes a single stream URL. Returns true only when the origin answers 200
 * with something that actually looks like a playlist/media response.
 */
async function probe(url, maxAgeMs) {
  const known = cached(url, maxAgeMs)
  if (known !== undefined) return known

  let ok = false
  try {
    const res = await fetch(url, {
      // Range keeps the transfer tiny — we only need the first bytes to know
      // the origin is alive and serving a real playlist.
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ToosiiTech/1.0)',
        Range: 'bytes=0-2047',
        Accept: '*/*',
      },
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })

    if (res.status === 200 || res.status === 206) {
      const body = await res.text().catch(() => '')
      // A valid HLS playlist starts with #EXTM3U. Some origins return an HTML
      // error page with a 200, so a status check alone is not enough.
      if (/\.m3u8(\?|$)/i.test(url)) ok = body.includes('#EXTM3U')
      else ok = body.length > 0 && !/^\s*<(!doctype|html)/i.test(body)
    }
  } catch {
    ok = false
  }

  cache.set(url, { ok, ts: Date.now() })
  return ok
}

/** Runs `worker` over `items` with a bounded number of parallel requests. */
async function mapLimit(items, limit, worker) {
  const out = new Array(items.length)
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      out[i] = await worker(items[i], i)
    }
  })
  await Promise.all(runners)
  return out
}

/**
 * Returns the subset of `channels` that have at least one reachable stream,
 * with each channel's stream list reordered so the working one is first.
 */
export async function keepWorking(channels) {
  const verdicts = await mapLimit(channels, MAX_CONCURRENT, async channel => {
    const streams = channel.streams || []
    // Probe sequentially per channel (most have 1-2 sources) and stop at the
    // first hit, so a channel with a good primary costs a single request.
    for (const s of streams) {
      // eslint-disable-next-line no-await-in-loop
      if (await probe(s.url)) return { ...channel, streams: [s, ...streams.filter(x => x !== s)] }
    }
    return null
  })
  return verdicts.filter(Boolean)
}

/**
 * Re-checks a channel's sources at play time and returns the first that is
 * working *now*. The grid verdict can be up to TTL_OK_MS old, which is ample
 * time for a stream to go down, so playback never trusts it blindly.
 */
export async function resolvePlayable(streams = [], maxAgeMs = 60_000) {
  for (const s of streams) {
    // eslint-disable-next-line no-await-in-loop
    if (await probe(s.url, maxAgeMs)) return s
  }
  return null
}

export function healthStats() {
  let ok = 0
  for (const v of cache.values()) if (v.ok) ok++
  return { cached: cache.size, ok }
}
