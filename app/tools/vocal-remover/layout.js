import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Free Vocal Remover — Extract Vocals & Instrumentals | Toosii Tech',
  description: 'Remove vocals from any song or extract the instrumental track for free. Upload any audio file and get clean vocals or a pure instrumental in seconds.',
  keywords: 'vocal remover, remove vocals from song, extract instrumental, karaoke maker, AI vocal remover, free vocal extractor, Toosii Tech',
  path: '/tools/vocal-remover',
})

export default function VocalRemoverLayout({ children }) {
  return children
}
