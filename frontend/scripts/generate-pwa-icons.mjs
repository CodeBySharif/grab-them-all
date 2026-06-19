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
  { name: 'maskable-512x512.png', size: 512, maskable: true },
]

for (const { name, size, maskable = false } of sizes) {
  const icon = sharp(sourceSvg).resize(
    maskable ? Math.round(size * 0.7) : size,
    maskable ? Math.round(size * 0.7) : size,
    { fit: 'contain', background: '#010102' },
  )

  const canvas = maskable
    ? sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: '#010102',
        },
      }).composite([{ input: await icon.png().toBuffer(), gravity: 'center' }])
    : icon

  await canvas.png().toFile(join(publicDir, name))

  console.log(`Wrote public/${name}`)
}
