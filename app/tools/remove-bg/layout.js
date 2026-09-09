import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Background Remover — Free Transparent PNG Maker | Toosii Tech',
  description: 'Remove the background from any photo in seconds — upload, get a clean transparent PNG. Perfect for profile pictures, products and thumbnails. Free, no sign-up.',
  keywords: 'background remover free, remove bg, transparent png maker, photo cutout, profile picture maker, Toosii Tech',
  path: '/tools/remove-bg',
})

export default function RemoveBgLayout({ children }) {
  return children
}
