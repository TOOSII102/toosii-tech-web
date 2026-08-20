export const MEDIA_LIBRARY_EVENT = 'toosii-media-library-changed'
export const WATCHED_KEY = 'toosii_watched_v1'
export const MY_LIST_KEY = 'toosii_my_list_v1'
export const DOWNLOADS_KEY = 'toosii_downloads_v1'

function read(key) {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(MEDIA_LIBRARY_EVENT, { detail: { key } }))
  } catch {
    // Storage can be unavailable in private browsing or restricted webviews.
  }
}

function identity(item, season = '', episode = '') {
  return [item?.subjectId || item?.id || item?.title || 'unknown', season || '', episode || ''].join(':')
}

export function mediaRecord(item = {}, extra = {}) {
  const season = extra.season || item.season || ''
  const episode = extra.episode || item.episode || ''
  return {
    key: identity(item, season, episode),
    subjectId: String(item.subjectId || item.id || ''),
    title: String(item.title || item.name || 'Untitled'),
    cover: item.cover?.url || item.cover || item.poster || '',
    mediaKind: String(item.mediaKind || extra.mediaKind || ''),
    subjectType: Number(item.subjectType || extra.subjectType || 1),
    season: season ? Number(season) : '',
    episode: episode ? Number(episode) : '',
    updatedAt: Date.now(),
    ...extra,
  }
}

function upsert(key, record, limit = 60) {
  const list = read(key).filter(entry => entry.key !== record.key)
  list.unshift(record)
  write(key, list.slice(0, limit))
  return list.slice(0, limit)
}

export function getWatched() { return read(WATCHED_KEY) }
export function getMyList() { return read(MY_LIST_KEY) }
export function getDownloads() { return read(DOWNLOADS_KEY) }

export function recordWatched(item, extra = {}) {
  return upsert(WATCHED_KEY, mediaRecord(item, { ...extra, watchedAt: Date.now() }))
}

export function isInMyList(item, extra = {}) {
  const key = identity(item, extra.season || item?.season, extra.episode || item?.episode)
  return getMyList().some(entry => entry.key === key)
}

export function toggleMyList(item, extra = {}) {
  const record = mediaRecord(item, extra)
  const list = getMyList()
  const next = list.some(entry => entry.key === record.key)
    ? list.filter(entry => entry.key !== record.key)
    : [record, ...list].slice(0, 100)
  write(MY_LIST_KEY, next)
  return next
}

export function recordDownload(item, extra = {}) {
  return upsert(DOWNLOADS_KEY, mediaRecord(item, {
    ...extra,
    status: extra.status || 'started',
    startedAt: extra.startedAt || Date.now(),
  }))
}

export function clearLibrary(key) {
  write(key, [])
}

export function subscribeMediaLibrary(handler) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(MEDIA_LIBRARY_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(MEDIA_LIBRARY_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}
