import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Toosii Tech',
  description: 'Learn about Toosii Tech — a self-taught developer from Kenya building WhatsApp bots and web tools.',
}

const skills = [
  { label: 'JavaScript / Node.js', level: 90 },
  { label: 'WhatsApp (Baileys) Bots', level: 95 },
  { label: 'React / Next.js', level: 78 },
  { label: 'REST APIs & Integration', level: 85 },
  { label: 'Bot Automation', level: 92 },
  { label: 'Open Source Development', level: 88 },
]

const timeline = [
  { year: '2021', event: 'Started self-teaching programming through YouTube and online docs' },
  { year: '2022', event: 'Built first WhatsApp bots using whatsapp-web.js' },
  { year: '2023', event: 'Migrated to Baileys (Multi-Device) and released TOOSII XD ULTRA v1' },
  { year: '2024', event: 'Added 100+ commands, AI integrations, football stats and media tools' },
  { year: '2025', event: 'Launched session generator web, upgraded to gifted-baileys' },
  { year: '2026', event: 'TOOSII XD ULTRA v2 — rebuilt session system, video/MP3 downloaders, and this site' },
]

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10">
      <div className="blob w-[400px] h-[400px] bg-[rgba(37,211,102,0.05)] top-0 right-0" />

      <div className="grid lg:grid-cols-5 gap-10 mb-16">
        <div className="lg:col-span-2">
          <div className="glass-card p-6 text-center sticky top-24">
            <div className="relative inline-block mb-4">
              <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-[rgba(37,211,102,0.4)] shadow-xl shadow-[rgba(37,211,102,0.15)] mx-auto">
                <img src="https://files.catbox.moe/qbcebp.jpg" alt="Toosii Tech" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#25d366] border-2 border-[#0f0f1a]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Toosii Tech</h2>
            <p className="text-xs text-[#25d366] font-semibold mb-3">Self-Taught Developer</p>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">Kenya 🇰🇪 — Building WhatsApp bots and web tools from scratch, learning every day.</p>
            <div className="space-y-2 text-left">
              {[
                { icon: 'fab fa-github', label: 'GitHub', href: 'https://github.com/TOOSII102', val: '@TOOSII102' },
                { icon: 'fab fa-whatsapp', label: 'WhatsApp', href: 'https://wa.me/254748340864', val: '+254 748 340 864' },
                { icon: 'fab fa-telegram', label: 'Telegram', href: 'https://t.me/toosiitech', val: '@toosiitech' },
              ].map(c => (
                <a key={c.href} href={c.href} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(37,211,102,0.08)] hover:border-[rgba(37,211,102,0.2)] border border-[rgba(255,255,255,0.06)] transition-all group">
                  <i className={`${c.icon} text-[#25d366] text-sm w-4`} />
                  <div>
                    <div className="text-[10px] text-gray-600">{c.label}</div>
                    <div className="text-xs text-gray-300 group-hover:text-white transition-colors">{c.val}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 stat-badge mb-4">
              <i className="fas fa-user text-xs" /> About Me
            </div>
            <h1 className="text-3xl font-extrabold mb-4">
              Hey, I&apos;m <span className="gradient-text">Toosii Tech</span>
            </h1>
            <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
              <p>
                I&apos;m a <strong className="text-white">self-taught developer</strong> from Kenya who got into coding by curiosity — and never stopped. I started by reading documentation, watching tutorials, and breaking things until they worked.
              </p>
              <p>
                My main project is <strong className="text-[#25d366]">TOOSII XD ULTRA</strong> — a feature-packed WhatsApp Multi-Device bot built on <strong className="text-white">gifted-baileys</strong>. It started as a personal experiment and grew into a 150+ command bot used by hundreds of people.
              </p>
              <p>
                I believe in learning by doing. Every bug I fixed, every API I integrated, and every feature I shipped made me a better developer. I build tools that I actually use and share them openly.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-4">Skills & Stack</h2>
            <div className="space-y-3">
              {skills.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-300 font-medium">{s.label}</span>
                    <span className="text-[#25d366] font-semibold">{s.level}%</span>
                  </div>
                  <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${s.level}%`, background:'linear-gradient(90deg, #25d366, #128c7e)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-4">Journey</h2>
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-[rgba(37,211,102,0.2)]" />
              <div className="space-y-5 pl-10">
                {timeline.map((t, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-[#25d366] border-2 border-[#07070e] shadow-[0_0_6px_rgba(37,211,102,0.5)]" />
                    <span className="text-[10px] font-bold text-[#25d366] block mb-0.5">{t.year}</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{t.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="divider mb-12" />

      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold mb-2">TOOSII XD ULTRA Bot</h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">Everything about the bot — what it does, how to set it up, and what makes it different.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: 'fas fa-robot', color: '#25d366', title: 'AI Powered', desc: 'GPT-4o, Gemini, Llama3, and more AI models with custom personas and system prompts.' },
            { icon: 'fas fa-futbol', color: '#3b82f6', title: 'Live Sports', desc: 'EPL, La Liga, Serie A standings, fixtures, top scorers and live match results.' },
            { icon: 'fas fa-download', color: '#a855f7', title: 'Media Downloads', desc: 'YouTube MP3/MP4, TikTok, Instagram, Facebook, Spotify — all from a WhatsApp message.' },
            { icon: 'fas fa-shield-alt', color: '#f59e0b', title: 'Group Security', desc: 'Antidelete, antilink, anti-spam, admin alerts and full group management tools.' },
            { icon: 'fas fa-globe', color: '#ec4899', title: 'World Tools', desc: 'Timezone converter, Wikipedia search, weather, currency exchange and more.' },
            { icon: 'fas fa-code', color: '#10b981', title: 'Open Source', desc: 'Fully open-source on GitHub. Fork it, deploy it, customize it to your needs.' },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background:`${f.color}18`, border:`1px solid ${f.color}30` }}>
                <i className={`${f.icon}`} style={{ color: f.color, fontSize:'1rem' }} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-8 text-center border-[rgba(37,211,102,0.15)]">
        <h2 className="text-xl font-bold mb-2">Want to try the bot?</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">Get your session ID, fork the repo, and deploy TOOSII XD ULTRA on your number today.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/session" className="btn-primary px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
            <i className="fas fa-key text-xs" /> Get Session ID
          </Link>
          <a href="https://github.com/TOOSII102/TOOSII-XD-ULTRA" target="_blank" rel="noreferrer"
            className="btn-ghost px-6 py-3 rounded-2xl text-sm flex items-center gap-2">
            <i className="fab fa-github text-xs" /> Fork on GitHub
          </a>
          <a href="https://wa.me/254748340864" target="_blank" rel="noreferrer"
            className="btn-ghost px-6 py-3 rounded-2xl text-sm flex items-center gap-2 border-[rgba(37,211,102,0.2)]">
            <i className="fab fa-whatsapp text-[#25d366] text-xs" /> Contact Dev
          </a>
        </div>
      </div>
    </div>
  )
}
