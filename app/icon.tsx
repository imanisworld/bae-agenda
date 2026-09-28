import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const contentType = 'image/png'
export const size = {
  width: 512,
  height: 512,
}

async function getLogoDataUrl() {
  const filePath = path.join(process.cwd(), 'public', 'brand', 'dj-bae-logo.png')
  const buffer = await readFile(filePath)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

export default async function Icon() {
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
            'radial-gradient(circle at 50% 42%, rgba(143,45,60,.42) 0%, rgba(70,28,35,.22) 34%, rgba(13,13,15,1) 72%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '26px',
            border: '1px solid rgba(210,177,125,.22)',
            borderRadius: '92px',
            background: 'linear-gradient(145deg, rgba(255,255,255,.035), rgba(0,0,0,.08))',
          }}
        />
        <img
          src={logoSrc}
          alt=""
          width={460}
          height={337}
          style={{
            position: 'relative',
            width: '90%',
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 24px 30px rgba(0,0,0,.58))',
          }}
        />
      </div>
    ),
    size,
  )
}
