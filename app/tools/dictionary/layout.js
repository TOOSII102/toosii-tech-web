import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Free Online Dictionary — Word Definitions | Toosii Tech',
  description: 'Look up any word — definitions, pronunciation audio, synonyms and antonyms. Free online dictionary by Toosii Tech.',
  keywords: 'dictionary, word definition, pronunciation, synonyms, antonyms, english dictionary online free, Toosii Tech',
  path: '/tools/dictionary',
})

export default function DictionaryLayout({ children }) {
  return children
}
