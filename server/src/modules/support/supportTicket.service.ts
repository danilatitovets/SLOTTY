import { randomBytes } from 'node:crypto';
import { query, withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { writeAdminAuditLog } from '../platform-admin/auditLog.service.js';
import type {
  CreateSupportTicketInput,
  SupportAffectedService,
  SupportCategory,
  SupportContactChannel,
  SupportSeverity,
  SupportSystemStatus,
  SupportTicketAttachmentDto,
  SupportTicketDetailDto,
  SupportTicketDto,
  SupportTicketEventDto,
  SupportTicketStatus,
} from './supportTicket.types.js';
import { normalizeBookingCode } from './supportTicket.validation.js';
import {
  notifyAdminsSupportTicketCreated,
  notifyAdminsSupportUserReply,
  notifyMasterSupportAdminReply,
  notifyMasterSupportStatusChanged,
} from './supportTicket.notifications.js';

type TicketRow = {
  id: string;
  ticket_code: string;
  user_id: string;
  master_profile_id: string | null;
  plan: string | null;
  category: string;
  severity: string;
  subject: string;
  affected_services: unknown;
  related_booking_code: string | null;
  related_payment_id: string | null;
  message: string;
  preferred_contact_channel: string;
  contact_email: string | null;
  contact_telegram: string | null;
  status: string;
  source: string;
  assigned_to: string | null;
  metadata: unknown;
  created_at: Date | string;
  updated_at: Date | string;
};

type EventRow = {
  id: string;
  event_type: string;
  actor_user_id: string | null;
  actor_role: string;
  message: string | null;
  metadata: unknown;
  created_at: Date | string;
};

type AttachmentRow = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: Date | string;
};

function parseAffectedServices(raw: unknown): SupportAffectedService[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is SupportAffectedService => typeof x === 'string');
}

