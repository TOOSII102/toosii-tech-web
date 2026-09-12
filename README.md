# Toosii Tech — Official Website

> **TOOSII XD ULTRA** WhatsApp Bot website, session generator & media downloader tools  
> Built by [Toosii Tech](https://github.com/TOOSII102) — self-taught developer from Kenya 🇰🇪

---

## Pages

| Page | Description |
|------|-------------|
| `/` | Home — bot info, features, quick links |
| `/session` | Session Generator — pair code or QR code login |
| `/tools` | Tools hub — all 23 free tools |
| `/downloader/video` | YouTube Video Downloader (720p MP4) |
| `/downloader/audio` | YouTube MP3 Downloader |
| `/tools/ai` | Toosii AI — free conversational AI chat |
| `/tools/scores` | Live football scores, standings & top scorers |
| `/tools/currency` | Currency converter with daily exchange rates (KES-centric) |
| `/tools/translate` | Translator — English ↔ Swahili + 100 languages |
| `/tools/shortener` | URL shortener (TinyURL, vgd, custom aliases) |
| `/tools/fancy-text` | Fancy Unicode text generator (30+ styles) |
| `/tools/bible` | Bible verse search |
| `/tools/kcse` | KCSE (KNEC) results checker |
| `/tools/dictionary` | Dictionary with pronunciation audio |
| `/api` | Public API docs with live request console |
| `/about` | About Toosii Tech — background, skills, bot story |

## Stack

- **Next.js 14** (App Router, JavaScript)
- **Plain CSS** — per-route stylesheets, dark theme, glassmorphism
- **gifted-baileys** — WhatsApp Multi-Device for session generation
- **GiftedTech API** — video/audio downloads
- **Partner API** — free key-less REST collection (600+ endpoints) used as the
  fallback behind the primary providers (lyrics, news, sports, AI chat, image
  generation, background removal, movies, YouTube/Spotify search, temp mail,
  APKs) and as the engine for the Everyday Essentials tools (live scores,
  currency, translator, URL shortener, fancy text, Bible, KCSE, dictionary)
- **Framer Motion** — animations

## Configuration

Copy `.env.example` to `.env` and fill it in. Everything is optional, but the
admin dashboard variables should be treated as mandatory in production:

| Variable | Notes |
|----------|-------|
| `ADMIN_PASSWORD` | The admin login password |
| `ADMIN_SECRET` | Admin session cookie value — **always set this** |

Generate a strong secret with:

```bash
openssl rand -hex 32
```

> ⚠️ **Security note.** If `ADMIN_SECRET` is not set, the code falls back to the
> hardcoded string `'toosii-admin'`. Because the session cookie is compared
> directly against that value, anyone sending `admin_token=toosii-admin` can
> reach `/admin`, `/api/admin/stats` and `/api/admin/visitors`. Setting
> `ADMIN_SECRET` to a long random value is what keeps the dashboard private.

## Deploy

### Vercel (recommended)

1. Fork this repo
2. Import to [vercel.com](https://vercel.com)
3. Set env vars (see `.env.example`)
4. Deploy ✅

### Render

1. New Web Service → connect this repo
2. Build Command: `npm run build`
3. Start Command: `npm start`
4. Set env vars → Deploy ✅

### Railway / Fly.io

Works the same as Render. Run `npm run build && npm start`.

## Local Development

```bash
git clone https://github.com/TOOSII102/toosii-tech-web
cd toosii-tech-web
npm install
cp .env.example .env
npm run dev
```

## Links

- 🤖 Bot Repo: [TOOSII-XD-ULTRA](https://github.com/TOOSII102/TOOSII-XD-ULTRA)
- 💬 WhatsApp: [+254 748 340 864](https://wa.me/254748340864)
- ✈️ Telegram: [@toosiitech](https://t.me/toosiitech)
- 🐙 GitHub: [@TOOSII102](https://github.com/TOOSII102)

---

Made with ❤️ by **Toosii Tech** — self-taught, building every day.
