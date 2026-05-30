/**
 * Генерация favicon, PWA icons и OG image из public/photos/logo-header.webp.
 * Запуск: npm run brand:assets
 *
 * TODO: favicon.svg сейчас встраивает PNG 32×32 — для идеального масштаба
 * можно позже заменить на ручную векторную SVG-версию логотипа SLOTTY.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import toIco from 'to-ico';

const ROOT = path.resolve(import.meta.dirname, '..');
const LOGO_SRC = path.join(ROOT, 'public/photos/logo-header.webp');
const PUBLIC = path.join(ROOT, 'public');

async function ensureDirs() {
  await mkdir(path.join(PUBLIC, 'icons'), { recursive: true });
  await mkdir(path.join(PUBLIC, 'og'), { recursive: true });
}

async function loadLogo() {
  return sharp(LOGO_SRC).ensureAlpha();
}

async function writePng(logo, size, outPath) {
  await logo
    .clone()
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
}

async function writeFaviconIco(logo) {
  const sizes = [16, 32, 48];
  const buffers = await Promise.all(
    sizes.map((s) =>
      logo
        .clone()
        .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer(),
    ),
  );
  const ico = await toIco(buffers);
  await writeFile(path.join(PUBLIC, 'favicon.ico'), ico);
}

async function writeFaviconSvg(logo) {
  const png32 = await logo
    .clone()
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const b64 = png32.toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><image href="data:image/png;base64,${b64}" width="32" height="32"/></svg>`;
  await writeFile(path.join(PUBLIC, 'favicon.svg'), svg, 'utf8');
}

async function writeOgDefault(logo) {
  const width = 1200;
  const height = 630;
  const logoW = 320;
  const logoH = Math.round(logoW * 0.35);

  const logoPng = await logo
    .clone()
    .resize(logoW, logoH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
      background: { r: 255, g: 245, b: 245, alpha: 1 },
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
  const logo = await loadLogo();

  await writePng(logo, 180, path.join(PUBLIC, 'apple-touch-icon.png'));
  await writePng(logo, 192, path.join(PUBLIC, 'icons/icon-192.png'));
  await writePng(logo, 512, path.join(PUBLIC, 'icons/icon-512.png'));
  await writeFaviconIco(logo);
  await writeFaviconSvg(logo);
  await writeOgDefault(logo);

  console.log('Brand assets generated from logo-header.webp');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
