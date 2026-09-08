import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const pages = {
  '/': {
    eyebrow: 'TOOSII TECH',
    title: 'Everything, in one place.',
    description: 'Live TV from 177 countries, HD movies, downloaders, AI tools, a 150-command WhatsApp bot and a free public API.',
    accent: '#72f0ba',
    secondary: '#75d6ff',
    chips: ['8,400+ Live Channels', '17 Free Tools', 'Free API'],
    layout: 'home',
  },
  '/tools/movies': {
    eyebrow: 'MOVIES & SERIES',
    title: 'Stream. Discover. Enjoy.',
    description: 'Browse HD movies and series with a cinematic streaming experience.',
    accent: '#a78bfa',
    secondary: '#75d6ff',
    chips: ['Trending Now', 'HD Streaming', 'Movies + Series'],
    layout: 'movies',
  },
  '/downloader/audio': {
    eyebrow: 'MP3 DOWNLOADER',
    title: 'YouTube to MP3.',
    description: 'Search a song or paste a link, preview it, and download clean MP3 audio.',
    accent: '#72f0ba',
    secondary: '#fbbf24',
    chips: ['Search by Song Name', '64kbps MP3', 'Fast Download'],
    layout: 'audio',
  },
  '/downloader/video': {
    eyebrow: 'VIDEO DOWNLOADER',
    title: 'Your video. Your quality.',
    description: 'Download videos from YouTube, TikTok, Instagram, and more.',
    accent: '#75d6ff',
    secondary: '#a78bfa',
    chips: ['YouTube', 'TikTok', 'Instagram'],
    layout: 'video',
  },
  '/downloader/spotify': {
    eyebrow: 'SPOTIFY DOWNLOADER',
    title: 'Music, offline.',
    description: 'Download public Spotify tracks as MP3 audio without a Premium account.',
    accent: '#25d366',
    secondary: '#72f0ba',
    chips: ['Spotify Tracks', 'MP3 Audio', 'No Premium'],
    layout: 'spotify',
  },
  '/tools/ai': {
    eyebrow: 'TOOSII AI',
    title: 'Ask anything.',
    description: 'Chat with powerful AI models including GPT-4o and Gemini.',
    accent: '#a78bfa',
    secondary: '#f0abfc',
    chips: ['GPT-4o', 'Gemini', 'Free AI Chat'],
    layout: 'ai',
  },
  '/tools': {
    eyebrow: 'FREE WEB TOOLS',
    title: 'Every tool you need.',
    description: 'Professional tools for media, AI, audio, creativity, and everyday utilities.',
    accent: '#75d6ff',
    secondary: '#72f0ba',
    chips: ['11+ Tools', 'No Sign-up', 'Always Free'],
    layout: 'tools',
  },
  '/bot': {
    eyebrow: 'TOOSII XD ULTRA',
    title: 'One bot. Zero compromises.',
    description: '150+ WhatsApp commands for AI, media, sports, groups, and utilities.',
    accent: '#25d366',
    secondary: '#72f0ba',
    chips: ['150+ Commands', 'Multi-Device', 'Open Source'],
    layout: 'bot',
  },
  '/live-tv': {
    eyebrow: 'TOOSII LIVE TV',
    title: 'Watch live. For free.',
    description: 'Thousands of free-to-air channels from 177 countries, each one checked live before it is listed.',
    accent: '#72f0ba',
    secondary: '#75d6ff',
    chips: ['8,000+ Channels', '177 Countries', 'No Sign-up'],
    layout: 'tool',
  },
  '/api': {
    eyebrow: 'TOOSII API',
    title: 'Build on a free API.',
    description: 'Media, AI, configuration and live TV endpoints — documented, and no key required.',
    accent: '#75d6ff',
    secondary: '#a78bfa',
    chips: ['REST API', 'No API Key', 'Live Examples'],
    layout: 'tool',
  },
  '/search': {
    eyebrow: 'SEARCH',
    title: 'Find it in one place.',
    description: 'Search every Toosii Tech tool, download and media source from a single box.',
    accent: '#75d6ff',
    secondary: '#72f0ba',
    chips: ['Unified Search', 'Tools + Media', 'Instant'],
    layout: 'tool',
  },
  '/library': {
    eyebrow: 'MY LIBRARY',
    title: 'Everything you saved.',
    description: 'Your downloads, saved media and history, kept in one private library.',
    accent: '#c084fc',
    secondary: '#75d6ff',
    chips: ['Saved Media', 'Downloads', 'Private'],
    layout: 'tool',
  },
  '/tools/config-inspector': {
    eyebrow: 'CONFIG INSPECTOR',
    title: 'Read any config safely.',
    description: 'Inspect OpenVPN, V2Ray, sing-box and encrypted tunnel files with every secret redacted.',
    accent: '#72f0ba',
    secondary: '#75d6ff',
    chips: ['Encrypted Formats', 'Secrets Redacted', 'Instant'],
    layout: 'tool',
  },
  '/tools/dramabox': {
    eyebrow: 'DRAMABOX',
    title: 'Short drama, full binge.',
    description: 'Stream trending short-form drama series free, with no account and no waiting.',
    accent: '#f472b6',
    secondary: '#c084fc',
    chips: ['Short Drama', 'Free Streaming', 'Trending'],
    layout: 'tool',
  },
}

