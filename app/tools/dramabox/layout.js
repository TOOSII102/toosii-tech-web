import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'DramaBox Streaming — Short Dramas | Toosii Tech',
  description: 'Search and explore trending short-form DramaBox stories through Toosii Tech.',
  keywords: 'DramaBox streaming, short dramas, Toosii Tech',
  path: '/tools/dramabox',
  type: 'website',
  previewParams: { path: '/tools/dramabox' },
})

export default function DramaBoxLayout({ children }) {
  return children
}
