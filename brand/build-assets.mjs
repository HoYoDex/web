/**
 * Rasterises the SVG brand marks into every format the various platforms want.
 * Run: node brand/build-assets.mjs
 */
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const mark = await readFile(join(root, 'logo-mark.svg'));
const lockup = await readFile(join(root, 'logo-lockup.svg'));

await mkdir(join(root, 'png'), { recursive: true });
await mkdir(join(root, 'social'), { recursive: true });

// Square mark: favicons, app icons, avatars.
const SIZES = [16, 32, 48, 64, 128, 180, 192, 256, 400, 512, 1024];
for (const s of SIZES) {
  await sharp(mark, { density: 600 })
    .resize(s, s)
    .png({ compressionLevel: 9 })
    .toFile(join(root, `png/logo-mark-${s}.png`));
}

// Horizontal lockup for headers, README, press.
for (const w of [400, 800, 1600]) {
  await sharp(lockup, { density: 600 })
    .resize(w)
    .png({ compressionLevel: 9 })
    .toFile(join(root, `png/logo-lockup-${w}.png`));
}

// Multi-resolution .ico for legacy browsers.
await writeFile(
  join(root, 'favicon.ico'),
  await pngToIco([16, 32, 48].map((s) => join(root, `png/logo-mark-${s}.png`)))
);

// Platform-specific canvases. Each is the mark centred on brand void with padding.
const CANVASES = {
  // name: [w, h, mark scale]
  'twitter-header': [1500, 500, 0.62],
  'youtube-banner': [2560, 1440, 0.28],
  'linkedin-banner': [1128, 191, 0.7],
  'og-image': [1200, 630, 0.0], // uses lockup instead
  'instagram-post': [1080, 1080, 0.55],
};

for (const [name, [w, h, scale]] of Object.entries(CANVASES)) {
  const useLockup = scale === 0;
  const art = useLockup
    ? await sharp(lockup, { density: 600 }).resize(Math.round(w * 0.72)).png().toBuffer()
    : await sharp(mark, { density: 600 }).resize(Math.round(Math.min(w, h) * scale)).png().toBuffer();

  await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 13, g: 13, b: 22, alpha: 1 } },
  })
    .composite([{ input: art, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(join(root, `social/${name}.png`));
}

// Avatar variants — the square PNG at the sizes each platform wants.
for (const [name, size] of Object.entries({
  'avatar-twitter': 400,
  'avatar-youtube': 800,
  'avatar-instagram': 320,
  'avatar-linkedin': 400,
  'avatar-github-org': 500,
  'avatar-whatsapp': 640,
  'avatar-discord': 512,
})) {
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 13, g: 13, b: 22, alpha: 1 } },
  })
    .composite([
      { input: await sharp(mark, { density: 600 }).resize(Math.round(size * 0.78)).png().toBuffer(), gravity: 'center' },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(root, `social/${name}.png`));
}

console.log('Brand assets written to brand/png, brand/social and brand/favicon.ico');
