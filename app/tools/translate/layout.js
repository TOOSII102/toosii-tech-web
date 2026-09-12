import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Free Translator — Translate Text Online | Toosii Tech',
  description: 'Translate text between 100+ languages for free — English, Swahili, French, Chinese, Arabic and more. Instant, no sign-up, by Toosii Tech.',
  keywords: 'translator, translate text free, english to swahili, swahili translator, translate online Kenya, Toosii Tech',
  path: '/tools/translate',
})

export default function TranslateLayout({ children }) {
  return children
}
