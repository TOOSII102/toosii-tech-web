// Must be the host that serves content directly, with no redirect.
//
// This was 'https://toosiitech.org', but the apex domain 308-redirects to www.
// Social crawlers — WhatsApp in particular — do not follow redirects when
// fetching og:image, so every share preview on the site silently lost its
// image and fell back to a bare card. Canonical URLs pointed at the
// redirecting host too.
const PRIMARY_SITE = 'https://www.toosiitech.org'
const SITE_NAME = 'Toosii Tech'
const PREVIEW_IMAGE = '/logo.png'
const OG_IMAGE_ROUTE = '/api/og'

export function createShareMetadata({ title, description, keywords = '', path = '/', canonicalPath = path, type = 'website', previewParams = {}, manifest, robots }) {
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
    // Private surfaces (admin) pass robots so they stay out of search results.
    ...(robots ? { robots } : {}),
    ...(manifest ? { manifest } : {}),
  }
}

// Icons come from the app/icon.png, app/apple-icon.png and app/favicon.ico
// file conventions — no manual icon links are needed.
export { PRIMARY_SITE, SITE_NAME, PREVIEW_IMAGE }
