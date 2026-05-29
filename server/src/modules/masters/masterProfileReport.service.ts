import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { writeAdminAuditLog } from '../platform-admin/auditLog.service.js';
import { sendTelegramMessage } from '../telegram/telegram.service.js';
import { buildMasterPublicProfileUrl } from './categoryChangePolicy.service.js';

export type MasterProfileReportReason =
  | 'fake_profile'
  | 'inappropriate_photos'
  | 'scam'
  | 'spam'
  | 'harassment'
  | 'other';

export type MasterProfileReportStatus = 'pending' | 'in_review' | 'closed' | 'rejected';

export type MasterProfileReportDto = {
  id: string;
  status: MasterProfileReportStatus;
  reasonCode: MasterProfileReportReason;
  reasonText: string | null;
  adminComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type ReportRow = {
  id: string;
  master_id: string;
  reporter_id: string | null;
  reason_code: string;
  reason_text: string | null;
  status: string;
  admin_comment: string | null;
  created_at: Date | string;
  reviewed_at: Date | string | null;
  reviewed_by: string | null;
};

const REASON_LABELS: Record<MasterProfileReportReason, string> = {
  fake_profile: 'Подозрительный или фальшивый профиль',
  inappropriate_photos: 'Неподходящие фото или контент',
  scam: 'Мошенничество или обман',
  spam: 'Спам или реклама',
  harassment: 'Оскорбления или домогательства',
  other: 'Другое',
};

function mapRow(row: ReportRow): MasterProfileReportDto {
  return {
    id: row.id,
    status: row.status as MasterProfileReportStatus,
    reasonCode: row.reason_code as MasterProfileReportReason,
    reasonText: row.reason_text,
    adminComment: row.admin_comment,
    createdAt: new Date(row.created_at).toISOString(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
  };
}

export function masterProfileReportReasonLabel(code: MasterProfileReportReason): string {
  return REASON_LABELS[code] ?? code;
}

async function assertPublishedMaster(masterId: string): Promise<{ displayName: string; slug: string | null }> {
  const r = await query<{ display_name: string; slug: string | null; publication_status: string }>(
    `select display_name, slug, publication_status::text
       from public.master_profiles
      where master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row || row.publication_status !== 'published') {
    throw ApiError.notFound('Master not found');
  }
  return { displayName: row.display_name, slug: row.slug };
}

async function notifyAdminAboutProfileReport(params: {
  masterName: string;
  profileUrl: string;
  reasonLabel: string;
  reasonText: string | null;
  reporterName: string | null;
}): Promise<void> {
  const chatId = env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (!chatId) return;

  const lines = [
    'Жалоба на профиль мастера',
    '',
    `Мастер: ${params.masterName}`,
    `Профиль: ${params.profileUrl}`,
    `Причина: ${params.reasonLabel}`,
  ];
  if (params.reporterName) lines.push(`От: ${params.reporterName}`);
  if (params.reasonText?.trim()) {
    lines.push('', 'Комментарий:', params.reasonText.trim());
  }

  await sendTelegramMessage({ telegramUserId: chatId, text: lines.join('\n') });
}

export async function createMasterProfileReport(
  masterId: string,
  reporterId: string,
  body: { reasonCode: MasterProfileReportReason; reasonText?: string | null },
): Promise<MasterProfileReportDto> {
  if (masterId === reporterId) {
    throw ApiError.badRequest('Нельзя пожаловаться на свой профиль', 'SELF_REPORT');
  }

  const meta = await assertPublishedMaster(masterId);
  const reasonText = body.reasonText?.trim() || null;

  if (body.reasonCode === 'other' && (!reasonText || reasonText.length < 5)) {
    throw ApiError.badRequest('Опишите причину не короче 5 символов', 'validation_error');
  }
  if (reasonText && reasonText.length > 2000) {
    throw ApiError.badRequest('Слишком длинный комментарий', 'validation_error');
  }

  const recent = await query<{ ok: number }>(
    `select 1 as ok
       from public.master_profile_reports
      where master_id = $1
        and reporter_id = $2
        and status in ('pending', 'in_review')
        and created_at > now() - interval '24 hours'
      limit 1`,
    [masterId, reporterId],
  );
  if ((recent.rowCount ?? 0) > 0) {
    throw ApiError.badRequest('Вы уже отправляли жалобу на этот профиль. Дождитесь рассмотрения.', 'active_report_exists');
  }

  const ins = await query<ReportRow>(
    `insert into public.master_profile_reports (
       master_id, reporter_id, reason_code, reason_text, status
     ) values ($1, $2, $3, $4, 'pending')
     returning id, master_id, reporter_id, reason_code, reason_text, status,
               admin_comment, created_at, reviewed_at, reviewed_by`,
    [masterId, reporterId, body.reasonCode, reasonText],
  );
  const row = ins.rows[0]!;

  const reporterR = await query<{ full_name: string | null }>(
    `select full_name from public.profiles where id = $1`,
    [reporterId],
  );
  const reporterName = reporterR.rows[0]?.full_name?.trim() || null;

  void notifyAdminAboutProfileReport({
    masterName: meta.displayName,
    profileUrl: buildMasterPublicProfileUrl(masterId, meta.slug),
    reasonLabel: masterProfileReportReasonLabel(body.reasonCode),
    reasonText,
    reporterName,
  });

  return mapRow(row);
}

export type MasterProfileReportAdminRow = MasterProfileReportDto & {
  masterId: string;
  masterName: string;
  profileUrl: string;
  reporterId: string | null;
  reporterName: string | null;
};

export async function listMasterProfileReportsForAdmin(
  status: 'all' | MasterProfileReportStatus = 'pending',
  params?: { limit?: number; offset?: number },
): Promise<{
  reports: MasterProfileReportAdminRow[];
  total: number;
  limit: number;
  offset: number;
}> {
  const conditions: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (status !== 'all') {
    conditions.push(`r.status = $${i++}`);
    vals.push(status);
  }
  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const limit = Math.min(params?.limit ?? 50, 100);
  const offset = params?.offset ?? 0;

  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.master_profile_reports r ${where}`,
    vals,
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const listR = await query<
    ReportRow & { display_name: string; slug: string | null; reporter_name: string | null }
  >(
    `select r.id, r.master_id, r.reporter_id, r.reason_code, r.reason_text, r.status,
            r.admin_comment, r.created_at, r.reviewed_at, r.reviewed_by,
            mp.display_name, mp.slug, p.full_name as reporter_name
       from public.master_profile_reports r
       join public.master_profiles mp on mp.master_id = r.master_id
       left join public.profiles p on p.id = r.reporter_id
      ${where}
      order by r.created_at desc
      limit $${i++} offset $${i++}`,
    [...vals, limit, offset],
  );

  const reports: MasterProfileReportAdminRow[] = listR.rows.map((row) => ({
    ...mapRow(row),
    masterId: row.master_id,
    masterName: row.display_name,
    profileUrl: buildMasterPublicProfileUrl(row.master_id, row.slug),
    reporterId: row.reporter_id,
    reporterName: row.reporter_name?.trim() || null,
  }));

  return { reports, total, limit, offset };
}

export async function updateMasterProfileReportStatus(
  reportId: string,
  adminUserId: string,
  params: { status: MasterProfileReportStatus; adminComment?: string | null },
): Promise<void> {
  if (params.status === 'pending') {
    throw ApiError.badRequest('Недопустимый статус', 'validation_error');
  }

  const r = await query<ReportRow & { display_name: string; master_id: string }>(
    `select r.id, r.master_id, r.reporter_id, r.reason_code, r.reason_text, r.status,
            r.admin_comment, r.created_at, r.reviewed_at, r.reviewed_by,
            mp.display_name
       from public.master_profile_reports r
       join public.master_profiles mp on mp.master_id = r.master_id
      where r.id = $1`,
    [reportId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Report not found');
  if (row.status !== 'pending' && row.status !== 'in_review') {
    throw ApiError.badRequest('Жалоба уже обработана', 'BAD_STATUS');
  }

  const comment = params.adminComment?.trim();
  if (params.status === 'rejected' || params.status === 'closed') {
    if (!comment || comment.length < 5) {
      throw ApiError.badRequest('Укажите комментарий для админки — не короче 5 символов', 'validation_error');
    }
  }

  await query(
    `update public.master_profile_reports
        set status = $2,
            admin_comment = coalesce($3, admin_comment),
            reviewed_at = now(),
            reviewed_by = $4,
            updated_at = now()
      where id = $1`,
    [reportId, params.status, comment || null, adminUserId],
  );

  await writeAdminAuditLog({
    adminUserId,
    action: `master_profile_report_${params.status}`,
    entityType: 'master_profile_report',
    entityId: reportId,
    targetUserId: row.master_id,
    reason: comment || null,
    metadata: {
      masterName: row.display_name,
      reasonCode: row.reason_code,
      reporterId: row.reporter_id,
    },
  });
}
