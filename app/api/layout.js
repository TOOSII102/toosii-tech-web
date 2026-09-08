import { createShareMetadata } from '../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Toosii API — Free Public Developer API | Toosii Tech',
  description: 'A free, key-free REST API for media downloads, AI tools, configuration inspection, live TV listings and utilities. Documented endpoints with live examples you can call straight from the browser.',
  keywords: ['free API', 'public REST API', 'developer API', 'media download API', 'AI API', 'no API key', 'Toosii API'],
  path: '/api',
  type: 'website',
  // Preview art is resolved from `path` in app/api/og/route.js.
})

export default function ApiLayout({ children }) {
  return children
}
