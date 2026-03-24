'use client'
import Layout from '../../components/Layout'
import { useState } from 'react'
import './blog.css'

const blogPosts = [
  {
    id: 1,
    title: "How I Built a Multi-Device WhatsApp Bot with 150+ Commands",
    category: "WhatsApp Bots",
    author: "Toosii Tech",
    date: "March 15, 2026",
    readTime: "8 min read",
    excerpt: "A deep dive into building TOOSII XD ULTRA — from basic command handlers to AI integration, anti-delete, and media downloading across 20+ platforms.",
    featured: true,
    content: `
      <h2>The Beginning</h2>
      <p>In 2022 I discovered whatsapp-web.js and built my first bot in a weekend. It could only respond to .ping with "pong". Two years later, TOOSII XD ULTRA has 150+ commands spanning AI, media, sports, group management, and developer tools. Here's how I got there.</p>
      
      <h3>Choosing the Right Library</h3>
      <p>whatsapp-web.js worked but had major limitations — it required a persistent browser session and broke with every WhatsApp update. When gifted-baileys (a fork of Baileys) gained traction, I migrated fully to multi-device.</p>
      <p>The key advantages of gifted-baileys:</p>
      <ul>
        <li>Native multi-device support — no browser required</li>
        <li>Much lighter memory footprint</li>
        <li>Faster message processing</li>
        <li>Better session persistence</li>
      </ul>
      
      <h3>Architecture Decisions</h3>
      <p>The bot is structured around a plugin system. Each command category lives in its own file inside the <code>plugin/</code> directory. The main <code>index.js</code> handles connection management, event routing, and global state.</p>
      <p>For AI commands, I integrated GPT-4o, Gemini, and image generation through the GiftedTech API — this lets me offer multiple AI models without managing API keys for each user.</p>
      
      <h3>The Hardest Problems</h3>
      <p><strong>Anti-Delete:</strong> Storing deleted messages requires careful memory management. My solution caches messages for 20 minutes in /tmp/ and runs a TTL sweep on every upsert cycle to prevent disk bloat.</p>
      <p><strong>Media Downloads:</strong> APIs go down constantly. I built multi-fallback chains — if GiftedTech's ytv endpoint fails, it falls back to cobalt.tools, then InnerTube ANDROID. Redundancy is everything.</p>
      <p><strong>Session Management:</strong> Generating sessions for users required building the session generator web app — which is exactly what this website offers at /session.</p>
      
      <h3>What I Learned</h3>
      <p>Building a bot used by thousands taught me more than any tutorial. Error handling, rate limiting, API reliability, disk space management — these are real production problems that tutorials skip. Every bug report from a user made the bot better.</p>
    `
  },
  {
    id: 2,
    title: "AI is Changing How Kenya Uses the Internet — Here's What I See",
    category: "Artificial Intelligence",
    author: "Toosii Tech",
    date: "February 28, 2026",
    readTime: "6 min read",
    excerpt: "From mobile money to WhatsApp-first businesses, Kenya's digital landscape is uniquely positioned for AI. Here's what a developer building for that market sees every day.",
    featured: false,
    content: `
      <h2>Kenya's Unique Digital Landscape</h2>
      <p>Kenya is a mobile-first country. Most people's first computer was a smartphone. Most businesses run on WhatsApp groups. M-Pesa processes more money than many banks. This creates a completely different set of problems — and opportunities — than the US or Europe.</p>
      
      <h3>WhatsApp as the Operating System</h3>
      <p>When I added AI commands to TOOSII XD ULTRA, the response was overwhelming. People use .gpt4o to write job applications, translate documents, debug code, and understand contracts — all from WhatsApp. For many users, this was their first time using an AI tool.</p>
      
      <h3>The Language Gap</h3>
      <p>English AI works well but Swahili support is inconsistent. I've added .translate as a first-class command because many group chats mix English and Swahili constantly. This is an underserved area that big AI companies still haven't fully solved for East Africa.</p>
      
      <h3>Infrastructure Realities</h3>
      <ul>
        <li>Spotty connectivity means bots need to handle reconnections gracefully</li>
        <li>Low-end Android devices dominate — WhatsApp Web isn't practical for most users</li>
        <li>Data costs mean users prefer compressed media over HD</li>
        <li>M-Pesa integration is often more important than credit card support</li>
      </ul>
      
      <h3>What This Means for Developers</h3>
      <p>Build for the actual user, not the imagined one. A feature that works perfectly on fiber internet in Nairobi CBD might break in Kisumu on 3G. Test on old Android devices. Keep responses short. Make every KB count.</p>
    `
  },
  {
    id: 3,
    title: "Self-Taught to Production: What No One Tells You",
    category: "Developer Life",
    author: "Toosii Tech",
    date: "February 10, 2026",
    readTime: "5 min read",
    excerpt: "Things I wish someone had told me when I was learning to code from YouTube videos in Nairobi. The real lessons that only come from shipping actual software.",
    featured: false,
    content: `
      <h2>It's Not About the Language</h2>
      <p>I started with JavaScript because it was everywhere. I could have started with Python. The language matters far less than understanding how computers think — loops, conditionals, functions, data structures. Pick one and go deep.</p>
      
      <h3>Documentation is Your Best Friend</h3>
      <p>YouTube is great for getting started. But the real skill is reading official documentation. The gifted-baileys README, Next.js docs, MDN Web Docs — these taught me more than any video course because they show you the actual capabilities, not a curated subset.</p>
      
      <h3>Ship Something Broken</h3>
      <p>My first bot was terrible. It crashed constantly. Commands returned wrong results. I was embarrassed to share it. But the users who found it gave feedback that made it 10x better in a month. Waiting until it's perfect means waiting forever.</p>
      
      <h3>The Real Curriculum</h3>
      <ul>
        <li>Learn to read error messages — they tell you exactly what's wrong</li>
        <li>Understand async/await deeply — most bugs in Node.js are async bugs</li>
        <li>Learn git early — losing work to no version control is painful</li>
        <li>Build things you actually use — motivation is everything</li>
        <li>Find a community — even one person to learn with helps enormously</li>
      </ul>
      
      <h3>What Still Trips Me Up</h3>
      <p>TypeScript type errors. CORS. Anything involving OAuth. These are humbling reminders that there's always more to learn. The best developers I've met online are the ones who say "I don't know" most comfortably.</p>
    `
  },
  {
    id: 4,
    title: "Building Download Tools That Actually Work",
    category: "Web Development",
    author: "Toosii Tech",
    date: "January 22, 2026",
    readTime: "7 min read",
    excerpt: "YouTube downloaders break constantly. Here's how I built multi-fallback download chains for video and audio that survive API outages, format changes, and rate limits.",
    featured: false,
    content: `
      <h2>The Problem with Download APIs</h2>
      <p>Every YouTube downloader API goes down. SaveTube, RapidAPI video endpoints, custom scrapers — they all have the same problem: YouTube actively fights them, and they break without warning. The solution is redundancy.</p>
      
      <h3>The Fallback Chain Pattern</h3>
      <p>For video downloads, I run three methods in sequence:</p>
      <ol>
        <li><strong>GiftedTech ytv API</strong> — Fast, reliable when up, returns 720p MP4 directly</li>
        <li><strong>cobalt.tools</strong> — POST to api.cobalt.tools, handles most platforms</li>
        <li><strong>InnerTube ANDROID</strong> — YouTube's own internal API, hardest to break</li>
      </ol>
      <p>If method 1 fails, try method 2. If that fails, try method 3. Return the first successful result. This gives users a working download 99% of the time even when individual APIs are down.</p>
      
      <h3>The loader.to Pattern for Audio</h3>
      <p>loader.to works differently — you submit a job and poll for completion. The key is using format "mp3" (not "mp3-128" which is deprecated). Poll every 3 seconds with a 12-attempt limit. This gives 36 seconds — enough for most tracks.</p>
      
      <h3>Caching Considerations</h3>
      <p>Download links are usually time-limited (15-60 minutes). Never cache them server-side or redirect users to stale links. Always fetch fresh. The added latency is worth the reliability.</p>
      
      <h3>Lessons Learned</h3>
      <ul>
        <li>Never rely on a single third-party API for anything critical</li>
        <li>Log every failure — patterns emerge that tell you which API to fix first</li>
        <li>Test with different video lengths — 3-minute songs and 3-hour streams behave differently</li>
        <li>Respect rate limits — aggressive polling gets you IP-banned</li>
      </ul>
    `
  },
  {
    id: 6,
    title: "How I Built a Free Movie Streaming Platform with No CDN Budget",
    category: "Web Development",
    author: "Toosii Tech",
    date: "March 24, 2026",
    readTime: "7 min read",
    excerpt: "Toosii Movies streams full Hollywood and international films for free — multiple quality options, direct downloads, bot-protection bypass, and a Netflix-style UI. Here's exactly how I built it.",
    featured: false,
    content: `
      <h2>The Goal</h2>
      <p>I wanted to add a movie streaming feature to Toosii Tech that felt premium — full movies, multiple quality options (360p to 1080p), one-click downloads, real search, and a clean UI. No subscription, no sign-up, no ads. The XCASPER Movies API by Casper Tech Kenya made this possible.</p>

      <h3>Bypassing Bot Protection</h3>
      <p>The movies API blocks automated server-to-server requests with a 403 "Automated requests not allowed" error. The fix is to make our Next.js API route impersonate a real browser — setting <code>Origin</code> and <code>Referer</code> headers to the API's own domain, plus a realistic Chrome User-Agent string. From the API's perspective, every request looks like it's coming from their own documentation page.</p>

      <h3>Multi-Quality Streams and Direct Downloads</h3>
      <p>The <code>/api/play</code> endpoint returns a <code>streams</code> array with one entry per quality level. Each entry has both a <code>proxyUrl</code> (for streaming) and a <code>downloadUrl</code> (which triggers a real file download). I render quality tabs — 360p, 480p, 720p, 1080p — and switch the HTML5 video source when the user picks one. Downloads link directly to the API's own download endpoint, so the file goes straight to the user's device.</p>

      <h3>State, History, and the Back Button</h3>
      <p>Clicking a movie card calls <code>history.pushState</code> to inject a history entry. Closing the modal calls <code>history.back()</code>. A <code>popstate</code> listener closes the modal when the user presses the device back button. This means navigation feels completely native — no full-page reloads, no broken back-button behaviour on mobile.</p>

      <h3>Recommendations and Search</h3>
      <p>Every movie detail view fetches related titles from the <code>/api/recommend</code> endpoint in parallel with the stream and detail calls — all three fire simultaneously with <code>Promise.all</code>. Search uses a 500ms debounce on the input so it only fires when the user pauses typing, keeping API calls minimal while still feeling live.</p>

      <h3>What's Next</h3>
      <p>TV series support — the API supports series with episode lists — is the next feature on the roadmap. Subtitles are also available from the API; I plan to overlay them using a WebVTT parser directly in the browser player.</p>
    `
  },
  {
    id: 5,
    title: "Cybersecurity for Kenyan Businesses: The Basics That Matter Most",
    category: "Cybersecurity",
    author: "Toosii Tech",
    date: "January 5, 2026",
    readTime: "6 min read",
    excerpt: "Most cyber attacks on small Kenyan businesses exploit basic mistakes. Multi-factor authentication, regular backups, and software updates prevent the majority of incidents.",
    featured: false,
    content: `
      <h2>The Threat Landscape in Kenya</h2>
      <p>Kenya's rapid digital adoption has created real vulnerabilities. Mobile money fraud, phishing targeting M-Pesa users, and social engineering attacks on WhatsApp groups are increasingly common. Most attacks succeed not because of technical sophistication but because of basic oversights.</p>
      
      <h3>The Biggest Risks for Small Businesses</h3>
      <ul>
        <li><strong>WhatsApp account hijacking</strong> — SIM swaps and phishing for OTP codes</li>
        <li><strong>M-Pesa fraud</strong> — Fake payment confirmations and social engineering</li>
        <li><strong>Weak passwords</strong> — "password123" is still the most common password globally</li>
        <li><strong>No backups</strong> — Ransomware works because victims have no copies of their data</li>
      </ul>
      
      <h3>What Actually Prevents Most Attacks</h3>
      <p><strong>Enable 2FA on everything.</strong> WhatsApp, Google account, email, social media. This single step stops the majority of account takeover attempts.</p>
      <p><strong>Back up your data weekly.</strong> WhatsApp chats, business documents, contacts. Cloud backup to Google Drive is free and takes 5 minutes to set up.</p>
      <p><strong>Update your software.</strong> Old Android versions have known vulnerabilities. Carrier updates are not optional.</p>
      
      <h3>For WhatsApp Business Owners</h3>
      <p>Never share your WhatsApp OTP code with anyone — not even someone claiming to be WhatsApp support. WhatsApp never calls you. If someone gets your OTP, they own your account. Enable the two-step verification PIN immediately.</p>
    `
  },
]

