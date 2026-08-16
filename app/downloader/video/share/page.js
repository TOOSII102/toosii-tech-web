import VideoDownloader from '../page'
import { createShareMetadata } from '../../../../lib/shareMetadata'

function text(value, fallback = '') {
  return String(value || fallback).trim()
}

export async function generateMetadata({ searchParams }) {
  const title = text(searchParams?.title, 'Shared video')
  const url = text(searchParams?.url)
  const platform = text(searchParams?.platform, 'video')
  const thumbnail = text(searchParams?.thumbnail)
  return createShareMetadata({
    title: `${title} — Toosii Tech`,
    description: `Watch ${title} on the Toosii Tech ${platform} downloader.`,
    keywords: `${title}, ${platform}, video downloader, Toosii Tech`,
    path: '/downloader/video/share',
    previewParams: {
      layout: 'video-detail',
      title,
      thumb: thumbnail,
      url,
      platform,
    },
  })
}

export default async function SharedVideoPage({ searchParams }) {
  return (
    <VideoDownloader
      shared={{
        url: text(searchParams?.url),
        title: text(searchParams?.title, 'Shared video'),
        thumbnail: text(searchParams?.thumbnail),
        platform: text(searchParams?.platform, 'youtube'),
        id: text(searchParams?.id),
        query: text(searchParams?.q),
      }}
    />
  )
}
