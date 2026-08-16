import MediaSharePage from '../../../components/MediaSharePage'
import { createShareMetadata } from '../../../lib/shareMetadata'

const text = (value, fallback = '') => String(value || fallback).trim()

export async function generateMetadata({ searchParams }) {
  const title = text(searchParams?.title, 'Shared book')
  const author = text(searchParams?.author)
  const description = author
    ? `Discover ${title} by ${author} on Toosii Tech Books.`
    : `Discover ${title} on Toosii Tech Books.`
  return createShareMetadata({
    title: `${title}${author ? ` by ${author}` : ''} — Toosii Books`,
    description,
    keywords: `${title}, ${author}, books, reading, Toosii Tech`,
    path: '/books/share',
    type: 'book',
    previewParams: { layout: 'book-detail', title, author, subtitle: text(searchParams?.subtitle, 'Book'), thumbnail: text(searchParams?.thumbnail), year: text(searchParams?.year) },
  })
}

export default async function SharedBookPage({ searchParams }) {
  return <MediaSharePage kind="book" item={{ title: text(searchParams?.title), subtitle: text(searchParams?.subtitle, 'Book'), author: text(searchParams?.author), thumbnail: text(searchParams?.thumbnail), id: text(searchParams?.id), url: text(searchParams?.url), year: text(searchParams?.year) }} />
}
