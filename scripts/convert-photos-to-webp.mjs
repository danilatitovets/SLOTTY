import { readdir, unlink, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PHOTOS_DIR = path.resolve('public/photos');
const SOURCE_EXT = new Set(['.png', '.jpg', '.jpeg']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (SOURCE_EXT.has(ext)) files.push(fullPath);
  }

  return files;
}

async function convertFile(sourcePath) {
  const ext = path.extname(sourcePath);
  const targetPath = sourcePath.slice(0, -ext.length) + '.webp';
  const sourceStat = await stat(sourcePath);

  try {
    const targetStat = await stat(targetPath);
    if (targetStat.mtimeMs >= sourceStat.mtimeMs) {
      console.log(`skip (up-to-date): ${path.relative(PHOTOS_DIR, targetPath)}`);
      await unlink(sourcePath);
      return { converted: false, skipped: true, sourcePath, targetPath };
    }
  } catch {
    // target does not exist yet
  }

  await sharp(sourcePath)
    .webp({ quality: 82, effort: 4 })
    .toFile(targetPath);

  const before = sourceStat.size;
  const after = (await stat(targetPath)).size;
  const savedPct = before > 0 ? Math.round((1 - after / before) * 100) : 0;

  console.log(
    `ok: ${path.relative(PHOTOS_DIR, sourcePath)} -> ${path.basename(targetPath)} (${savedPct}% smaller)`,
  );

  await unlink(sourcePath);
  return { converted: true, skipped: false, sourcePath, targetPath, before, after };
}

const files = await walk(PHOTOS_DIR);
if (files.length === 0) {
  console.log('No PNG/JPG files found in public/photos');
  process.exit(0);
}

console.log(`Converting ${files.length} file(s) in public/photos ...`);

let converted = 0;
let skipped = 0;
let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
  const result = await convertFile(file);
  if (result.converted) {
    converted += 1;
    totalBefore += result.before;
    totalAfter += result.after;
  } else if (result.skipped) {
    skipped += 1;
  }
}

const totalSavedPct =
  totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0;

console.log(
  `Done: converted=${converted}, skipped=${skipped}, saved ~${totalSavedPct}% (${totalBefore} -> ${totalAfter} bytes)`,
);
