const PRIMARY_SITE = 'https://toosiitech.org'
const SITE_NAME = 'Toosii Tech'
const PREVIEW_IMAGE = '/logo.png'
const OG_IMAGE_ROUTE = '/api/og'

export function createShareMetadata({ title, description, keywords = '', path = '/', canonicalPath = path, type = 'website', previewParams = {} }) {
  const canonicalUrl = `${PRIMARY_SITE}${canonicalPath === '/' ? '' : canonicalPath}`
  const ogParams = new URLSearchParams({ path, ...previewParams })
  const previewImage = `${OG_IMAGE_ROUTE}?${ogParams.toString()}`
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
          url: previewImage,
          width: 1200,
          height: 630,
          alt: `${title} — ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [previewImage],
    },
    icons: { icon: PREVIEW_IMAGE },
  }
}

export { PRIMARY_SITE, SITE_NAME, PREVIEW_IMAGE }
