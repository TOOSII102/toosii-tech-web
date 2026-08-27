/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'files.catbox.moe' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'api.giftedtech.co.ke' },
      { protocol: 'https', hostname: 'img.movieapi.xcasper.space' },
      { protocol: 'https', hostname: 'movieapi.xcasper.space' },
    ],
  },
  serverExternalPackages: ['gifted-baileys', 'pino'],
  outputFileTracingIncludes: {
    '/api/tools/vocal-remover': ['./node_modules/ffmpeg-static/ffmpeg'],
  },
}

module.exports = nextConfig
