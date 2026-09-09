// Routes are listed explicitly (not auto-discovered) so private surfaces —
// /admin, share pages, and the movie player — never appear in the sitemap.
const ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/live-tv', priority: 0.9, changeFrequency: 'daily' },
  { path: '/tools/movies', priority: 0.9, changeFrequency: 'daily' },
  { path: '/tools/ai', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/bot', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/tools', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/api', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/downloader/video', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/downloader/audio', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/downloader/spotify', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tools/vocal-remover', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tools/dramabox', priority: 0.8, changeFrequency: 'daily' },
  { path: '/tools/config-inspector', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tools/firelogo', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tools/imagine', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tools/remove-bg', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tools/lyrics', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tools/story', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tools/tempemail', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/tools/apk', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/session', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/library', priority: 0.7, changeFrequency: 'daily' },
  { path: '/search', priority: 0.7, changeFrequency: 'daily' },
  { path: '/blog', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/projects', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/team', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/copyright', priority: 0.3, changeFrequency: 'yearly' },
]

export default function sitemap() {
  const base = 'https://www.toosiitech.org'
  const now = new Date()
  return ROUTES.map(r => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
