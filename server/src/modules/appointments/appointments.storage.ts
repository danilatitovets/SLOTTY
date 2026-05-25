import { randomUUID } from 'crypto';
import { env } from '../../config/env.js';
import { getSupabaseStorageAdmin } from '../../lib/supabaseStorageAdmin.js';
import { ApiError } from '../../utils/ApiError.js';

const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp']);

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export async function uploadBookingReferencePhoto(
  clientId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const client = getSupabaseStorageAdmin();
  if (!client) {
    throw ApiError.serviceUnavailable(
      'Photo upload is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)',
      'NO_SUPABASE_STORAGE',
    );
  }

  const mime = mimeType.split(';')[0]?.trim().toLowerCase() || '';
  if (!allowedMime.has(mime)) {
    throw ApiError.badRequest('Allowed image types: JPEG, PNG, WebP', 'BAD_IMAGE_TYPE');
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw ApiError.badRequest('Image too large (max 5 MB)', 'IMAGE_TOO_LARGE');
  }

  const bucket = env.SUPABASE_PROFILE_BUCKET.trim() || 'profile';
  const path = `${clientId}/booking-references/${randomUUID()}.${extForMime(mime)}`;

  const { error: upErr } = await client.storage.from(bucket).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (upErr) {
    throw ApiError.internal(`Storage upload failed: ${upErr.message}`, 'STORAGE_UPLOAD');
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw ApiError.internal('Could not build public URL for reference photo', 'STORAGE_PUBLIC_URL');
  }
  return data.publicUrl;
}

export function assertBookingReferencePhotoOwnership(clientId: string, url: string): void {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    throw ApiError.badRequest('Invalid reference photo URL', 'BAD_REFERENCE_PHOTO_URL');
  }
  const marker = `/${clientId}/booking-references/`;
  if (!trimmed.includes(marker)) {
    throw ApiError.badRequest('Reference photo must be uploaded via SLOTTY', 'REFERENCE_PHOTO_OWNERSHIP');
  }
}
