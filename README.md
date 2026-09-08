# Toosii Tech — Official Website

> **TOOSII XD ULTRA** WhatsApp Bot website, session generator & media downloader tools  
> Built by [Toosii Tech](https://github.com/TOOSII102) — self-taught developer from Kenya 🇰🇪

---

## Pages

| Page | Description |
|------|-------------|
| `/` | Home — bot info, features, quick links |
| `/session` | Session Generator — pair code or QR code login |
| `/downloader/video` | YouTube Video Downloader (720p MP4) |
| `/downloader/audio` | YouTube MP3 Downloader |
| `/about` | About Toosii Tech — background, skills, bot story |

## Stack

- **Next.js 14** (App Router, JavaScript)
- **Plain CSS** — per-route stylesheets, dark theme, glassmorphism
- **gifted-baileys** — WhatsApp Multi-Device for session generation
- **GiftedTech API** — video/audio downloads
- **Framer Motion** — animations

## Configuration

Copy `.env.example` to `.env` and fill it in. Everything is optional **except**
the admin dashboard, which requires both:

| Variable | Notes |
|----------|-------|
| `ADMIN_PASSWORD` | The admin login password |
| `ADMIN_SECRET` | Signing key for session cookies — **must be 16+ characters** |

Generate a strong secret with:

```bash
openssl rand -hex 32
```

If either is unset, the admin area is locked and `/api/admin/login` returns
`503`. This is deliberate: there is no fallback default, because a well-known
default secret would let anyone forge an admin session.

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