const categories = ["All Topics", "WhatsApp Bots", "Artificial Intelligence", "Developer Life", "Web Development", "Cybersecurity"]

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("All Topics")
  const [selectedArticle, setSelectedArticle] = useState(null)

  const filtered = selectedCategory === "All Topics"
    ? blogPosts
    : blogPosts.filter(p => p.category === selectedCategory)

  const featured = blogPosts.find(p => p.featured)

  if (selectedArticle) {
    const article = blogPosts.find(p => p.id === selectedArticle)
    return (
      <Layout>
        <div className="article-page">
          <div className="article-back">
            <div className="page-wrapper">
              <button onClick={() => setSelectedArticle(null)} className="back-btn">← Back to Blog</button>
            </div>
          </div>
          <div className="article-inner page-wrapper">
            <div className="article-meta-top">
              <span className="article-cat">{article.category}</span>
              <span className="article-date">{article.date}</span>
              <span className="article-read">{article.readTime}</span>
            </div>
            <h1 className="article-title">{article.title}</h1>
            <div className="article-author">
              <div className="author-avatar">T</div>
              <span>{article.author}</span>
            </div>
            <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <section className="blog-hero">
        <div className="page-wrapper">
          <p className="section-label">Blog</p>
          <h1 className="section-title">Thoughts, Builds & <span className="gradient-text">Lessons</span></h1>
          <p className="section-sub">Real-world writing from a self-taught developer — covering WhatsApp bots, AI tools, the African tech scene, and everything learned by actually shipping things.</p>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="section" style={{ paddingTop: '1rem' }}>
          <div className="page-wrapper">
            <p className="section-label" style={{ marginBottom: '1rem' }}>Featured</p>
            <div className="featured-post glass-card" onClick={() => setSelectedArticle(featured.id)}>
              <div className="featured-badge">{featured.category}</div>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="post-footer">
                <div className="post-author">
                  <div className="author-avatar-sm">T</div>
                  <span>{featured.author}</span>
                  <span className="dot">·</span>
                  <span>{featured.date}</span>
                  <span className="dot">·</span>
                  <span>{featured.readTime}</span>
                </div>
                <span className="read-link">Read article →</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter + Grid */}
      <section className="section" style={{ paddingTop: '2rem' }}>
        <div className="page-wrapper">
          <div className="category-filters">
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >{cat}</button>
            ))}
          </div>

          <div className="blog-grid">
            {filtered.filter(p => !p.featured).map(post => (
              <div key={post.id} className="blog-card glass-card" onClick={() => setSelectedArticle(post.id)}>
                <span className="post-cat">{post.category}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="card-footer">
                  <div className="post-author">
                    <div className="author-avatar-sm">T</div>
                    <span>{post.date}</span>
                    <span className="dot">·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <span className="read-link">Read →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
