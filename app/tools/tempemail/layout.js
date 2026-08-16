import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Free Temp Email Generator — Disposable Inbox | Toosii Tech',
  description: 'Generate a free disposable email address in one click. No sign-up needed — use it for verifications, sign-ups, or anything that needs an inbox without revealing your real email.',
  keywords: 'temp email, temporary email, disposable email, fake email generator, throwaway email, free email inbox, Toosii Tech',
  path: '/tools/tempemail',
})

export default function TempEmailLayout({ children }) {
  return children
}
