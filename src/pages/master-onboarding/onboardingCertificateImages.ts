import { updateCertificate } from '../../features/admin/api/adminProfileApi';
import { uploadMasterCertificateImageFile } from '../../features/admin/api/masterCabinetApi';
import type { MasterCertificate } from '../../features/master-onboarding/model/masterCertificate';
import {
  certificateLocalUrlToFile,
  isLocalCertificateImageUrl,
  parseHttpsCertificateImageUrl,
} from '../../features/master-onboarding/model/masterCertificate';

type OnboardingCertRow = {
  id: string;
  sortOrder?: number;
};

function httpsOrHttpImageUrl(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (t.startsWith('https://') || t.startsWith('http://')) {
    try {
      return new URL(t).toString();
    } catch {
      return null;
    }
  }
  const https = parseHttpsCertificateImageUrl(t);
  return https ?? null;
}

/** Подготовка payload для POST /onboarding (локальные фото — без URL, догрузим после). */
export function buildOnboardingCertificatePayload(
  certificates: MasterCertificate[],
): {
  payload: Array<{
    title: string;
    issuer: string | null;
    year: number | null;
    description: string | null;
    imageUrl: string | null;
    sortOrder: number;
  }>;
  pendingLocalBySortOrder: Map<number, string>;
} {
  const pendingLocalBySortOrder = new Map<number, string>();
  const payload = certificates
    .map((c, sortOrder) => {
      const raw = c.imageUrl?.trim();
      if (raw && isLocalCertificateImageUrl(raw)) {
        pendingLocalBySortOrder.set(sortOrder, raw);
      }
      return {
        title: c.title.trim(),
        issuer: c.organization.trim() || null,
        year: c.year ? Number.parseInt(String(c.year), 10) : null,
        description: c.description?.trim().slice(0, 1000) || null,
        imageUrl: httpsOrHttpImageUrl(c.imageUrl),
        sortOrder,
      };
    })
    .filter((c) => c.title.length >= 2);

  return { payload, pendingLocalBySortOrder };
}

/** После онбординга: загрузить blob/data и пропатчить сертификаты по sortOrder. */
export async function uploadPendingOnboardingCertificatePhotos(
  created: OnboardingCertRow[],
  pendingLocalBySortOrder: Map<number, string>,
): Promise<void> {
  if (pendingLocalBySortOrder.size === 0) return;

  const sorted = [...created].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  for (const [sortOrder, localUrl] of pendingLocalBySortOrder) {
    const row = sorted[sortOrder];
    if (!row?.id) continue;
    const file = await certificateLocalUrlToFile(localUrl);
    const imageUrl = await uploadMasterCertificateImageFile(file);
    await updateCertificate(row.id, { imageUrl });
  }
}