function pageFor(path, searchParams = new URLSearchParams()) {
  if (path === '/tools/movies/watch') {
    const query = searchParams.get('query') || searchParams.get('q') || ''
    const title = searchParams.get('title') || (query ? `Search results for ${query}` : 'Shared movie')
    const cover = searchParams.get('cover') || ''
    const season = searchParams.get('season') || ''
    const episode = searchParams.get('episode') || ''
    if (query) {
      return { eyebrow: 'MOVIES & SERIES · SEARCH', title, description: `Browse movie and series results for ${query} on Toosii Tech.`, accent: '#a78bfa', secondary: '#75d6ff', chips: [query, 'Search Results', 'Movies + Series'], layout: 'movies-search' }
    }
    const typeLabel = searchParams.get('type') === '2' ? 'Series' : 'Movie'
    const position = typeLabel === 'Series' && season ? `S${season}${episode ? ` E${episode}` : ''}` : ''
    const hasSeason = season && new RegExp(`\\bS${season}\\b`, 'i').test(title)
    const hasEpisode = !episode || new RegExp(`\\bE${episode}\\b`, 'i').test(title)
    const displayTitle = `${title}${season && !hasSeason ? ` S${season}` : ''}${episode && !hasEpisode ? ` E${episode}` : ''}`
    return { eyebrow: 'TOOSII TECH MOVIES', title: displayTitle, description: `Watch ${displayTitle} with the Toosii Tech streaming experience.`, accent: '#a78bfa', secondary: '#75d6ff', chips: ['Watch Now', position || typeLabel, 'HD Streaming'], layout: 'movie-detail', cover }
  }
  if (path === '/downloader/video/share') {
    const title = searchParams.get('title') || 'Shared video'
    const thumb = searchParams.get('thumb') || searchParams.get('thumbnail') || ''
    const platform = searchParams.get('platform') || 'youtube'
    return { eyebrow: `${platform.toUpperCase()} · SHARED VIDEO`, title, description: `Watch and download ${title} with Toosii Tech.`, accent: '#75d6ff', secondary: '#a78bfa', chips: ['Play Video', platform, 'Download'], layout: 'video-detail', thumb, platform }
  }
  if (path === '/downloader/audio/share') {
    const title = searchParams.get('title') || 'Shared song'
    const artist = searchParams.get('artist') || ''
    const thumbnail = searchParams.get('thumbnail') || ''
    const duration = searchParams.get('duration') || ''
    const quality = searchParams.get('quality') || 'MP3'
    return { eyebrow: 'MP3 DOWNLOADER · SHARED SONG', title, description: artist ? `Listen to ${title} by ${artist} on Toosii Tech.` : `Listen to ${title} on the Toosii Tech MP3 downloader.`, accent: '#72f0ba', secondary: '#75d6ff', chips: [artist || 'Audio', quality, duration || 'Ready to play'], layout: 'audio-detail', thumbnail, artist, duration, quality }
  }
  if (path === '/live-tv/share') {
    const title = searchParams.get('title') || 'Shared live channel'
    const subtitle = searchParams.get('subtitle') || 'Live TV channel'
    const thumbnail = searchParams.get('thumbnail') || ''
    const country = searchParams.get('country') || ''
    const language = searchParams.get('language') || ''
    const category = searchParams.get('category') || ''
    return { eyebrow: 'TOOSII LIVE TV · SHARED CHANNEL', title, description: `Watch ${title}${country ? ` from ${country}` : ''} on Toosii Tech Live TV.`, accent: '#72f0ba', secondary: '#75d6ff', chips: [subtitle, country || 'Live', language || category || 'TV'], layout: 'live-tv-detail', thumbnail, subtitle, country, language, category }
  }
  if (path === '/books/share') {
    const title = searchParams.get('title') || 'Shared book'
    const author = searchParams.get('author') || ''
    const subtitle = searchParams.get('subtitle') || 'Book'
    const thumbnail = searchParams.get('thumbnail') || ''
    const year = searchParams.get('year') || ''
    return { eyebrow: 'TOOSII BOOKS · SHARED TITLE', title, description: author ? `Discover ${title} by ${author} on Toosii Tech Books.` : `Discover ${title} on Toosii Tech Books.`, accent: '#c084fc', secondary: '#75d6ff', chips: [author || subtitle, year || 'Book', 'Toosii Books'], layout: 'book-detail', thumbnail, author, subtitle, year }
  }
  if (pages[path]) return pages[path]
  if (path.startsWith('/tools/apk')) return { eyebrow: 'APK SEARCH', title: 'Find your next app.', description: 'Search and download Android APK files without the Play Store.', accent: '#72f0ba', secondary: '#75d6ff', chips: ['APK Search', 'Android Apps', 'Free Download'], layout: 'tool' }
  if (path.startsWith('/tools/firelogo')) return { eyebrow: 'FIRE LOGO MAKER', title: 'Make it burn.', description: 'Create a striking fire-style logo in seconds.', accent: '#fb923c', secondary: '#fbbf24', chips: ['Text Logos', 'Fire Effect', 'Instant Download'], layout: 'tool' }
  if (path.startsWith('/tools/story')) return { eyebrow: 'AI STORY GENERATOR', title: 'Write what comes next.', description: 'Turn any idea into a polished creative story with AI.', accent: '#c084fc', secondary: '#f0abfc', chips: ['Creative Writing', 'AI Powered', 'Instant Stories'], layout: 'tool' }
  if (path.startsWith('/tools/tempemail')) return { eyebrow: 'TEMP EMAIL', title: 'A private inbox in seconds.', description: 'Generate a disposable email address without signing up.', accent: '#f472b6', secondary: '#fb7185', chips: ['Disposable Inbox', 'No Sign-up', 'Private'], layout: 'tool' }
  if (path.startsWith('/tools/vocal-remover')) return { eyebrow: 'VOCAL REMOVER', title: 'Find the music inside.', description: 'Separate vocals and instrumentals from any song.', accent: '#22d3ee', secondary: '#75d6ff', chips: ['Vocal Removal', 'Instrumentals', 'Studio Quality'], layout: 'tool' }
  if (path.startsWith('/tools/spotify')) return { eyebrow: 'SPOTIFY TOOL', title: 'Listen your way.', description: 'Download public Spotify audio quickly and simply.', accent: '#25d366', secondary: '#72f0ba', chips: ['Spotify', 'Audio', 'Free'], layout: 'tool' }
  if (path.startsWith('/session')) return { eyebrow: 'SESSION GENERATOR', title: 'Connect in seconds.', description: 'Generate a WhatsApp session ID with a simple pair code.', accent: '#25d366', secondary: '#75d6ff', chips: ['Pair Code', 'WhatsApp', 'No Terminal'], layout: 'tool' }
  if (path.startsWith('/about')) return { eyebrow: 'ABOUT TOOSII TECH', title: 'Built from scratch.', description: 'A self-taught developer platform from Kenya.', accent: '#72f0ba', secondary: '#75d6ff', chips: ['Kenya', 'Developer', 'Builder'], layout: 'tool' }
  if (path.startsWith('/projects')) return { eyebrow: 'PORTFOLIO', title: 'Things actually built.', description: 'Real projects, real users, and tools that keep working.', accent: '#75d6ff', secondary: '#a78bfa', chips: ['Projects', 'Tools', 'Open Source'], layout: 'tool' }
  if (path.startsWith('/contact')) return { eyebrow: 'CONTACT', title: 'Let’s build together.', description: 'Reach Toosii Tech for collaborations, projects, and support.', accent: '#72f0ba', secondary: '#75d6ff', chips: ['Collaborate', 'Support', 'Kenya'], layout: 'tool' }
  if (path.startsWith('/team')) return { eyebrow: 'THE TEAM', title: 'Built by real people.', description: 'A small team building useful tools for real users.', accent: '#25d366', secondary: '#75d6ff', chips: ['Team', 'Engineering', 'Kenya'], layout: 'tool' }
  if (path.startsWith('/privacy-policy')) return { eyebrow: 'PRIVACY POLICY', title: 'What we collect, plainly.', description: 'How Toosii Tech handles data, analytics, and the information you submit.', accent: '#75d6ff', secondary: '#72f0ba', chips: ['Privacy', 'Data Handling', 'Transparency'], layout: 'tool' }
  if (path.startsWith('/terms')) return { eyebrow: 'TERMS OF USE', title: 'The ground rules.', description: 'How to use Toosii Tech tools, APIs, and media features responsibly.', accent: '#75d6ff', secondary: '#a78bfa', chips: ['Terms', 'Fair Use', 'API Limits'], layout: 'tool' }
  if (path.startsWith('/copyright')) return { eyebrow: 'COPYRIGHT & TAKEDOWN', title: 'Rights, respected.', description: 'How to report infringing material and how Toosii Tech responds.', accent: '#fbbf24', secondary: '#75d6ff', chips: ['Copyright', 'Takedown', 'Contact'], layout: 'tool' }
  if (path.startsWith('/blog')) return { eyebrow: 'TOOSII TECH BLOG', title: 'Ideas worth shipping.', description: 'Developer insights, bot tutorials, AI thoughts, and real lessons.', accent: '#fbbf24', secondary: '#75d6ff', chips: ['Development', 'AI', 'Tutorials'], layout: 'tool' }
  return { eyebrow: 'TOOSII TECH', title: 'Free tools that work.', description: 'A professional developer platform from Kenya.', accent: '#72f0ba', secondary: '#75d6ff', chips: ['Free Tools', 'No Sign-up', 'Toosii Tech'], layout: 'tool' }
}

