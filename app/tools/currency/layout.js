import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Currency Converter — KES Exchange Rates | Toosii Tech',
  description: 'Free currency converter with live exchange rates — KES to USD, UGX, TZS, EUR and 100+ currencies. Daily rates, no sign-up, by Toosii Tech.',
  keywords: 'currency converter, kes to usd, exchange rates kenya, ksh rate, currency converter free, Toosii Tech',
  path: '/tools/currency',
})

export default function CurrencyLayout({ children }) {
  return children
}
