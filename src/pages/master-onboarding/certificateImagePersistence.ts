import {
  certificateLocalUrlToFile,
  isPersistableCertificateImageUrl,
  parseHttpsCertificateImageUrl,
} from '../../features/master-onboarding/model/masterCertificate';

/** Лимит на одно фото в localStorage (черновик). */
const MAX_DRAFT_IMAGE_BYTES = 700_000;
const MAX_EDGE_PX = 1400;

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('read failed'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromFile(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode failed'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('encode failed'));
      },
      type,
      quality,
    );
  });
}

/** Сжимает фото и возвращает data URL для сохранения в черновике. */
export async function fileToCertificateDraftImageUrl(file: File): Promise<string> {
  const img = await loadImageFromFile(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(img, 0, 0, w, h);

  const preferWebp = file.type.includes('webp');
  const qualities = preferWebp ? [0.85, 0.72, 0.58] : [0.88, 0.75, 0.62];
  const types = preferWebp
    ? ['image/webp', 'image/jpeg']
    : file.type.includes('png')
      ? ['image/png', 'image/jpeg']
      : ['image/jpeg'];

  for (const type of types) {
    for (const q of qualities) {
      const blob = await canvasToBlob(canvas, type, q);
      if (blob.size <= MAX_DRAFT_IMAGE_BYTES) {
        return readFileAsDataUrl(blob);
      }
    }
  }

  const fallback = await canvasToBlob(canvas, 'image/jpeg', 0.55);
  return readFileAsDataUrl(fallback);
}

/** https / data — как есть; blob — конвертируем в data URL для черновика. */
export async function resolveCertificateImageForDraft(
  raw: string | undefined,
): Promise<string | undefined> {
  const t = raw?.trim();
  if (!t) return undefined;

  const https = parseHttpsCertificateImageUrl(t);
  if (https) return https;
  if (t.startsWith('http://')) {
    try {
      return new URL(t).toString();
    } catch {
      return undefined;
    }
  }
  if (t.startsWith('data:image/')) return t;
  if (t.startsWith('blob:')) {
    const file = await certificateLocalUrlToFile(t);
    return fileToCertificateDraftImageUrl(file);
  }
  return undefined;
}

export function certificateImageIsPersistableInDraft(url: string | undefined): boolean {
  return isPersistableCertificateImageUrl(url);
}
