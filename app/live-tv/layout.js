import { createShareMetadata } from '../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Live TV — Watch 8,000+ Free Channels Online | Toosii Tech',
  description: 'Stream thousands of free-to-air TV channels from 177 countries directly in your browser. News, sports, music, kids and local channels — every stream checked live before it is listed. No sign-up, no app.',
  keywords: ['live TV', 'free IPTV', 'watch TV online', 'free live streaming', 'Kenyan TV channels', 'live news TV', 'free sports streaming', 'Toosii Tech'],
  path: '/live-tv',
  type: 'website',
  // Preview art is resolved from `path` in app/api/og/route.js.
})

export default function LiveTvLayout({ children }) {
  return children
}
