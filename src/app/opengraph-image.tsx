import { ImageResponse } from 'next/og'
 
export const alt = 'SMTPanel - Privacy-First SMTP Web Client'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #0B0B0B, #1A1A1A)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: '#F5F5F5',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#F48120" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          <h1 style={{ fontSize: '80px', fontWeight: 'bold', margin: 0, letterSpacing: '-0.02em' }}>
            SMTPanel
          </h1>
        </div>
        <p style={{ fontSize: '36px', color: '#999999', margin: 0, textAlign: 'center', maxWidth: '800px', lineHeight: 1.4 }}>
          The <span style={{ color: '#F48120', marginLeft: '10px', marginRight: '10px' }}>Zero-Database</span> SMTP Web Client.
        </p>
        <p style={{ fontSize: '24px', color: '#666666', marginTop: '30px' }}>
          Privacy-First • Stateless • Next.js
        </p>
      </div>
    ),
    {
      ...size,
    }
  )
}
