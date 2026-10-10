// Mobile layout smoke test against a locally served build, not a remote
// Vercel response. Requires Chrome on GitHub's ubuntu-latest runner.
import { chromium } from 'playwright-core'
import { PDFDocument } from 'pdf-lib'
import { mkdir, writeFile } from 'node:fs/promises'

const root = process.env.QA_BASE_URL || 'http://127.0.0.1:3407'
const out = 'test-results/mobile-visual'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const failures = []
const assert = (ok, desc, details = '') => {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + desc + (details ? ' — ' + details : ''))
  if (!ok) failures.push(desc + ' ' + details)
}
const box = async locator => {
  const r = await locator.boundingBox()
  return r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null
}
const withinScreen = (rect, width, inset = 2) => !!rect && rect.x >= -inset && rect.x + rect.width <= width + inset

try {
  for (const width of [320, 375, 390, 430, 768]) {
    const page = await browser.newPage({ viewport: { width, height: 812 }, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768 })
    const resp = await page.goto(root + '/press-kit', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.locator('.press-kit-sheet').waitFor()
    await page.screenshot({ path: out + '/press-kit-' + width + '.png', fullPage: true, animations: 'disabled' })
    const data = await page.evaluate(() => ({
      viewport: window.innerWidth,
      docWidth: document.documentElement.scrollWidth,
      sheetWidth: document.querySelector('.press-kit-sheet')?.getBoundingClientRect().width,
      hero: document.querySelector('.press-kit-left')?.getBoundingClientRect().height,
      content: document.querySelector('.press-kit-right')?.getBoundingClientRect().height,
      imgLoaded: !!document.querySelector('.press-kit-photo')?.complete,
    }))
    console.log('PRESS KIT', width, JSON.stringify(data))
    assert(resp?.ok(), 'Press Kit HTTP ' + width)
    const dockVisible = await page.locator('.public-navigation-chrome [class*="dockWrap"]').evaluateAll(nodes =>
      nodes.some(node => getComputedStyle(node).display !== 'none' && !!node.getClientRects().length))
    assert(!dockVisible, 'Press Kit fixed dock hidden ' + width)
    assert(data.docWidth <= data.viewport + 2, 'Press Kit no horizontal scrolling ' + width, data.docWidth + ' > ' + data.viewport)
    assert(data.hero >= 200 && data.hero <= 530, 'Press Kit hero height ' + width, String(data.hero))
    assert(data.sheetWidth <= width, 'Press Kit sheet fits ' + width, String(data.sheetWidth))
    assert(withinScreen(await box(page.locator('.press-kit-mail-cta')), width), 'Press Kit booking CTA fits ' + width)
    assert(withinScreen(await box(page.locator('.press-kit-footer-book')), width), 'Press Kit footer CTA fits ' + width)
    const footer = await box(page.locator('.press-kit-footer'))
    const sheet = await box(page.locator('.press-kit-sheet'))
    assert(!!footer && !!sheet && Math.abs((footer.y + footer.height) - (sheet.y + sheet.height)) < 4,
      'Press Kit footer ends sheet ' + width,
      JSON.stringify({ footer, sheet }))
    await page.close()
  }
  for (const width of [320, 375, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
    const resp = await page.goto(root + '/book', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.locator('#book-tab-contact').click()
    await page.locator('.book-experience-contact-panel').waitFor({ state: 'visible' })
    await page.screenshot({ path: out + '/contact-' + width + '.png', fullPage: true, animations: 'disabled' })
    const data = await page.evaluate(() => ({
      viewport: window.innerWidth, docWidth: document.documentElement.scrollWidth,
      formVisible: getComputedStyle(document.querySelector('.book-experience-form')).display !== 'none',
      columns: getComputedStyle(document.querySelector('.book-experience-contact')).gridTemplateColumns,
    }))
    console.log('CONTACT', width, JSON.stringify(data))
    assert(resp?.ok(), 'Book HTTP ' + width)
    assert(data.docWidth <= data.viewport + 2, 'Contact no horizontal scrolling ' + width, data.docWidth + ' > ' + data.viewport)
    assert(!data.formVisible, 'Inquiry hidden while Contact selected ' + width)
    assert(withinScreen(await box(page.locator('.book-experience-contact-panel')), width), 'Contact panel fits ' + width)
    const bookingEmail = await box(page.locator('.book-experience-contact-bookings a'))
    assert(!!bookingEmail && bookingEmail.height < 28 &&
      withinScreen(bookingEmail, width),
      'Contact booking address is one line within viewport ' + width,
      JSON.stringify(bookingEmail))
    assert(withinScreen(await box(page.locator('.book-experience-socials')), width), 'Social links fit ' + width)
    await page.close()
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(root + '/press-kit', { waitUntil: 'domcontentloaded' })
  await page.emulateMedia({ media: 'print' })
  const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false })
  await writeFile(out + '/press-kit.pdf', pdf)
  const parsed = await PDFDocument.load(pdf)
  console.log('PDF pages:', parsed.getPageCount(), 'page dimensions:', parsed.getPages().map(p => p.getSize()))
  assert(parsed.getPageCount() === 1, 'Press Kit printed PDF one page', String(parsed.getPageCount()))
  await page.close()
} finally {
  await browser.close()
}
if (failures.length) {
  console.error('Mobile visual checks failed:', failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Mobile layout and print smoke checks passed')
}
