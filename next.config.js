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
  async redirects() {
    return [
      // Legacy duplicate page — the downloader page is the canonical one.
      { source: '/tools/spotify', destination: '/downloader/spotify', permanent: true },
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ['gifted-baileys', 'pino'],
    outputFileTracingIncludes: {
      '/api/tools/vocal-remover': ['./node_modules/ffmpeg-static/ffmpeg'],
    },
  },
}

module.exports = nextConfig
