// Server-only registry for content that Toosii Tech owns or is licensed to distribute.
// Do not add third-party catalogue results here unless you have the matching distribution rights.
// Replace this registry with a database table when you add an admin upload workflow.

const LICENSED_VIDEO_ASSETS = {
  // Example movie mapping:
  // 'your-catalogue-subject-id': {
  //   title: 'Your licensed movie title',
  //   type: 'movie',
  //   active: true,
  //   downloadEnabled: true,
  //   publicDownload: true, // Keep false or omit until user entitlement checks are implemented.
  //   allowedTerritories: ['KE'], // Use ['*'] only when your licence is worldwide.
  //   renditions: {
  //     '720': 'movies/your-catalogue-subject-id/720p.mp4',
  //     '1080': 'movies/your-catalogue-subject-id/1080p.mp4',
  //   },
  // },

  // Example episode mapping:
  // 'your-series-subject-id:s1:e1': {
  //   title: 'Your licensed series — S01E01',
  //   type: 'episode',
  //   active: true,
  //   downloadEnabled: true,
  //   allowedTerritories: ['KE'],
  //   renditions: {
  //     '720': 'series/your-series-subject-id/s01/e01/720p.mp4',
  //   },
  // },
}

function assetKey({ subjectId, type, season, episode }) {
  if (type === 'episode') return `${subjectId}:s${season}:e${episode}`
  return subjectId
}

export function getLicensedVideoAsset({ subjectId, type = 'movie', season, episode, resolution }) {
  const asset = LICENSED_VIDEO_ASSETS[assetKey({ subjectId, type, season, episode })]
  if (!asset?.active || !asset.downloadEnabled) return null

  const r2Key = asset.renditions?.[String(resolution)]
  if (!r2Key) return null

  return {
    ...asset,
    r2Key,
    resolution: String(resolution),
  }
}

export function isTerritoryAllowed(asset, countryCode) {
  const territories = asset?.allowedTerritories || []
  return territories.includes('*') || territories.includes(String(countryCode || '').toUpperCase())
}
