import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Toosii AI — Free AI Chat | Toosii Tech',
  description: 'Chat with powerful AI models including GPT-4o and Gemini — completely free, no account needed. Ask anything, generate content, and get answers instantly.',
  keywords: 'free AI chat, GPT-4o free, Gemini AI free, AI chatbot Kenya, free artificial intelligence tool, Toosii AI',
  path: '/tools/ai',
})

export default function AILayout({ children }) {
  return children
}
