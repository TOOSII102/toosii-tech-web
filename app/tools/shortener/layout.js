import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'URL Shortener — Free Link Shortener | Toosii Tech',
  description: 'Shorten long links for free with TinyURL, vgd and more — instant short links with custom aliases, no sign-up, by Toosii Tech.',
  keywords: 'url shortener, shorten link free, tinyurl, short link, link shortener Kenya, Toosii Tech',
  path: '/tools/shortener',
})

export default function ShortenerLayout({ children }) {
  return children
}
