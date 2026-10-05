import { readFile } from 'node:fs/promises'
import path from 'node:path'
import fontkit from '@pdf-lib/fontkit'
import { StandardFonts, rgb, type PDFDocument, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'

// Site palette (app/globals.css) adapted for white paper.
export const brand = {
  oxblood: rgb(143 / 255, 45 / 255, 60 / 255),
  gold: rgb(196 / 255, 165 / 255, 116 / 255),
  black: rgb(14 / 255, 11 / 255, 10 / 255),
  cream: rgb(246 / 255, 241 / 255, 232 / 255),
  ink: rgb(28 / 255, 22 / 255, 20 / 255),
  muted: rgb(112 / 255, 102 / 255, 96 / 255),
  rule: rgb(226 / 255, 214 / 255, 194 / 255),
}

export const BRAND_SENDER_LINES = [
  'Imani Crumble · The Bae Agenda',
  '8320 Berrybush Lane',
  'Indianapolis, IN 46234',
  'baebookings@proton.me',
]

export const BRAND_TERMS_URL = 'thebaeagenda.com/terms'

export type BrandFonts = { regular: PDFFont; bold: PDFFont; heading: PDFFont }

const ASSET_DIR = path.join(process.cwd(), 'lib', 'pdf-assets')

async function readAsset(name: string) {
  try {
    return await readFile(path.join(ASSET_DIR, name))
  } catch (error) {
    // Never block an invoice over branding: fall back to plain type, no logo.
    console.error(`[pdf-brand] missing asset ${name}:`, error)
    return null
  }
}

export async function loadBrand(pdf: PDFDocument) {
  pdf.registerFontkit(fontkit)
  const [fontBytes, logoBytes] = await Promise.all([
    readAsset('Conthrax-SemiBold.otf'),
    readAsset('dj-bae-logo.png'),
  ])

  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const heading = fontBytes ? await pdf.embedFont(fontBytes) : bold
  const logo = logoBytes ? await pdf.embedPng(logoBytes) : null

  return { fonts: { regular, bold, heading } as BrandFonts, logo }
}

export const BAND_BOTTOM = 680

// Black band with the logo, the document title, and who it's from.
export function drawBrandHeader(
  page: PDFPage,
  brandAssets: { fonts: BrandFonts; logo: PDFImage | null },
  options: { title?: string; showSender?: boolean } = {}
) {
  const title = options.title ?? 'INVOICE'
  const { width, height } = page.getSize()
  const { fonts, logo } = brandAssets
  const right = width - 56

  page.drawRectangle({ x: 0, y: BAND_BOTTOM, width, height: height - BAND_BOTTOM, color: brand.black })
  page.drawRectangle({ x: 0, y: BAND_BOTTOM - 3, width, height: 3, color: brand.oxblood })

  if (logo) {
    const logoHeight = 86
    const logoWidth = (logo.width / logo.height) * logoHeight
    page.drawImage(logo, { x: 48, y: BAND_BOTTOM + 13, width: logoWidth, height: logoHeight })
  } else {
    page.drawText('DJ B.A.E.', { x: 56, y: 730, size: 22, font: fonts.heading, color: brand.cream })
  }

  const showSender = options.showSender ?? true
  const titleSize = showSender ? 22 : 26
  page.drawText(title, {
    x: right - fonts.heading.widthOfTextAtSize(title, titleSize),
    y: showSender ? 748 : 724,
    size: titleSize,
    font: fonts.heading,
    color: brand.cream,
  })

  if (!showSender) return

  BRAND_SENDER_LINES.forEach((text, index) => {
    const size = 8.5
    page.drawText(text, {
      x: right - fonts.regular.widthOfTextAtSize(text, size),
      y: 728 - index * 11.5,
      size,
      font: index === 0 ? fonts.bold : fonts.regular,
      color: index === 0 ? brand.gold : brand.cream,
    })
  })
}

export function drawBrandFooter(page: PDFPage, fonts: BrandFonts) {
  const { width } = page.getSize()
  const text = `Full booking terms: ${BRAND_TERMS_URL}   ·   Thank you for booking DJ B.A.E.`
  const size = 8
  page.drawLine({ start: { x: 56, y: 40 }, end: { x: width - 56, y: 40 }, thickness: 0.6, color: brand.gold })
  page.drawText(text, {
    x: (width - fonts.regular.widthOfTextAtSize(text, size)) / 2,
    y: 26,
    size,
    font: fonts.regular,
    color: brand.muted,
  })
}
