import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Bible Search — Read Verses Online Free | Toosii Tech',
  description: 'Search and read Bible verses instantly — John 3:16, Psalm 23 and more, free online in World English Bible. No app, no sign-up, by Toosii Tech.',
  keywords: 'bible search, bible verses online, john 3:16, psalm 23, bible verses kenya, read bible free, Toosii Tech',
  path: '/tools/bible',
})

export default function BibleLayout({ children }) {
  return children
}
