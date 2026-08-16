/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'files.catbox.moe' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'api.giftedtech.co.ke' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['gifted-baileys', 'pino'],
  },
}

module.exports = nextConfig
