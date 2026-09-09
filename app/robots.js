export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/books/share',
        '/live-tv/share',
        '/downloader/audio/share',
        '/downloader/video/share',
        '/tools/movies/watch',
        // Legacy duplicate of /downloader/spotify, kept out of indexes.
        '/tools/spotify',
      ],
    },
    sitemap: 'https://www.toosiitech.org/sitemap.xml',
  }
}
