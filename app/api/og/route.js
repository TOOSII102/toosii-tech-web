import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const pages = {
  '/': {
    eyebrow: 'TOOSII TECH',
    title: 'Infinite possibilities.',
    description: 'Free tools, AI features, a WhatsApp bot suite, and HD movie streaming in one platform.',
    accent: '#72f0ba',
    secondary: '#75d6ff',
    chips: ['Free Tools', 'AI Features', 'WhatsApp Bot'],
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
}

function pageFor(path) {
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
  if (path.startsWith('/blog')) return { eyebrow: 'TOOSII TECH BLOG', title: 'Ideas worth shipping.', description: 'Developer insights, bot tutorials, AI thoughts, and real lessons.', accent: '#fbbf24', secondary: '#75d6ff', chips: ['Development', 'AI', 'Tutorials'], layout: 'tool' }
  return { eyebrow: 'TOOSII TECH', title: 'Free tools that work.', description: 'A professional developer platform from Kenya.', accent: '#72f0ba', secondary: '#75d6ff', chips: ['Free Tools', 'No Sign-up', 'Toosii Tech'], layout: 'tool' }
}

function MiniVisual({ page }) {
  if (page.layout === 'movies') {
    return (
      <div style={{ display: 'flex', gap: 14, width: '100%', height: 140 }}>
        {['#4c1d95', '#1e3a8a', '#7c2d12', '#14532d'].map((color, index) => (
          <div key={color} style={{ flex: 1, borderRadius: 12, background: `linear-gradient(145deg, ${color}, #0f172a)`, border: '1px solid rgba(255,255,255,.14)', display: 'flex', alignItems: 'flex-end', padding: 14, color: 'rgba(255,255,255,.8)', fontSize: 13, fontWeight: 700 }}>0{index + 1}</div>
        ))}
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
  const page = pageFor(path)

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '54px 64px', background: '#090b0f', color: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ position: 'absolute', top: -180, right: -100, width: 650, height: 450, borderRadius: 999, background: `${page.accent}22`, filter: 'blur(8px)' }} />
        <div style={{ position: 'absolute', bottom: -220, left: -140, width: 600, height: 430, borderRadius: 999, background: `${page.secondary}18`, filter: 'blur(8px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: page.accent, fontSize: 20, fontWeight: 800, letterSpacing: 1.5 }}><span style={{ width: 14, height: 14, borderRadius: 999, background: page.accent }} /> TOOSII TECH</div>
          <div style={{ color: '#64748b', fontSize: 18 }}>toosii.tech</div>
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
