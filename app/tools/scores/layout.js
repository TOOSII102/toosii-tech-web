import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Live Football Scores — EPL, La Liga, Serie A | Toosii Tech',
  description: 'Free live football scores from the Premier League, La Liga, Serie A, Bundesliga, Ligue 1 and Champions League — plus standings and top scorers. By Toosii Tech.',
  keywords: 'live football scores, epl scores today, la liga live, serie a scores, football results, leagues standings Kenya, Toosii Tech',
  path: '/tools/scores',
})

export default function ScoresLayout({ children }) {
  return children
}
