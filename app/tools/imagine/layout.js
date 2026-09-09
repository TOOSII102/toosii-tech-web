import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'AI Image Generator — Free Text-to-Image | Toosii Tech',
  description: 'Describe anything and get a stunning AI-generated image in seconds — up to 4K, no sign-up, no watermark. Free AI image generation by Toosii Tech.',
  keywords: 'AI image generator, text to image free, AI art generator, free AI pictures, image creator Kenya, Toosii Tech',
  path: '/tools/imagine',
})

export default function ImagineLayout({ children }) {
  return children
}
