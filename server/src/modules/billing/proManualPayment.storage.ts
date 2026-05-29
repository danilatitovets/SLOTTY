import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { getSupabaseStorageAdmin } from '../../lib/supabaseStorageAdmin.js';
import { ApiError } from '../../utils/ApiError.js';

const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'application/pdf') return 'pdf';
  return 'jpg';
}

function bucket(): string {
  const alt = env.SUPABASE_MASTER_MEDIA_BUCKET?.trim();
  if (alt) return alt;
  return env.SUPABASE_PROFILE_BUCKET.trim() || 'profile';
}

export type ProPaymentReceiptUpload = {
  publicUrl: string;
  storagePath: string;
};

export async function uploadProPaymentReceipt(
  masterId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<ProPaymentReceiptUpload> {
  const client = getSupabaseStorageAdmin();
  if (!client) {
    throw ApiError.serviceUnavailable(
      'Загрузка чека недоступна (настройте Supabase Storage на сервере)',
      'NO_SUPABASE_STORAGE',
    );
  }

  const mime = mimeType.split(';')[0]?.trim().toLowerCase() || '';
  if (!allowedMime.has(mime)) {
    throw ApiError.badRequest('Допустимые форматы: JPEG, PNG, WebP, PDF', 'BAD_RECEIPT_TYPE');
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw ApiError.badRequest('Файл слишком большой (макс. 5 МБ)', 'RECEIPT_TOO_LARGE');
  }

  const path = `masters/${masterId}/pro-payment-receipts/${randomUUID()}.${extForMime(mime)}`;
  const { error: upErr } = await client.storage.from(bucket()).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (upErr) {
    throw ApiError.internal('Не удалось загрузить чек', 'STORAGE_UPLOAD');
  }

  const { data } = client.storage.from(bucket()).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw ApiError.internal('Не удалось получить URL чека', 'STORAGE_PUBLIC_URL');
  }

  return { publicUrl: data.publicUrl, storagePath: path };
}
