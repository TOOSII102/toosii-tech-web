import { createShareMetadata } from '../../lib/shareMetadata'

// Covers /admin and every nested admin route. These are private surfaces, so
// they carry explicit noindex/nofollow directives — previously they inherited
// the public site description and were eligible for search indexing.
export const metadata = createShareMetadata({
  title: 'Admin — Toosii Tech',
  description: 'Restricted administration area for Toosii Tech.',
  path: '/admin',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
})

export default function AdminLayout({ children }) {
  return children
}
