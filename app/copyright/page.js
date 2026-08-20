import Layout from '../../components/Layout'
import { createShareMetadata } from '../../lib/shareMetadata'
import '../legal.css'

export const metadata = createShareMetadata({
  title: 'Copyright and Takedown — Toosii Tech',
  description: 'Copyright information, responsible use, and takedown contact for Toosii Tech.',
  path: '/copyright',
})

export default function CopyrightPage() {
  return <Layout><main className="legal-page"><div className="page-wrapper"><p className="section-eyebrow">LEGAL</p><h1 className="section-title">Copyright and Takedown</h1><p className="legal-lead">Toosii Tech respects intellectual property rights and aims to provide clear tools, metadata, and links without encouraging unlawful copying or redistribution.</p><div className="legal-grid"><section><h2>How media features work</h2><p>ToosiiFlix uses provider APIs to retrieve catalog metadata, playback references, captions, and download responses. Availability and rights may differ by country and by provider.</p></section><section><h2>Rights-holder requests</h2><p>If you believe material linked or surfaced through a Toosii feature infringes your rights, send the title, URL, proof of ownership, and the requested action to <a href="mailto:toosiitechcompany@gmail.com">toosiitechcompany@gmail.com</a>.</p></section><section><h2>Good-faith details</h2><p>Include enough information for the request to be reviewed accurately. Do not send passwords, private keys, or unrelated personal information. We may forward a request to the relevant upstream provider when appropriate.</p></section><section><h2>Responsible use</h2><p>Users must not use Toosii Tech to infringe copyright, evade lawful restrictions, or redistribute protected files. See the complete <a href="/terms">Terms of Use</a> for platform rules.</p></section></div><p className="legal-updated">Copyright contact: toosiitechcompany@gmail.com · Toosii Tech, Kenya</p></div></main></Layout>
}
