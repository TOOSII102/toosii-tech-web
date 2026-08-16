const PRIMARY_SITE = 'https://toosiitech.org'
const SITE_NAME = 'Toosii Tech'
const PREVIEW_IMAGE = '/logo.png'

export function createShareMetadata({ title, description, keywords = '', path = '/', type = 'website' }) {
  const canonicalUrl = `${PRIMARY_SITE}${path === '/' ? '' : path}`
  return {
    metadataBase: new URL(PRIMARY_SITE),
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type,
      images: [
        {
          url: PREVIEW_IMAGE,
          width: 1024,
          height: 944,
          alt: `${title} — ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [PREVIEW_IMAGE],
    },
    icons: { icon: PREVIEW_IMAGE },
  }
}

export { PRIMARY_SITE, SITE_NAME, PREVIEW_IMAGE }
