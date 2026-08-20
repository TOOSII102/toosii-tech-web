import Layout from '../../components/Layout'
import { createShareMetadata } from '../../lib/shareMetadata'
import '../legal.css'

export const metadata = createShareMetadata({
  title: 'Terms of Use — Toosii Tech',
  description: 'Terms and responsible-use guidance for Toosii Tech tools, API services, media features, and downloads.',
  path: '/terms',
})

export default function TermsPage() {
  return <Layout><main className="legal-page"><div className="page-wrapper"><p className="section-eyebrow">LEGAL</p><h1 className="section-title">Terms of Use</h1><p className="legal-lead">Please use Toosii Tech responsibly and respect the rights, privacy, and terms of every third-party service you access through the platform.</p><div className="legal-grid"><section><h2>Using the platform</h2><p>Toosii Tech provides developer tools, APIs, media discovery, download utilities, and educational features for lawful personal and development use. You are responsible for the content, URLs, configurations, and requests you submit.</p></section><section><h2>Media and downloads</h2><p>Only access or download material when you have permission or a lawful right to do so. Do not use Toosii Tech to bypass access controls, infringe copyright, redistribute protected material, or violate a provider’s terms.</p></section><section><h2>API fairness</h2><p>Do not abuse, overload, scrape aggressively, or attempt to disrupt Toosii API routes or upstream services. Respect reasonable rate limits and use cached results where practical.</p></section><section><h2>Availability</h2><p>Third-party providers can change, become unavailable, or return incomplete data. Toosii Tech may adjust, limit, or discontinue features to protect the platform and its users.</p></section><section><h2>Security</h2><p>Do not submit passwords, private keys, tokens, or other secrets to public tools. Configuration inspection is designed to avoid decrypting protected formats and should not be treated as a secure secret vault.</p></section><section><h2>Contact</h2><p>Report copyright concerns, security issues, or harmful behavior through the <a href="/contact">Toosii Tech feedback page</a>.</p></section></div><p className="legal-updated">Last updated: August 2026 · Toosii Tech</p></div></main></Layout>
}
