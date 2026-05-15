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

/**
 * Прямоугольник вырезки в координатах исходного изображения (как в canvas).
 * Превью в UI должно использовать те же sx, sy, cropW, cropH и масштаб k = viewW / cropW.
 */
export function computeCropRect(
  imgW: number,
  imgH: number,
  aspect: number,
  focus: PhotoFrameFocus,
): { sx: number; sy: number; cropW: number; cropH: number } {
  const z = clamp(focus.zoom, 1, 5);
  const fx = clamp(focus.x, 0, 1);
  const fy = clamp(focus.y, 0, 1);

  let cropW: number;
  let cropH: number;
  if (imgW / imgH > aspect) {
    cropH = imgH / z;
    cropW = cropH * aspect;
  } else {
    cropW = imgW / z;
    cropH = cropW / aspect;
  }

  let sx = fx * imgW - cropW / 2;
  let sy = fy * imgH - cropH / 2;
  sx = clamp(sx, 0, Math.max(0, imgW - cropW));
  sy = clamp(sy, 0, Math.max(0, imgH - cropH));
  return { sx, sy, cropW, cropH };
}

/** Сжать центр кадра в допустимый диапазон при текущем zoom (после колеса / слайдера). */
export function clampFocusToImageBounds(
  imgW: number,
  imgH: number,
  aspect: number,
  focus: PhotoFrameFocus,
): PhotoFrameFocus {
  const z = clamp(focus.zoom, 1, 5);
  let cropW: number;
  let cropH: number;
  if (imgW / imgH > aspect) {
    cropH = imgH / z;
    cropW = cropH * aspect;
  } else {
    cropW = imgW / z;
    cropH = cropW / aspect;
  }
  const minX = cropW <= imgW ? cropW / (2 * imgW) : 0.5;
  const maxX = cropW <= imgW ? 1 - cropW / (2 * imgW) : 0.5;
  const minY = cropH <= imgH ? cropH / (2 * imgH) : 0.5;
  const maxY = cropH <= imgH ? 1 - cropH / (2 * imgH) : 0.5;
  return {
    zoom: z,
    x: clamp(focus.x, minX, maxX),
    y: clamp(focus.y, minY, maxY),
  };
}

/** Загрузка для canvas: сначала CORS (чистый экспорт), иначе без crossOrigin (Telegram CDN и др. без ACAO). */
export async function loadImageForCrop(src: string): Promise<HTMLImageElement> {
  const loadOnce = (crossOrigin: '' | 'anonymous') =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      if (crossOrigin) img.crossOrigin = crossOrigin;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('LOAD_FAIL'));
      img.src = src;
    });

  const s = src.trim();
  if (s.startsWith('data:') || s.startsWith('blob:')) {
    const img = await loadOnce('');
    try {
      await img.decode();
    } catch {
      /* ignore */
    }
    return img;
  }

  try {
    const img = await loadOnce('anonymous');
    try {
      await img.decode();
    } catch {
      /* ignore */
    }
    return img;
  } catch {
    const img = await loadOnce('');
    try {
      await img.decode();
    } catch {
      /* ignore */
    }
    return img;
  }
}

/** Обрезка под соотношение сторон (как object-fit: cover + object-position). */
export async function cropImageToAspect(
  src: string,
  aspect: number,
  focus: PhotoFrameFocus = DEFAULT_FOCUS,
  outputWidth = 1280,
): Promise<string> {
  let img: HTMLImageElement;
  try {
    img = await loadImageForCrop(src);
  } catch {
    throw new Error('Не удалось загрузить изображение');
  }
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  if (!W || !H) throw new Error('Пустое изображение');

  const f = clampFocusToImageBounds(W, H, aspect, focus);
  const { sx, sy, cropW, cropH } = computeCropRect(W, H, aspect, f);

  const outH = Math.round(outputWidth / aspect);
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas недоступен');
  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outputWidth, outH);
  try {
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch {
    throw new Error(
      'Браузер не даёт сохранить кадр с этой ссылки (политика сайта фото). Сохраните фото в галерею и загрузите файлом через «Сменить» — тогда кадр применится.',
    );
  }
}

export function isAdjustablePhotoSrc(src: string): boolean {
  const s = src.trim();
  return s.startsWith('data:image/') || s.startsWith('https://') || s.startsWith('http://') || s.startsWith('blob:');
}