function mapTicket(row: TicketRow): SupportTicketDto {
  return {
    id: row.id,
    ticketCode: row.ticket_code,
    userId: row.user_id,
    masterProfileId: row.master_profile_id,
    plan: row.plan,
    category: row.category as SupportCategory,
    severity: row.severity as SupportSeverity,
    subject: row.subject,
    affectedServices: parseAffectedServices(row.affected_services),
    relatedBookingCode: row.related_booking_code,
    relatedPaymentId: row.related_payment_id,
    message: row.message,
    preferredContactChannel: row.preferred_contact_channel as SupportContactChannel,
    contactEmail: row.contact_email,
    contactTelegram: row.contact_telegram,
    status: row.status as SupportTicketStatus,
    source: row.source,
    assignedTo: row.assigned_to,
    metadata: (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, unknown>,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapEvent(row: EventRow): SupportTicketEventDto {
  return {
    id: row.id,
    eventType: row.event_type,
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role,
    message: row.message,
    metadata: (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, unknown>,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapAttachment(row: AttachmentRow): SupportTicketAttachmentDto {
  return {
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function generateTicketCode(): string {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `SUP-${day}-${suffix}`;
}

/** Статус платформы для hub поддержки (Status Center). */
export async function getSupportSystemStatus(): Promise<{
  status: SupportSystemStatus;
  label: string;
  static: boolean;
  checkedAt: string;
  affectedCount?: number;
}> {
  try {
    const { getSupportStatusSummary } = await import('../system-status/systemStatus.service.js');
    const s = await getSupportStatusSummary();
    return {
      status: s.status,
      label: s.label,
      static: s.static,
      checkedAt: s.checkedAt,
      affectedCount: s.affectedCount,
    };
  } catch {
    return {
      status: 'operational',
      label: 'Все системы работают',
      static: true,
      checkedAt: new Date().toISOString(),
    };
  }
}

async function getMasterContext(userId: string) {
  const r = await query<{
    display_name: string;
    plan_code: string | null;
    subscription_status: string | null;
    email: string | null;
    telegram_user_id: string | null;
    has_google: boolean;
    has_email_auth: boolean;
    has_telegram_auth: boolean;
  }>(
    `select mp.display_name,
            sp.code as plan_code,
            ms.status::text as subscription_status,
            (select ai.email from public.auth_identities ai
              where ai.profile_id = p.id and ai.provider = 'email' and ai.email is not null
              limit 1) as email,
            p.telegram_user_id::text,
            exists(select 1 from public.auth_identities ai where ai.profile_id = p.id and ai.provider = 'google') as has_google,
            exists(select 1 from public.auth_identities ai where ai.profile_id = p.id and ai.provider = 'email') as has_email_auth,
            exists(select 1 from public.auth_identities ai where ai.profile_id = p.id and ai.provider = 'telegram') as has_telegram_auth
       from public.profiles p
       left join public.master_profiles mp on mp.master_id = p.id
       left join public.master_subscriptions ms on ms.master_id = p.id
       left join public.subscription_plans sp on sp.id = ms.plan_id
      where p.id = $1`,
    [userId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Profile not found');
  return row;
}

function buildServerMetadata(
  userId: string,
  clientMetadata?: Record<string, unknown>,
): Record<string, unknown> {
  const safeClient = clientMetadata ? { ...clientMetadata } : {};
  delete safeClient.token;
  delete safeClient.jwt;
  delete safeClient.password;
  delete safeClient.cardNumber;

  return {
    ...safeClient,
    userId,
    webAppUrl: env.WEB_APP_URL ?? null,
    appEnv: env.NODE_ENV,
    collectedAt: new Date().toISOString(),
  };
}

export async function createSupportTicket(
  userId: string,
  input: CreateSupportTicketInput,
): Promise<SupportTicketDetailDto> {
  const ctx = await getMasterContext(userId);
  const bookingCode = normalizeBookingCode(input.relatedBookingCode);
  if (input.relatedBookingCode?.trim() && !bookingCode) {
    throw ApiError.badRequest('Некорректный код записи (ожидается SL-...)', 'validation_error');
  }

  const contactEmail = input.contactEmail?.trim() || ctx.email;
  const contactTelegram = ctx.telegram_user_id;
  const planLabel = ctx.plan_code === 'pro' ? 'Master Pro' : 'Free';
  const metadata = buildServerMetadata(userId, input.clientMetadata);
  metadata.masterProfileId = userId;
  metadata.masterDisplayName = ctx.display_name;
  metadata.plan = planLabel;
  metadata.subscriptionStatus = ctx.subscription_status;
  metadata.linkedProviders = {
    telegram: ctx.has_telegram_auth,
    google: ctx.has_google,
    email: ctx.has_email_auth,
  };

  let attempts = 0;
  while (attempts < 5) {
    attempts += 1;
    const ticketCode = generateTicketCode();
    try {
      const detail = await withTransaction(async (client) => {
        const ins = await client.query<TicketRow>(
          `insert into public.support_tickets (
             ticket_code, user_id, master_profile_id, plan, category, severity, subject,
             affected_services, related_booking_code, related_payment_id, message,
             preferred_contact_channel, contact_email, contact_telegram, status, source, metadata
           ) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,'OPEN','master_settings',$15::jsonb)
           returning *`,
          [
            ticketCode,
            userId,
            userId,
            planLabel,
            input.category,
            input.severity,
            input.subject,
            JSON.stringify(input.affectedServices),
            bookingCode,
            input.relatedPaymentId?.trim() || null,
            input.message,
            input.preferredContactChannel,
            contactEmail,
            contactTelegram,
            JSON.stringify(metadata),
          ],
        );
        const ticket = ins.rows[0]!;
        await client.query(
          `insert into public.support_ticket_events (
             ticket_id, event_type, actor_user_id, actor_role, message, metadata
           ) values ($1, 'CREATED', $2, 'user', $3, $4::jsonb)`,
          [
            ticket.id,
            userId,
            input.message,
            JSON.stringify({ severity: input.severity, category: input.category }),
          ],
        );
        return ticket;
      });

      const created = await getSupportTicketForUser(userId, detail.ticket_code, true);
      void notifyAdminsSupportTicketCreated({
        ticketId: created.id,
        ticketCode: created.ticketCode,
        subject: created.subject,
        severity: created.severity,
        category: created.category,
        userId,
      });
      return created;
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === '23505' && attempts < 5) continue;
      throw e;
    }
  }
  throw ApiError.internal('Не удалось создать обращение');
}

const TICKET_SELECT = `select id, ticket_code, user_id, master_profile_id, plan, category, severity, subject,
       affected_services, related_booking_code, related_payment_id, message,
       preferred_contact_channel, contact_email, contact_telegram, status, source,
       assigned_to, metadata, created_at, updated_at`;

async function loadEvents(ticketId: string): Promise<SupportTicketEventDto[]> {
  const r = await query<EventRow>(
    `select id, event_type, actor_user_id, actor_role, message, metadata, created_at
       from public.support_ticket_events
      where ticket_id = $1
      order by created_at asc`,
    [ticketId],
  );
  return r.rows.map(mapEvent);
}

async function loadAttachments(ticketId: string): Promise<SupportTicketAttachmentDto[]> {
  const r = await query<AttachmentRow>(
    `select id, file_name, mime_type, size_bytes, created_at
       from public.support_ticket_attachments
      where ticket_id = $1
      order by created_at asc`,
    [ticketId],
  );
  return r.rows.map(mapAttachment);
}

export async function listSupportTicketsForUser(
  userId: string,
  params?: { limit?: number; offset?: number },
): Promise<{ tickets: SupportTicketDto[]; total: number; limit: number; offset: number }> {
  const limit = Math.min(params?.limit ?? 20, 50);
  const offset = params?.offset ?? 0;
  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.support_tickets where user_id = $1`,
    [userId],
  );
  const total = Number(countR.rows[0]?.total ?? 0);
  const listR = await query<TicketRow>(
    `${TICKET_SELECT} from public.support_tickets where user_id = $1 order by created_at desc limit $2 offset $3`,
    [userId, limit, offset],
  );
  return {
    tickets: listR.rows.map(mapTicket),
    total,
    limit,
    offset,
  };
}

export async function getSupportTicketForUser(
  userId: string,
  ticketCode: string,
  isAdmin = false,
): Promise<SupportTicketDetailDto> {
  const r = await query<TicketRow>(
    `${TICKET_SELECT} from public.support_tickets where ticket_code = $1${isAdmin ? '' : ' and user_id = $2'}`,
    isAdmin ? [ticketCode] : [ticketCode, userId],
  );
  const row = r.rows[0];
  if (!row) throw ApiError.notFound('Обращение не найдено');
  return {
    ...mapTicket(row),
    events: await loadEvents(row.id),
    attachments: await loadAttachments(row.id),
  };
}

export async function replyToSupportTicketAsUser(
  userId: string,
  ticketCode: string,
  message: string,
): Promise<SupportTicketDetailDto> {
  const ticketR = await query<{ id: string; status: string }>(
    `select id, status from public.support_tickets where ticket_code = $1 and user_id = $2`,
    [ticketCode, userId],
  );
  const ticket = ticketR.rows[0];
  if (!ticket) throw ApiError.notFound('Обращение не найдено');
  if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
    throw ApiError.badRequest('Обращение закрыто', 'ticket_closed');
  }

  const metaR = await query<{ subject: string; assigned_to: string | null }>(
    `select subject, assigned_to from public.support_tickets where id = $1`,
    [ticket.id],
  );
  const meta = metaR.rows[0]!;

  await withTransaction(async (client) => {
    await client.query(
      `insert into public.support_ticket_events (
         ticket_id, event_type, actor_user_id, actor_role, message
       ) values ($1, 'REPLY', $2, 'user', $3)`,
      [ticket.id, userId, message],
    );
    await client.query(
      `update public.support_tickets set status = 'OPEN', updated_at = now() where id = $1 and status = 'WAITING_USER'`,
      [ticket.id],
    );
    await client.query(`update public.support_tickets set updated_at = now() where id = $1`, [ticket.id]);
  });

  void notifyAdminsSupportUserReply({
    ticketId: ticket.id,
    ticketCode,
    subject: meta.subject,
    assignedTo: meta.assigned_to,
    messagePreview: message,
  });

  return getSupportTicketForUser(userId, ticketCode);
}

export type SupportTicketAdminRow = SupportTicketDto & {
  masterName: string | null;
  userEmail: string | null;
};

export async function listSupportTicketsForAdmin(params: {
  status?: SupportTicketStatus | 'all' | 'unresolved';
  severity?: SupportSeverity | 'all';
  category?: SupportCategory | 'all';
  plan?: string | 'all';
  assignedTo?: string | 'all' | 'unassigned';
  limit?: number;
  offset?: number;
}): Promise<{ tickets: SupportTicketAdminRow[]; total: number; limit: number; offset: number }> {
  const conditions: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  if (params.status === 'unresolved') {
    conditions.push(`t.status in ('OPEN', 'IN_PROGRESS', 'WAITING_USER')`);
  } else if (params.status && params.status !== 'all') {
    conditions.push(`t.status = $${i++}`);
    vals.push(params.status);
  }
  if (params.severity && params.severity !== 'all') {
    conditions.push(`t.severity = $${i++}`);
    vals.push(params.severity);
  }
  if (params.category && params.category !== 'all') {
    conditions.push(`t.category = $${i++}`);
    vals.push(params.category);
  }
  if (params.plan && params.plan !== 'all') {
    conditions.push(`t.plan = $${i++}`);
    vals.push(params.plan);
  }
  if (params.assignedTo === 'unassigned') {
    conditions.push(`t.assigned_to is null`);
  } else if (params.assignedTo && params.assignedTo !== 'all') {
    conditions.push(`t.assigned_to = $${i++}`);
    vals.push(params.assignedTo);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  const limit = Math.min(params.limit ?? 50, 100);
  const offset = params.offset ?? 0;

  const countR = await query<{ total: string }>(
    `select count(*)::text as total from public.support_tickets t ${where}`,
    vals,
  );
  const total = Number(countR.rows[0]?.total ?? 0);

  const listR = await query<TicketRow & { display_name: string | null; user_email: string | null }>(
    `select t.id, t.ticket_code, t.user_id, t.master_profile_id, t.plan, t.category, t.severity, t.subject,
            t.affected_services, t.related_booking_code, t.related_payment_id, t.message,
            t.preferred_contact_channel, t.contact_email, t.contact_telegram, t.status, t.source,
            t.assigned_to, t.metadata, t.created_at, t.updated_at,
            mp.display_name,
            (select ai.email from public.auth_identities ai
              where ai.profile_id = t.user_id and ai.provider = 'email' and ai.email is not null limit 1) as user_email
       from public.support_tickets t
       left join public.master_profiles mp on mp.master_id = t.master_profile_id
      ${where}
      order by t.updated_at desc
      limit $${i++} offset $${i++}`,
    [...vals, limit, offset],
  );

  const tickets: SupportTicketAdminRow[] = listR.rows.map((row) => ({
    ...mapTicket(row),
    masterName: row.display_name,
    userEmail: row.user_email,
  }));

  return { tickets, total, limit, offset };
}

export async function getSupportTicketForAdmin(ticketCode: string): Promise<SupportTicketDetailDto> {
  return getSupportTicketForUser('', ticketCode, true);
}

export async function replyToSupportTicketAsAdmin(
  adminUserId: string,
  ticketCode: string,
  message: string,
): Promise<SupportTicketDetailDto> {
  const ticketR = await query<{ id: string; user_id: string }>(
    `select id, user_id from public.support_tickets where ticket_code = $1`,
    [ticketCode],
  );
  const ticket = ticketR.rows[0];
  if (!ticket) throw ApiError.notFound('Обращение не найдено');

  await withTransaction(async (client) => {
    await client.query(
      `insert into public.support_ticket_events (
         ticket_id, event_type, actor_user_id, actor_role, message
       ) values ($1, 'REPLY', $2, 'admin', $3)`,
      [ticket.id, adminUserId, message],
    );
    await client.query(
      `update public.support_tickets set status = 'WAITING_USER', updated_at = now() where id = $1`,
      [ticket.id],
    );
  });

  await writeAdminAuditLog({
    adminUserId,
    action: 'support_ticket_reply',
    entityType: 'support_ticket',
    entityId: ticket.id,
    targetUserId: ticket.user_id,
    reason: null,
    metadata: { ticketCode },
  });

  const subjectR = await query<{ subject: string }>(
    `select subject from public.support_tickets where id = $1`,
    [ticket.id],
  );
  void notifyMasterSupportAdminReply({
    userId: ticket.user_id,
    ticketId: ticket.id,
    ticketCode,
    subject: subjectR.rows[0]?.subject ?? ticketCode,
    messagePreview: message,
  });

  return getSupportTicketForAdmin(ticketCode);
}

export async function updateSupportTicketStatus(
  adminUserId: string,
  ticketCode: string,
  status: SupportTicketStatus,
): Promise<void> {
  const ticketR = await query<{ id: string; user_id: string; status: string }>(
    `select id, user_id, status from public.support_tickets where ticket_code = $1`,
    [ticketCode],
  );
  const ticket = ticketR.rows[0];
  if (!ticket) throw ApiError.notFound('Обращение не найдено');

  await withTransaction(async (client) => {
    await client.query(`update public.support_tickets set status = $2, updated_at = now() where id = $1`, [
      ticket.id,
      status,
    ]);
    await client.query(
      `insert into public.support_ticket_events (
         ticket_id, event_type, actor_user_id, actor_role, message, metadata
       ) values ($1, 'STATUS_CHANGED', $2, 'admin', null, $3::jsonb)`,
      [ticket.id, adminUserId, JSON.stringify({ from: ticket.status, to: status })],
    );
  });

  await writeAdminAuditLog({
    adminUserId,
    action: 'support_ticket_status',
    entityType: 'support_ticket',
    entityId: ticket.id,
    targetUserId: ticket.user_id,
    reason: null,
    metadata: { ticketCode, status },
  });

  const subjectR = await query<{ subject: string }>(
    `select subject from public.support_tickets where id = $1`,
    [ticket.id],
  );
  void notifyMasterSupportStatusChanged({
    userId: ticket.user_id,
    ticketId: ticket.id,
    ticketCode,
    subject: subjectR.rows[0]?.subject ?? ticketCode,
    status,
  });
}

export async function assignSupportTicket(
  adminUserId: string,
  ticketCode: string,
  assignedTo: string | null,
): Promise<void> {
  const ticketR = await query<{ id: string; user_id: string }>(
    `select id, user_id from public.support_tickets where ticket_code = $1`,
    [ticketCode],
  );
  const ticket = ticketR.rows[0];
  if (!ticket) throw ApiError.notFound('Обращение не найдено');

  if (assignedTo) {
    const adminCheck = await query(`select 1 from public.profiles where id = $1 and role = 'platform_admin'`, [
      assignedTo,
    ]);
    if (!adminCheck.rowCount) throw ApiError.badRequest('Назначить можно только администратора', 'validation_error');
  }

  await withTransaction(async (client) => {
    await client.query(`update public.support_tickets set assigned_to = $2, updated_at = now() where id = $1`, [
      ticket.id,
      assignedTo,
    ]);
    await client.query(
      `insert into public.support_ticket_events (
         ticket_id, event_type, actor_user_id, actor_role, metadata
       ) values ($1, 'ASSIGNED', $2, 'admin', $3::jsonb)`,
      [ticket.id, adminUserId, JSON.stringify({ assignedTo })],
    );
  });

  await writeAdminAuditLog({
    adminUserId,
    action: 'support_ticket_assign',
    entityType: 'support_ticket',
    entityId: ticket.id,
    targetUserId: ticket.user_id,
    reason: null,
    metadata: { ticketCode, assignedTo },
  });
}

export async function getSupportAccountContextForUser(userId: string) {
  const ctx = await getMasterContext(userId);
  return {
    userId,
    email: ctx.email,
    masterProfileName: ctx.display_name,
    plan: ctx.plan_code === 'pro' ? 'Master Pro' : 'Free',
    planCode: ctx.plan_code ?? 'free',
    subscriptionStatus: ctx.subscription_status,
    telegramLinked: Boolean(ctx.telegram_user_id),
    telegramUsername: ctx.telegram_user_id,
    linkedProviders: {
      telegram: ctx.has_telegram_auth,
      google: ctx.has_google,
      email: ctx.has_email_auth,
    },
  };
}
