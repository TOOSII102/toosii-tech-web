import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Toosii Tech developer platform from Kenya'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          color: '#f8fafc',
          background: 'linear-gradient(135deg, #020617 0%, #07112b 54%, #111c45 100%)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              color: '#dbeafe',
              background: 'linear-gradient(135deg, #06b6d4, #4f46e5)',
              fontSize: '31px',
              fontWeight: 800,
            }}
          >
            T
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '0.06em' }}>TOOSII TECH</span>
            <span style={{ color: '#67e8f9', fontSize: '15px', letterSpacing: '0.18em' }}>BUILT IN KENYA</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '920px' }}>
          <span style={{ color: '#67e8f9', fontSize: '18px', fontWeight: 700, letterSpacing: '0.16em' }}>FREE TOOLS · BOTS · API · STREAMING</span>
          <span style={{ fontSize: '65px', lineHeight: 1.04, fontWeight: 800 }}>Build faster with Toosii Tech.</span>
          <span style={{ color: '#cbd5e1', fontSize: '25px', lineHeight: 1.35 }}>A developer platform with free web tools, live APIs, a WhatsApp bot, and more.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px 20px', border: '1px solid rgba(103, 232, 249, 0.35)', borderRadius: '999px', color: '#a5f3fc', fontSize: '17px' }}>No account required</div>
          <div style={{ padding: '12px 20px', border: '1px solid rgba(129, 140, 248, 0.45)', borderRadius: '999px', color: '#c7d2fe', fontSize: '17px' }}>Multi-domain platform</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
