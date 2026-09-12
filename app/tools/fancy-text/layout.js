import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Fancy Text Generator — Stylized Fonts Online | Toosii Tech',
  description: 'Generate fancy stylized text — bold, cursive, gothic, circled, inverted and 30+ more fonts. Free Unicode fancy text generator by Toosii Tech.',
  keywords: 'fancy text, fancy font generator, stylized text, unicode text, aesthetic font, bold letters, Toosii Tech',
  path: '/tools/fancy-text',
})

export default function FancyTextLayout({ children }) {
  return children
}
