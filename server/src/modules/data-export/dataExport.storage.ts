import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { getSupabaseStorageAdmin } from '../../lib/supabaseStorageAdmin.js';
import { ApiError } from '../../utils/ApiError.js';

function bucket(): string {
  const alt = env.SUPABASE_MASTER_MEDIA_BUCKET?.trim();
  if (alt) return alt;
  return env.SUPABASE_PROFILE_BUCKET.trim() || 'profile';
}

export function buildDataExportStoragePath(masterId: string, jobId: string): string {
  return `data-exports/${masterId}/${jobId}.zip`;
}

export async function uploadDataExportArchive(
  masterId: string,
  jobId: string,
  buffer: Buffer,
): Promise<{ storagePath: string }> {
  const client = getSupabaseStorageAdmin();
  if (!client) {
    throw ApiError.serviceUnavailable(
      'Экспорт недоступен (настройте Supabase Storage на сервере)',
      'NO_SUPABASE_STORAGE',
    );
  }

  const path = buildDataExportStoragePath(masterId, jobId);
  const { error } = await client.storage.from(bucket()).upload(path, buffer, {
    contentType: 'application/zip',
    upsert: true,
  });
  if (error) {
    throw ApiError.internal(`Не удалось сохранить архив: ${error.message}`, 'STORAGE_UPLOAD');
  }
  return { storagePath: path };
}

export async function downloadDataExportArchive(storagePath: string): Promise<Buffer> {
  const client = getSupabaseStorageAdmin();
  if (!client) {
    throw ApiError.serviceUnavailable('Storage недоступен', 'NO_SUPABASE_STORAGE');
  }
  const { data, error } = await client.storage.from(bucket()).download(storagePath);
  if (error || !data) {
    throw ApiError.notFound('Архив не найден', 'EXPORT_NOT_FOUND');
  }
  const arr = await data.arrayBuffer();
  return Buffer.from(arr);
}

export function buildExportDownloadFilename(jobId: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `slotty-master-export-${stamp}-${jobId.slice(0, 8)}.zip`;
}

export function newExportJobId(): string {
  return randomUUID();
}
