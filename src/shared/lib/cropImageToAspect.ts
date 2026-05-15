export type PhotoFrameFocus = {
  /** 0…1, горизонтальный центр кадра */
  x: number;
  /** 0…1, вертикальный центр кадра */
  y: number;
  /** 1 = cover, >1 приближение */
  zoom: number;
};

const DEFAULT_FOCUS: PhotoFrameFocus = { x: 0.5, y: 0.5, zoom: 1 };

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
    img.src = src;
  });
}

/** Обрезка под соотношение сторон (как object-fit: cover + object-position). */
export async function cropImageToAspect(
  src: string,
  aspect: number,
  focus: PhotoFrameFocus = DEFAULT_FOCUS,
  outputWidth = 1280,
): Promise<string> {
  const img = await loadImage(src);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  if (!W || !H) throw new Error('Пустое изображение');

  const z = clamp(focus.zoom, 1, 3);
  const fx = clamp(focus.x, 0, 1);
  const fy = clamp(focus.y, 0, 1);

  let cropW: number;
  let cropH: number;
  if (W / H > aspect) {
    cropH = H / z;
    cropW = cropH * aspect;
  } else {
    cropW = W / z;
    cropH = cropW / aspect;
  }

  let sx = fx * W - cropW / 2;
  let sy = fy * H - cropH / 2;
  sx = clamp(sx, 0, Math.max(0, W - cropW));
  sy = clamp(sy, 0, Math.max(0, H - cropH));

  const outH = Math.round(outputWidth / aspect);
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas недоступен');
  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outputWidth, outH);
  return canvas.toDataURL('image/jpeg', 0.9);
}

export function isAdjustablePhotoSrc(src: string): boolean {
  const s = src.trim();
  return s.startsWith('data:image/') || s.startsWith('https://') || s.startsWith('http://') || s.startsWith('blob:');
}
