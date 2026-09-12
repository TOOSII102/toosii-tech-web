import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'KCSE Results Checker — KNEC Grades Online | Toosii Tech',
  description: 'Check your KCSE results free with your index number and name — grade, mean score and subjects, instantly. Free KNEC results checker by Toosii Tech.',
  keywords: 'kcse results, kcse results check, knec results, kcse grade, kcse mean score, check kcse results online free, Kenya, Toosii Tech',
  path: '/tools/kcse',
})

export default function KcseLayout({ children }) {
  return children
}
