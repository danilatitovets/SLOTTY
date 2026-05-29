/**
 * Сертификаты / курсы в анкете мастера (шаг онбординга).
 * В API и БД поле организации передаётся как `issuer`.
 */

export type MasterCertificate = {
  id: string;
  title: string;
  organization: string;
  year?: string;
  description?: string;
  /** Локальный blob: URL или https-ссылка на фото */
  imageUrl?: string;
};

/** Форма добавления/редактирования (локальное состояние экрана). */
export type CertificateFormState = {
  title: string;
  organization: string;
  year: string;
  description: string;
  imageBlobUrl?: string;
  imageFileLabel?: string;
  externalPhotoUrl: string;
};

export const emptyCertificateFormState = (): CertificateFormState => ({
  title: '',
  organization: '',
  year: '',
  description: '',
  externalPhotoUrl: '',
});

/** Допустимая ссылка на фото для сохранения на сервере (только https). */
export function parseHttpsCertificateImageUrl(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  try {
    const u = new URL(t);
    if (u.protocol !== 'https:') return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

export function isLocalCertificateImageUrl(url: string | undefined): boolean {
  const t = url?.trim();
  if (!t) return false;
  return t.startsWith('blob:') || t.startsWith('data:image/');
}

export function isPersistableCertificateImageUrl(url: string | undefined): boolean {
  const t = url?.trim();
  if (!t) return false;
  if (t.startsWith('blob:')) return false;
  return t.startsWith('https:') || t.startsWith('http:') || t.startsWith('data:image/');
}

export async function certificateLocalUrlToFile(url: string): Promise<File> {
  const blob = await fetch(url).then((r) => r.blob());
  const type = blob.type || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  return new File([blob], `certificate.${ext}`, { type });
}
