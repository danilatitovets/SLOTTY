/**
 * Генерация favicon, PWA icons и OG image.
 *
 * Favicon: квадратный crop только знака из logo-header.webp (не весь header-logo
 * и не текст). Сначала вырезается content bbox по alpha, затем square + padding,
 * master 1024px и качественный downscale (Lanczos3).
 *
 * OG: горизонтальный logo-header (trim + contain), без изменения header-logo.webp.
 *
 * Запуск: npm run brand:assets
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import toIco from 'to-ico';

const ROOT = path.resolve(import.meta.dirname, '..');
const LOGO_HEADER_SRC = path.join(ROOT, 'public/photos/logo-header.webp');
const PUBLIC = path.join(ROOT, 'public');

/** Доля стороны квадрата, которую занимает знак (остальное — поля). */
const ICON_FILL_RATIO = 0.86;

/** Master для downscale favicon (не апскейлить мелкий raster). */
const ICON_MASTER_SIZE = 1024;

const ALPHA_THRESHOLD = 24;

const BRAND_BG = { r: 255, g: 245, b: 245, alpha: 1 };

async function ensureDirs() {
  await mkdir(path.join(PUBLIC, 'icons'), { recursive: true });
  await mkdir(path.join(PUBLIC, 'og'), { recursive: true });
}

/**
 * Находит bbox непрозрачных пикселей (знак без пустого поля 1536×1024).
 */
async function findContentBBox(imagePath) {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h } = info;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error(`No opaque content found in ${imagePath}`);
  }

  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.06);
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const width = Math.min(w - left, maxX - minX + 1 + pad * 2);
  const height = Math.min(h - top, maxY - minY + 1 + pad * 2);

  return { left, top, width, height };
}

/**
 * Квадратный знак для favicon: extract bbox → square canvas → master PNG buffer.
 * Не использует текстовую часть широкого логотипа.
 */
async function buildSquareIconMaster() {
  const bbox = await findContentBBox(LOGO_HEADER_SRC);
  const extracted = sharp(LOGO_HEADER_SRC).extract(bbox);
  const meta = await extracted.metadata();
  const side = Math.max(meta.width, meta.height);
  const inner = Math.round(side * ICON_FILL_RATIO);
  const pad = Math.floor((side - inner) / 2);

  return sharp(LOGO_HEADER_SRC)
    .extract(bbox)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .extend({
      top: pad,
      bottom: side - inner - pad,
      left: pad,
      right: side - inner - pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(ICON_MASTER_SIZE, ICON_MASTER_SIZE, {
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

async function writeIconPng(masterBuf, size, outPath, withBrandBg = false) {
  let pipeline = sharp(masterBuf).resize(size, size, { kernel: sharp.kernel.lanczos3 });

  if (withBrandBg) {
    pipeline = pipeline.flatten({ background: '#FFF5F5' });
  }

  await pipeline.png().toFile(outPath);
}

async function writeFaviconIco(masterBuf) {
  const sizes = [16, 32, 48];
  const buffers = await Promise.all(
    sizes.map((s) =>
      sharp(masterBuf)
        .resize(s, s, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer(),
    ),
  );
  const ico = await toIco(buffers);
  await writeFile(path.join(PUBLIC, 'favicon.ico'), ico);
}

async function writeOgDefault() {
  const bbox = await findContentBBox(LOGO_HEADER_SRC);
  const width = 1200;
  const height = 630;
  const logoW = 420;
  const logoH = Math.round(logoW * (bbox.height / bbox.width));

  const logoPng = await sharp(LOGO_HEADER_SRC)
    .extract(bbox)
    .resize(logoW, logoH, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  const titleSvg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#FFF5F5"/>
      <text x="50%" y="78%" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="600" fill="#111827">Онлайн-запись к мастерам в Минске</text>
    </svg>`,
  );

  const titleLayer = await sharp(titleSvg).png().toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BRAND_BG,
    },
  })
    .composite([
      { input: logoPng, top: Math.round((height - logoH) / 2) - 40, left: Math.round((width - logoW) / 2) },
      { input: titleLayer, top: 0, left: 0 },
    ])
    .jpeg({ quality: 88 })
    .toFile(path.join(PUBLIC, 'og/og-default.jpg'));
}

async function main() {
  await ensureDirs();

  const iconMasterBuf = await buildSquareIconMaster();
  const bbox = await findContentBBox(LOGO_HEADER_SRC);
  console.log(
    `Icon crop from logo-header.webp: ${bbox.width}×${bbox.height} at (${bbox.left},${bbox.top}) → square master ${ICON_MASTER_SIZE}px`,
  );

  await writeIconPng(iconMasterBuf, 32, path.join(PUBLIC, 'icons/icon-32.png'));
  await writeIconPng(iconMasterBuf, 180, path.join(PUBLIC, 'apple-touch-icon.png'), true);
  await writeIconPng(iconMasterBuf, 192, path.join(PUBLIC, 'icons/icon-192.png'), true);
  await writeIconPng(iconMasterBuf, 512, path.join(PUBLIC, 'icons/icon-512.png'), true);
  await writeIconPng(iconMasterBuf, 32, path.join(PUBLIC, 'favicon.png'));
  await writeFaviconIco(iconMasterBuf);
  await writeOgDefault();

  console.log('Brand assets generated (square icon crop, no blurry header-scale favicon).');
  console.log('favicon.svg not generated — use favicon.ico + PNG only.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
