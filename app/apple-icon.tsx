import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const contentType = 'image/png'
export const size = {
  width: 512,
  height: 512,
}

async function getBackgroundDataUrl() {
  const filePath = path.join(process.cwd(), 'public', 'photos', 'images', 'outside.jpg')
  const buffer = await readFile(filePath)
  return `data:image/jpeg;base64,${buffer.toString('base64')}`
}

export default async function AppleIcon() {
  const backgroundSrc = await getBackgroundDataUrl()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
          background: '#0d0d0f',
          color: '#faf8f3',
        }}
      >
        <img
          src={backgroundSrc}
          alt=""
          width={512}
          height={512}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 46%',
            filter: 'saturate(0.9) contrast(1.02)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(8,8,10,0.28) 0%, rgba(8,8,10,0.46) 44%, rgba(8,8,10,0.88) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: '24px',
            border: '1px solid rgba(250,248,243,0.16)',
            background: 'linear-gradient(180deg, rgba(13,13,15,0.18), rgba(13,13,15,0.12))',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '42px 38px 34px',
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              opacity: 0.78,
            }}
          >
            The
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              lineHeight: 0.9,
              textTransform: 'uppercase',
              fontWeight: 800,
            }}
          >
            <div style={{ fontSize: 86, color: '#faf8f3' }}>Bae</div>
            <div style={{ fontSize: 86, color: '#9b5de5' }}>Agenda</div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 20,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              opacity: 0.82,
            }}
          >
            <div
              style={{
                width: 30,
                height: 1,
                background: 'rgba(250,248,243,0.5)',
              }}
            />
            DJ B.A.E.
          </div>
        </div>
      </div>
    ),
    size,
  )
}