function MiniVisual({ page }) {
      if (page.layout === 'movie-detail') {

    return (
      <div style={{ display: 'flex', gap: 18, width: '100%', height: 150 }}>
        {page.cover ? <img src={page.cover} alt="" style={{ display: 'flex', width: 104, height: 150, objectFit: 'cover', borderRadius: 10 }} /> : <div style={{ display: 'flex', width: 104, height: 150, borderRadius: 10, background: 'linear-gradient(145deg,#4c1d95,#111827)', alignItems: 'center', justifyContent: 'center', color: '#c4b5fd', fontSize: 14, fontWeight: 800 }}>MOVIE</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}><div style={{ display: 'flex', color: '#c4b5fd', fontSize: 15, fontWeight: 800 }}>Movie / Series</div><div style={{ display: 'flex', color: '#e2e8f0', fontSize: 19, fontWeight: 800 }}>{page.title}</div><div style={{ display: 'flex', color: '#a78bfa', fontSize: 14 }}>▶ Watch Now · HD Streaming</div></div>
      </div>
    )
  }
  if (page.layout === 'movies-search') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}><div style={{ display: 'flex', padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(167,139,250,.35)', color: '#cbd5e1', fontSize: 17 }}>Search movies, series…<span style={{ marginLeft: 'auto', display: 'flex', background: '#a78bfa', color: '#171329', padding: '9px 16px', borderRadius: 8, fontWeight: 800 }}>Search</span></div><div style={{ display: 'flex', gap: 12 }}><div style={{ display: 'flex', flex: 1, height: 92, borderRadius: 12, background: 'linear-gradient(145deg,#4c1d95,#111827)', border: '1px solid rgba(255,255,255,.14)', alignItems: 'flex-end', padding: 12, color: '#ede9fe', fontSize: 14, fontWeight: 800 }}>{page.title}</div><div style={{ display: 'flex', flex: 1, height: 92, borderRadius: 12, background: 'linear-gradient(145deg,#1e3a8a,#111827)', border: '1px solid rgba(255,255,255,.14)', alignItems: 'flex-end', padding: 12, color: '#dbeafe', fontSize: 14, fontWeight: 800 }}>Movie Results</div><div style={{ display: 'flex', flex: 1, height: 92, borderRadius: 12, background: 'linear-gradient(145deg,#14532d,#111827)', border: '1px solid rgba(255,255,255,.14)', alignItems: 'flex-end', padding: 12, color: '#dcfce7', fontSize: 14, fontWeight: 800 }}>Series Results</div></div></div>
    )
  }
  if (page.layout === 'video-detail') {
    return (
      <div style={{ display: 'flex', gap: 18, width: '100%', height: 150 }}>
        {page.thumb ? <img src={page.thumb} alt="" style={{ display: 'flex', width: 215, height: 150, objectFit: 'cover', borderRadius: 10 }} /> : <div style={{ display: 'flex', width: 215, height: 150, borderRadius: 10, background: 'linear-gradient(145deg,#0e7490,#111827)', alignItems: 'center', justifyContent: 'center', color: '#bae6fd', fontSize: 18, fontWeight: 800 }}>VIDEO</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}><div style={{ display: 'flex', color: '#bae6fd', fontSize: 15, fontWeight: 800 }}>{page.platform.toUpperCase()} VIDEO</div><div style={{ display: 'flex', color: '#e2e8f0', fontSize: 19, fontWeight: 800 }}>{page.title}</div><div style={{ display: 'flex', color: '#75d6ff', fontSize: 14 }}>▶ Play Video · Download</div></div>
      </div>
    )
  }
  if (page.layout === 'movies') {
    return (
      <div style={{ display: 'flex', gap: 14, width: '100%', height: 140 }}>
        {['#4c1d95', '#1e3a8a', '#7c2d12', '#14532d'].map((color, index) => (
          <div key={color} style={{ flex: 1, borderRadius: 12, background: `linear-gradient(145deg, ${color}, #0f172a)`, border: '1px solid rgba(255,255,255,.14)', display: 'flex', alignItems: 'flex-end', padding: 14, color: 'rgba(255,255,255,.8)', fontSize: 13, fontWeight: 700 }}>0{index + 1}</div>
        ))}
      </div>
    )
  }
  if (page.layout === 'audio-detail') {
    return (
      <div style={{ display: 'flex', gap: 18, width: '100%', height: 150 }}>
        {page.thumbnail ? <img src={page.thumbnail} alt="" style={{ display: 'flex', width: 150, height: 150, objectFit: 'cover', borderRadius: 12 }} /> : <div style={{ display: 'flex', width: 150, height: 150, borderRadius: 12, background: 'linear-gradient(145deg,#065f46,#111827)', alignItems: 'center', justifyContent: 'center', color: '#a7f3d0', fontSize: 16, fontWeight: 800 }}>MP3</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}><div style={{ display: 'flex', color: '#a7f3d0', fontSize: 15, fontWeight: 800 }}>{page.artist || 'Toosii Audio'}</div><div style={{ display: 'flex', color: '#e2e8f0', fontSize: 22, fontWeight: 800 }}>{page.title}</div><div style={{ display: 'flex', color: '#75d6ff', fontSize: 14 }}>{page.quality} · {page.duration || 'MP3 audio'} · Download ready</div></div>
      </div>
    )
  }
  if (page.layout === 'live-tv-detail') {
    return (
      <div style={{ display: 'flex', gap: 18, width: '100%', height: 150 }}>
        {page.thumbnail ? <img src={page.thumbnail} alt="" style={{ display: 'flex', width: 220, height: 150, objectFit: 'cover', borderRadius: 12 }} /> : <div style={{ display: 'flex', width: 220, height: 150, borderRadius: 12, background: 'linear-gradient(145deg,#065f46,#111827)', alignItems: 'center', justifyContent: 'center', color: '#a7f3d0', fontSize: 18, fontWeight: 800 }}>LIVE TV</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}><div style={{ display: 'flex', color: '#a7f3d0', fontSize: 15, fontWeight: 800 }}>● LIVE CHANNEL</div><div style={{ display: 'flex', color: '#e2e8f0', fontSize: 22, fontWeight: 800 }}>{page.title}</div><div style={{ display: 'flex', color: '#75d6ff', fontSize: 14 }}>{page.subtitle} · {page.country || page.language || page.category || 'Streaming'}</div></div>
      </div>
    )
  }
  if (page.layout === 'book-detail') {
    return (
      <div style={{ display: 'flex', gap: 18, width: '100%', height: 150 }}>
        {page.thumbnail ? <img src={page.thumbnail} alt="" style={{ display: 'flex', width: 108, height: 150, objectFit: 'cover', borderRadius: 10 }} /> : <div style={{ display: 'flex', width: 108, height: 150, borderRadius: 10, background: 'linear-gradient(145deg,#4c1d95,#111827)', alignItems: 'center', justifyContent: 'center', color: '#e9d5ff', fontSize: 16, fontWeight: 800 }}>BOOK</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}><div style={{ display: 'flex', color: '#e9d5ff', fontSize: 15, fontWeight: 800 }}>{page.author || 'Toosii Books'}</div><div style={{ display: 'flex', color: '#e2e8f0', fontSize: 22, fontWeight: 800 }}>{page.title}</div><div style={{ display: 'flex', color: '#75d6ff', fontSize: 14 }}>{page.subtitle} · {page.year || 'Shared title'}</div></div>
      </div>
    )
  }
  if (page.layout === 'audio') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#94a3b8', fontSize: 16 }}><span style={{ display: 'flex' }}>Paste YouTube URL here…</span><span style={{ marginLeft: 'auto', background: page.accent, color: '#07070e', borderRadius: 10, padding: '10px 18px', fontWeight: 800, display: 'flex' }}>Get MP3</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 13 }}><span>Alan Walker - Faded</span><span style={{ color: page.accent }}>64kbps MP3 · Ready</span></div>
        <div style={{ display: 'flex', height: 8, borderRadius: 999, background: 'rgba(255,255,255,.1)' }}><div style={{ display: 'flex', width: '76%', height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${page.accent}, ${page.secondary})` }} /></div>
      </div>
    )
  }
  if (page.layout === 'bot') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, width: '100%' }}>{['AI & Intelligence', 'Music & Audio', 'Video Downloads', 'Group Tools', 'Anti-Delete', 'Utilities'].map(item => <div key={item} style={{ flex: '1 1 30%', padding: 16, borderRadius: 12, border: '1px solid rgba(37,211,102,.25)', background: 'rgba(37,211,102,.08)', color: '#dcfce7', fontSize: 14, fontWeight: 700 }}>{item}</div>)}</div>
    )
  }
  if (page.layout === 'ai') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}><div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '14px 14px 14px 4px', background: 'rgba(167,139,250,.16)', color: '#ede9fe', fontSize: 15 }}>Hello — I’m Toosii AI. How can I help?</div><div style={{ alignSelf: 'flex-end', padding: '12px 16px', borderRadius: '14px 14px 4px 14px', background: 'rgba(255,255,255,.08)', color: '#e2e8f0', fontSize: 15 }}>Explain this idea simply.</div></div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 12, width: '100%' }}>{page.chips.map((chip, index) => <div key={chip} style={{ flex: 1, minHeight: 92, borderRadius: 14, background: `linear-gradient(145deg, ${page.accent}1f, rgba(255,255,255,.04))`, border: `1px solid ${page.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>{chip}</div>)}</div>
  )
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || '/'
  const page = pageFor(path, searchParams)

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '54px 64px', background: '#090b0f', color: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ position: 'absolute', top: -180, right: -100, width: 650, height: 450, borderRadius: 999, background: `${page.accent}22`, filter: 'blur(8px)' }} />
        <div style={{ position: 'absolute', bottom: -220, left: -140, width: 600, height: 430, borderRadius: 999, background: `${page.secondary}18`, filter: 'blur(8px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: page.accent, fontSize: 20, fontWeight: 800, letterSpacing: 1.5 }}><span style={{ width: 14, height: 14, borderRadius: 999, background: page.accent }} /> TOOSII TECH</div>
          <div style={{ color: '#64748b', fontSize: 18 }}>toosiitech.org</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 42, zIndex: 1 }}>
          <div style={{ color: page.accent, fontSize: 18, fontWeight: 800, letterSpacing: 2 }}>{page.eyebrow}</div>
          <div style={{ marginTop: 12, fontSize: 54, lineHeight: 1.05, fontWeight: 900, letterSpacing: -2 }}>{page.title}</div>
          <div style={{ marginTop: 16, maxWidth: 760, color: '#94a3b8', fontSize: 22, lineHeight: 1.35 }}>{page.description}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 34, padding: 22, borderRadius: 20, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.1)', zIndex: 1 }}><MiniVisual page={page} /></div>
        <div style={{ display: 'flex', gap: 12, marginTop: 'auto', zIndex: 1 }}>{page.chips.map(chip => <div key={chip} style={{ borderRadius: 999, padding: '9px 16px', color: page.accent, background: `${page.accent}1c`, border: `1px solid ${page.accent}44`, fontSize: 15, fontWeight: 700 }}>{chip}</div>)}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
