import MediaSharePage from '../../../components/MediaSharePage'
import { createShareMetadata } from '../../../lib/shareMetadata'

const text = (value, fallback = '') => String(value || fallback).trim()

export async function generateMetadata({ searchParams }) {
  const title = text(searchParams?.title, 'Shared live channel')
  const country = text(searchParams?.country)
  const language = text(searchParams?.language)
  const category = text(searchParams?.category)
  const description = `Watch ${title}${country ? ` from ${country}` : ''} on Toosii Tech Live TV.`
  return createShareMetadata({
    title: `${title} — Toosii Live TV`,
    description,
    keywords: `${title}, live TV, ${country}, ${language}, Toosii Tech`,
    path: '/live-tv/share',
    type: 'video.tv_show',
    previewParams: { layout: 'live-tv-detail', title, subtitle: text(searchParams?.subtitle, 'Live TV channel'), thumbnail: text(searchParams?.thumbnail), country, language, category },
  })
}

export default async function SharedLiveTvPage({ searchParams }) {
  return <MediaSharePage kind="live-tv" item={{ title: text(searchParams?.title), subtitle: text(searchParams?.subtitle, 'Live TV channel'), thumbnail: text(searchParams?.thumbnail), id: text(searchParams?.id), url: text(searchParams?.url), country: text(searchParams?.country), language: text(searchParams?.language), category: text(searchParams?.category) }} />
}
