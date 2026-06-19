import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const sourceSvg = readFileSync(join(publicDir, 'boat.svg'))

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  await sharp(sourceSvg)
    .resize(size, size, { fit: 'contain', background: '#010102' })
    .png()
    .toFile(join(publicDir, name))

  console.log(`Wrote public/${name}`)
}
