import AudioDownloader from '../page'
import { createShareMetadata } from '../../../../lib/shareMetadata'

function text(value, fallback = '') {
  return String(value || fallback).trim()
}

export async function generateMetadata({ searchParams }) {
  const title = text(searchParams?.title, 'Shared song')
  const artist = text(searchParams?.artist)
  const thumbnail = text(searchParams?.thumbnail)
  const description = artist
    ? `Listen to ${title} by ${artist} on Toosii Tech.`
    : `Listen to ${title} on the Toosii Tech MP3 downloader.`

  return createShareMetadata({
    title: `${title}${artist ? ` by ${artist}` : ''} — Toosii Tech`,
    description,
    keywords: `${title}, ${artist}, MP3, audio downloader, Toosii Tech`,
    path: '/downloader/audio/share',
    previewParams: {
      layout: 'audio-detail',
      title,
      artist,
      thumbnail,
      duration: text(searchParams?.duration),
      quality: text(searchParams?.quality),
    },
  })
}

export default async function SharedAudioPage({ searchParams }) {
  return (
    <AudioDownloader
      shared={{
        url: text(searchParams?.url),
        title: text(searchParams?.title, 'Shared song'),
        artist: text(searchParams?.artist),
        thumbnail: text(searchParams?.thumbnail),
        duration: text(searchParams?.duration),
        quality: text(searchParams?.quality),
        id: text(searchParams?.id),
        query: text(searchParams?.q),
      }}
    />
  )
}
