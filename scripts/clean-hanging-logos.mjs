/* Remove connected dark matte from the original photo-rendered logo PNGs.
   No logo pixels, geometry, or sizing outside the backdrop are regenerated.
   Run before both local dev and Vercel builds. Originals stay untouched. */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const sourceDir = path.join(process.cwd(), 'public', 'brand')
const outputDir = path.join(sourceDir, 'clean')
await fs.mkdir(outputDir, { recursive: true })

for (const suffix of ['', '-gold', '-silver', '-chrome']) {
  const filename = `dj-bae-logo${suffix}.png`
  const source = path.join(sourceDir, filename)
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  if (channels !== 4) throw new Error(`Unexpected PNG pixel format: ${filename}`)
  const count = width * height
  const outside = new Uint8Array(count)
  const queue = new Int32Array(count)
  let head = 0
  let tail = 0
  const eligible = (p) => {
    const i = p * 4
    const a = data[i+3]
    if (a < 8) return true
    const r=data[i], g=data[i+1], b=data[i+2]
    // Isolate only edge-connected dark neutral matte; keep gold and chrome.
    return r < 85 && g < 85 && b < 85 && Math.max(r,g,b) - Math.min(r,g,b) < 50
  }
  const visit = (p) => {
    if (!outside[p] && eligible(p)) {
      outside[p] = 1
      queue[tail++] = p
    }
  }
  for (let x=0; x<width; x++) { visit(x); visit((height-1)*width+x) }
  for (let y=0; y<height; y++) { visit(y*width); visit(y*width+width-1) }
  while (head < tail) {
    const p=queue[head++]
    const x=p%width, y=Math.floor(p/width)
    if (x>0) visit(p-1)
    if (x<width-1) visit(p+1)
    if (y>0) visit(p-width)
    if (y<height-1) visit(p+width)
  }
  if (tail < count * .02) {
    // A fully transparent input is already clean. Fail for an opaque input
    // that unexpectedly has no reachable dark matte, instead of faking it.
    if (data[3] > 8) throw new Error(`Could not isolate logo matte: ${filename}`)
  }
  for (let p=0; p<count; p++) if (outside[p]) data[p*4+3]=0
  // Feather at the immediate cut edge only. Preserve the original metallic
  // highlights and black lettering/shadows inside the logo body.
  for (let p=0; p<count; p++) {
    if (outside[p]) continue
    const x=p%width, y=Math.floor(p/width)
    const adjacent=(x>0 && outside[p-1]) || (x<width-1 && outside[p+1]) ||
      (y>0 && outside[p-width]) || (y<height-1 && outside[p+width])
    if (!adjacent) continue
    const i=p*4, max=Math.max(data[i],data[i+1],data[i+2])
    if (max < 115) data[i+3]=Math.round(data[i+3]*Math.max(0,(max-70)/45))
  }
  const output=path.join(outputDir, filename)
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output)
  // Small tag copy served as-is (unoptimized, lossless): the on-the-fly lossy WebP/AVIF
  // re-encode smeared noise into the soft alpha edge and read as a matte.
  // sharp resizes with premultiplied alpha, so no dark fringe; then drop the
  // near-invisible haze pixels a drop-shadow would turn into a visible box.
  const tag = await sharp(data, { raw: { width, height, channels: 4 } })
    .resize({ width: 260 })
    .raw()
    .toBuffer({ resolveWithObject: true })
  for (let i = 3; i < tag.data.length; i += 4) if (tag.data[i] <= 12) tag.data[i] = 0
  await sharp(tag.data, { raw: tag.info })
    .webp({ lossless: true, effort: 6 })
    .toFile(path.join(outputDir, filename.replace('.png', '-tag.webp')))
  // Prove the four external corners no longer form an opaque rectangle.
  const corners=[0,width-1,(height-1)*width,count-1]
  if (corners.some(p=>data[p*4+3]!==0)) throw new Error(`Opaque corner remains: ${filename}`)
  console.info(`[logo-alpha] ${filename}: ${tail}/${count} background pixels cleared`)
}
