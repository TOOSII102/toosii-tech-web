import { createShareMetadata } from '../../../lib/shareMetadata'

export const metadata = createShareMetadata({
  title: 'Configuration Inspector — Toosii Tech',
  description: 'Inspect supported OpenVPN, Shadowsocks, V2Ray, sing-box, and JSON configuration metadata with sensitive values redacted.',
  keywords: ['configuration inspector', 'OpenVPN inspector', 'V2Ray config', 'sing-box config', 'Toosii API'],
  path: '/tools/config-inspector',
  previewParams: { type: 'tool', label: 'CONFIG INSPECTOR', title: 'Safe configuration metadata, ready to copy.' },
})

export default function ConfigInspectorLayout({ children }) {
  return children
}
