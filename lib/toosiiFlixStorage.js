const STORAGE_KEY = 'toosiiFlix.personalization.v1'
export const PROFILE_COLORS = ['#d2ff53', '#9f7aea', '#ff725c', '#84d7ff', '#f5c451']
const MAX_PROFILES = 5
const MAX_LIST_ITEMS = 80
const MAX_HISTORY_ITEMS = 40

function browserReady() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function makeProfile(name = 'Viewer', color = PROFILE_COLORS[0]) {
  return {
    id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: String(name || 'Viewer').trim().slice(0, 22) || 'Viewer',
    color: PROFILE_COLORS.includes(color) ? color : PROFILE_COLORS[0],
    createdAt: Date.now(),
  }
}

function emptyCollections() {
  return { list: [], history: [] }
}

export function createInitialPersonalization() {
  const profile = makeProfile()
  return {
    profiles: [profile],
    activeProfileId: profile.id,
    collections: { [profile.id]: emptyCollections() },
  }
}

function safeItem(item = {}) {
  const subjectId = String(item.subjectId || '')
  if (!subjectId) return null
  return {
    subjectId,
    title: String(item.title || 'Untitled').slice(0, 160),
    cover: item.cover?.url || item.cover || '',
    subjectType: Number(item.subjectType) === 2 ? 2 : 1,
    releaseDate: String(item.releaseDate || '').slice(0, 32),
    genre: String(item.genre || '').slice(0, 160),
    imdbRatingValue: item.imdbRatingValue || null,
  }
}

function sanitizeState(value) {
  if (!value || !Array.isArray(value.profiles) || !value.profiles.length) return createInitialPersonalization()
  const profiles = value.profiles.slice(0, MAX_PROFILES).map((profile, index) => ({
    id: String(profile?.id || `profile_restored_${index}`),
    name: String(profile?.name || 'Viewer').trim().slice(0, 22) || 'Viewer',
    color: PROFILE_COLORS.includes(profile?.color) ? profile.color : PROFILE_COLORS[index % PROFILE_COLORS.length],
    createdAt: Number(profile?.createdAt) || Date.now(),
  }))
  const activeProfileId = profiles.some(profile => profile.id === value.activeProfileId) ? value.activeProfileId : profiles[0].id
  const collections = {}

  profiles.forEach(profile => {
    const raw = value.collections?.[profile.id] || emptyCollections()
    const list = Array.isArray(raw.list) ? raw.list.map(safeItem).filter(Boolean).slice(0, MAX_LIST_ITEMS) : []
    const history = Array.isArray(raw.history)
      ? raw.history.map(entry => {
          const item = safeItem(entry)
          return item ? {
            ...item,
            lastWatchedAt: Number(entry.lastWatchedAt) || Date.now(),
            season: Number(entry.season) || null,
            episode: Number(entry.episode) || null,
          } : null
        }).filter(Boolean).slice(0, MAX_HISTORY_ITEMS)
      : []
    collections[profile.id] = { list, history }
  })

  return { profiles, activeProfileId, collections }
}

export function loadPersonalization() {
  if (!browserReady()) return createInitialPersonalization()
  try {
    return sanitizeState(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null'))
  } catch {
    return createInitialPersonalization()
  }
}

export function savePersonalization(state) {
  const safeState = sanitizeState(state)
  if (browserReady()) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeState)) } catch {}
  }
  return safeState
}

export function addProfile(state, name, color) {
  const next = sanitizeState(state)
  if (next.profiles.length >= MAX_PROFILES) return next
  const profile = makeProfile(name, color)
  return {
    ...next,
    profiles: [...next.profiles, profile],
    activeProfileId: profile.id,
    collections: { ...next.collections, [profile.id]: emptyCollections() },
  }
}

export function removeProfile(state, profileId) {
  const next = sanitizeState(state)
  if (next.profiles.length <= 1) return next
  const profiles = next.profiles.filter(profile => profile.id !== profileId)
  const collections = { ...next.collections }
  delete collections[profileId]
  return {
    ...next,
    profiles,
    activeProfileId: next.activeProfileId === profileId ? profiles[0].id : next.activeProfileId,
    collections,
  }
}

export function switchProfile(state, profileId) {
  const next = sanitizeState(state)
  return next.profiles.some(profile => profile.id === profileId) ? { ...next, activeProfileId: profileId } : next
}

export function toggleMyList(state, profileId, source) {
  const next = sanitizeState(state)
  const item = safeItem(source)
  if (!item || !next.collections[profileId]) return next
  const current = next.collections[profileId]
  const exists = current.list.some(entry => entry.subjectId === item.subjectId)
  const list = exists
    ? current.list.filter(entry => entry.subjectId !== item.subjectId)
    : [{ ...item, savedAt: Date.now() }, ...current.list].slice(0, MAX_LIST_ITEMS)
  return { ...next, collections: { ...next.collections, [profileId]: { ...current, list } } }
}

export function recordWatch(state, profileId, source, { season = null, episode = null } = {}) {
  const next = sanitizeState(state)
  const item = safeItem(source)
  if (!item || !next.collections[profileId]) return next
  const current = next.collections[profileId]
  const entry = { ...item, season: Number(season) || null, episode: Number(episode) || null, lastWatchedAt: Date.now() }
  const history = [entry, ...current.history.filter(previous => previous.subjectId !== item.subjectId)].slice(0, MAX_HISTORY_ITEMS)
  return { ...next, collections: { ...next.collections, [profileId]: { ...current, history } } }
}
