import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { normalizeBelarusPhone, isOptionalBelarusPhoneValid } from '../../utils/belarusPhone.js';
import { writeAdminAuditLog } from '../platform-admin/auditLog.service.js';
import { sendTelegramMessage } from '../telegram/telegram.service.js';
import { buildMasterPublicProfileUrl } from '../masters/categoryChangePolicy.service.js';

export type SponsorRequestStatus = 'pending' | 'in_review' | 'closed' | 'rejected';

export type SponsorRequestDto = {
  id: string;
  status: SponsorRequestStatus;
  contactName: string;
  phone: string;
  email: string | null;
  companyName: string | null;
  city: string | null;
  message: string;
  adminComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type RequestRow = {
  id: string;
  master_id: string;
  contact_name: string;
  phone: string;
  email: string | null;
  company_name: string | null;
  city: string | null;
  message: string;
  status: string;
  admin_comment: string | null;
  created_at: Date | string;
  reviewed_at: Date | string | null;
  reviewed_by: string | null;
};

function mapRow(row: RequestRow): SponsorRequestDto {
  return {
    id: row.id,
    status: row.status as SponsorRequestStatus,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    companyName: row.company_name,
    city: row.city,
    message: row.message,
    adminComment: row.admin_comment,
    createdAt: new Date(row.created_at).toISOString(),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
  };
}

async function getMasterMeta(masterId: string) {
  const r = await query<{ display_name: string; slug: string | null }>(
    `select display_name, slug from public.master_profiles where master_id = $1`,
    [masterId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Master profile not found');
  return row;
}

export async function getActiveSponsorRequestForMaster(
  masterId: string,
): Promise<{ hasActiveRequest: boolean; request: SponsorRequestDto | null }> {
  const r = await query<RequestRow>(
    `select id, master_id, contact_name, phone, email, company_name, city, message, status,
            admin_comment, created_at, reviewed_at, reviewed_by
       from public.sponsor_requests
      where master_id = $1 and status in ('pending', 'in_review')
      order by created_at desc
      limit 1`,
    [masterId],
  );
  const row = r.rows[0];
  return { hasActiveRequest: Boolean(row), request: row ? mapRow(row) : null };
}

export type SponsorRequestCabinetState = {
  activeRequest: SponsorRequestDto | null;
  lastResolvedRequest: SponsorRequestDto | null;
  canSubmitNew: boolean;
};

export async function getSponsorRequestCabinetState(
  masterId: string,
): Promise<SponsorRequestCabinetState> {
  const active = await getActiveSponsorRequestForMaster(masterId);
  if (active.request) {
    return { activeRequest: active.request, lastResolvedRequest: null, canSubmitNew: false };
  }

  const resolvedR = await query<RequestRow>(
    `select id, master_id, contact_name, phone, email, company_name, city, message, status,
            admin_comment, created_at, reviewed_at, reviewed_by
       from public.sponsor_requests
      where master_id = $1 and status in ('closed', 'rejected')
      order by coalesce(reviewed_at, created_at) desc
      limit 1`,
    [masterId],
  );
  const resolved = resolvedR.rows[0] ? mapRow(resolvedR.rows[0]) : null;
  return {
    activeRequest: null,
    lastResolvedRequest: resolved,
    canSubmitNew: true,
  };
}

async function getMasterTelegramUserId(masterId: string): Promise<string | null> {
  const r = await query<{ telegram_user_id: string | null }>(
    `select telegram_user_id::text from public.profiles where id = $1`,
    [masterId],
  );
  const id = r.rows[0]?.telegram_user_id?.trim();
  return id || null;
}

async function notifyMasterAboutSponsorResolution(params: {
  masterId: string;
  status: 'closed' | 'rejected';
  adminComment: string;
}): Promise<void> {
  const chatId = await getMasterTelegramUserId(params.masterId);
  if (!chatId) return;

  const heading =
    params.status === 'closed'
      ? 'Ответ команды SLOTTY по заявке «Стать спонсором»'
      : 'Заявка «Стать спонсором SLOTTY» отклонена';

  await sendTelegramMessage({
    telegramUserId: chatId,
    text: [heading, '', params.adminComment, '', 'Подробности — в кабинете: Настройки → Спонсор SLOTTY.'].join(
      '\n',
    ),
  });
}

export async function createSponsorRequest(
  masterId: string,
  body: {
    contactName: string;
    phone: string;
    email?: string | null;
    companyName?: string | null;
    city?: string | null;
    message: string;
  },
): Promise<SponsorRequestDto> {
  const active = await getActiveSponsorRequestForMaster(masterId);
  if (active.hasActiveRequest) {
    throw ApiError.badRequest('У вас уже есть активная заявка', 'active_sponsor_request_exists');
  }

  const contactName = body.contactName.trim();
  if (contactName.length < 2) {
    throw ApiError.badRequest('Укажите имя или название', 'validation_error');
  }

  const phoneRaw = body.phone.trim();
  if (!isOptionalBelarusPhoneValid(phoneRaw) || !phoneRaw) {
    throw ApiError.badRequest('Укажите корректный мобильный номер РБ', 'validation_error');
  }
  const phone = normalizeBelarusPhone(phoneRaw);
  if (!phone) {
    throw ApiError.badRequest('Укажите корректный мобильный номер РБ', 'validation_error');
  }

  const message = body.message.trim();
  if (message.length < 10) {
    throw ApiError.badRequest('Расскажите о себе не короче 10 символов', 'validation_error');
  }

  const email = body.email?.trim() || null;
  if (email && !email.includes('@')) {
    throw ApiError.badRequest('Некорректный email', 'validation_error');
  }

  const companyName = body.companyName?.trim() || null;
  const city = body.city?.trim() || null;

  const ins = await query<RequestRow>(
    `insert into public.sponsor_requests (
       master_id, contact_name, phone, email, company_name, city, message, status
     ) values ($1, $2, $3, $4, $5, $6, $7, 'pending')
     returning id, master_id, contact_name, phone, email, company_name, city, message, status,
               admin_comment, created_at, reviewed_at, reviewed_by`,
    [masterId, contactName, phone, email, companyName, city, message],
  );
  const row = ins.rows[0]!;
  const mapped = mapRow(row);

  const meta = await getMasterMeta(masterId);
  const profileUrl = buildMasterPublicProfileUrl(masterId, meta.slug);

  void notifyAdminAboutSponsorRequest({
    masterName: meta.display_name,
    profileUrl,
    contactName,
    phone,
    email,
    companyName,
    city,
    message,
  });

  return mapped;
}

async function notifyAdminAboutSponsorRequest(params: {
  masterName: string;
  profileUrl: string;
  contactName: string;
  phone: string;
  email: string | null;
  companyName: string | null;
  city: string | null;
  message: string;
}): Promise<void> {
  const chatId = env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (!chatId) return;

  const lines = [
    'Новая заявка: стать спонсором SLOTTY',
    '',
    `Мастер: ${params.masterName}`,
    `Профиль: ${params.profileUrl}`,
    '',
    `Контакт: ${params.contactName}`,
    `Телефон: ${params.phone}`,
  ];
  if (params.email) lines.push(`Email: ${params.email}`);
  if (params.companyName) lines.push(`Компания: ${params.companyName}`);
  if (params.city) lines.push(`Город: ${params.city}`);
  lines.push('', 'Сообщение:', params.message);

  await sendTelegramMessage({ telegramUserId: chatId, text: lines.join('\n') });
}

export type SponsorRequestAdminRow = SponsorRequestDto & {
  masterId: string;
  masterName: string;
  profileUrl: string;
};

export async function listSponsorRequestsForAdmin(
  status: 'all' | SponsorRequestStatus = 'pending',
  params?: { limit?: number; offset?: number },
): Promise<{
  requests: SponsorRequestAdminRow[];
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
    `select count(*)::text as total from public.sponsor_requests r ${where}`,
    vals,
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const listR = await query<
    RequestRow & { display_name: string; slug: string | null }
  >(
    `select r.id, r.master_id, r.contact_name, r.phone, r.email, r.company_name, r.city, r.message,
            r.status, r.admin_comment, r.created_at, r.reviewed_at, r.reviewed_by,
            mp.display_name, mp.slug
       from public.sponsor_requests r
       join public.master_profiles mp on mp.master_id = r.master_id
      ${where}
      order by r.created_at desc
      limit $${i++} offset $${i++}`,
    [...vals, limit, offset],
  );

  const requests: SponsorRequestAdminRow[] = listR.rows.map((row) => ({
    ...mapRow(row),
    masterId: row.master_id,
    masterName: row.display_name,
    profileUrl: buildMasterPublicProfileUrl(row.master_id, row.slug),
  }));

  return { requests, total, limit, offset };
}

export async function updateSponsorRequestStatus(
  requestId: string,
  adminUserId: string,
  params: { status: SponsorRequestStatus; adminComment?: string | null },
): Promise<void> {
  if (params.status === 'pending') {
    throw ApiError.badRequest('Недопустимый статус', 'validation_error');
  }

  const r = await query<RequestRow & { display_name: string }>(
    `select r.id, r.master_id, r.contact_name, r.phone, r.email, r.company_name, r.city, r.message,
            r.status, r.admin_comment, r.created_at, r.reviewed_at, r.reviewed_by,
            mp.display_name
       from public.sponsor_requests r
       join public.master_profiles mp on mp.master_id = r.master_id
      where r.id = $1`,
    [requestId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Request not found');
  if (row.status !== 'pending' && row.status !== 'in_review') {
    throw ApiError.badRequest('Заявка уже обработана', 'BAD_STATUS');
  }

  const comment = params.adminComment?.trim();
  if (params.status === 'rejected' || params.status === 'closed') {
    if (!comment || comment.length < 5) {
      throw ApiError.badRequest(
        params.status === 'closed'
          ? 'Напишите сообщение для мастера — не короче 5 символов'
          : 'Укажите причину отклонения',
        'validation_error',
      );
    }
  }

  await query(
    `update public.sponsor_requests
        set status = $2,
            admin_comment = coalesce($3, admin_comment),
            reviewed_at = now(),
            reviewed_by = $4,
            updated_at = now()
      where id = $1`,
    [requestId, params.status, comment || null, adminUserId],
  );

  if (params.status === 'closed' || params.status === 'rejected') {
    void notifyMasterAboutSponsorResolution({
      masterId: row.master_id,
      status: params.status,
      adminComment: comment!,
    });
  }

  await writeAdminAuditLog({
    adminUserId,
    action: `sponsor_request_${params.status}`,
    entityType: 'sponsor_request',
    entityId: requestId,
    targetUserId: row.master_id,
    reason: params.adminComment?.trim() || null,
    metadata: {
      masterName: row.display_name,
      contactName: row.contact_name,
      phone: row.phone,
    },
  });
}
