export const metadata = {
  title: 'Session Generator — Toosii Tech',
  description: 'Generate your WhatsApp session ID to connect TOOSII XD ULTRA.',
}

export default function SessionPage() {
  return (
    <iframe
      src="https://toosii-xd-session-generator-woyo.onrender.com/pair"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
      }}
      title="Session Generator"
      allow="clipboard-write"
    />
  )
}
