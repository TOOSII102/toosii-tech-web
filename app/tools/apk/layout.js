import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Free APK Downloader — Download Android Apps | Toosii Tech',
  description: 'Search and download APK files for any Android app for free — no Google Play needed. Get any app version, including older releases.',
  keywords: 'APK downloader, download APK free, Android app download, APK search, install APK without Play Store, Toosii Tech',
  path: '/tools/apk',
})

export default function ApkLayout({ children }) {
  return children
}
