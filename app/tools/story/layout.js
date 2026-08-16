import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'AI Story Generator — Free Creative Writing Tool | Toosii Tech',
  description: 'Generate creative stories, adventures, poems, and narratives with AI — completely free. Give a prompt and get a unique story instantly.',
  keywords: 'AI story generator, creative writing AI, free story writer, AI fiction generator, story prompt generator, Toosii Tech',
  path: '/tools/story',
})

export default function StoryLayout({ children }) {
  return children
}
