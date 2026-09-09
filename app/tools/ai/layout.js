import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Toosii AI — Free AI Chat with Vision | Toosii Tech',
  description: 'Free AI chat with selectable models — Qwen, DeepSeek V3, DeepSeek R1 and Gemini — plus image reading (upload a photo or screenshot and ask about it), codebase .zip analysis and voice input. No account, no cost.',
  keywords: 'free AI chat, Qwen free, DeepSeek free, Gemini AI free, AI that reads images, AI vision free, AI chatbot Kenya, Toosii AI',
  path: '/tools/ai',
})

export default function AILayout({ children }) {
  return children
}
