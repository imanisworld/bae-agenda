import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const contentType = 'image/png'
export const size = {
  width: 180,
  height: 180,
}

async function getLogoDataUrl() {
  const filePath = path.join(process.cwd(), 'public', 'brand', 'dj-bae-logo.png')
  const buffer = await readFile(filePath)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

export default async function AppleIcon() {
  const logoSrc = await getLogoDataUrl()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at 50% 42%, rgba(143,45,60,.48) 0%, rgba(70,28,35,.24) 36%, rgba(13,13,15,1) 74%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '9px',
            border: '1px solid rgba(210,177,125,.22)',
            borderRadius: '32px',
          }}
        />
        <img
          src={logoSrc}
          alt=""
          width={164}
          height={120}
          style={{
            position: 'relative',
            width: '91%',
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 9px 12px rgba(0,0,0,.58))',
          }}
        />
      </div>
    ),
    size,
  )
}
