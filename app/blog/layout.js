import { createShareMetadata } from '../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Blog — Toosii Tech',
  description: 'Developer insights, WhatsApp bot tutorials, AI thoughts, and real-world tech lessons from Toosii Tech — a self-taught software developer from Kenya.',
  keywords: 'developer blog, WhatsApp bot tutorial, self-taught developer, Kenya tech, coding tips, Node.js, Next.js, Toosii Tech blog',
  path: '/blog',
})

export default function BlogLayout({ children }) {
  return children
}
