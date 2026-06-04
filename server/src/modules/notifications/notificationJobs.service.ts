import type { PoolClient } from 'pg';
import { query, withTransaction } from '../../config/db.js';
import { logNotification, logNotificationWarn } from './notificationLog.js';
import { processNotificationJob } from './notificationJobs.processor.js';
import type {
  NotificationJobChannel,
  NotificationJobRow,
  NotificationJobStatus,
  NotificationJobType,
} from './notificationJobs.types.js';
import {
  NOTIFICATION_JOB_MAX_ATTEMPTS,
  NOTIFICATION_JOB_RETRY_MINUTES,
} from './notificationJobs.types.js';

export type EnqueueNotificationJobInput = {
  jobType: NotificationJobType;
  channel: NotificationJobChannel;
  recipientUserId: string;
  appointmentId: string;
  scheduledAt: Date;
};

export async function enqueueNotificationJob(input: EnqueueNotificationJobInput): Promise<string | null> {
  try {
    const dup = await query<{ id: string }>(
      `select id from public.notification_jobs
        where appointment_id = $1
          and job_type = $2
          and channel = $3
          and recipient_user_id = $4
          and status in ('pending', 'processing')
        limit 1`,
      [input.appointmentId, input.jobType, input.channel, input.recipientUserId],
    );
    if (dup.rows[0]?.id) return dup.rows[0].id;

    const r = await query<{ id: string }>(
      `insert into public.notification_jobs (
         job_type, channel, recipient_user_id, appointment_id, scheduled_at, status
       ) values ($1, $2, $3, $4, $5, 'pending')
       returning id`,
      [
        input.jobType,
        input.channel,
        input.recipientUserId,
        input.appointmentId,
        input.scheduledAt.toISOString(),
      ],
    );
    return r.rows[0]?.id ?? null;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('notification_jobs') && message.includes('does not exist')) {
      logNotificationWarn('notification.enqueue.skipped', {
        reason: 'TABLE_MISSING',
        bookingId: input.appointmentId,
        type: input.jobType,
      });
      return null;
    }
    throw e;
  }
}

export async function listNotificationJobs(params: {
  appointmentId?: string;
  bookingCode?: string;
  limit?: number;
}): Promise<NotificationJobRow[]> {
  const limit = Math.min(params.limit ?? 50, 200);
  if (params.bookingCode) {
    const r = await query<NotificationJobRow>(
      `select nj.*
         from public.notification_jobs nj
         join public.booking_vouchers bv on bv.appointment_id = nj.appointment_id
        where bv.voucher_number = $1
        order by nj.created_at desc
        limit $2`,
      [params.bookingCode.trim().toUpperCase(), limit],
    );
    return r.rows;
  }
  if (params.appointmentId) {
    const r = await query<NotificationJobRow>(
      `select * from public.notification_jobs
        where appointment_id = $1
        order by created_at desc
        limit $2`,
      [params.appointmentId, limit],
    );
    return r.rows;
  }
  const r = await query<NotificationJobRow>(
    `select * from public.notification_jobs order by created_at desc limit $1`,
    [limit],
  );
  return r.rows;
}

async function claimDueJobs(client: PoolClient, batchSize: number): Promise<NotificationJobRow[]> {
  const r = await client.query<NotificationJobRow>(
    `select * from public.notification_jobs
      where status = 'pending'
        and scheduled_at <= now()
        and (
          attempts = 0
          or updated_at < now() - ($2::int || ' minutes')::interval
        )
      order by scheduled_at asc
      limit $1
      for update skip locked`,
    [batchSize, NOTIFICATION_JOB_RETRY_MINUTES],
  );

  const ids = r.rows.map((row) => row.id);
  if (ids.length === 0) return [];

  await client.query(
    `update public.notification_jobs
        set status = 'processing', updated_at = now()
      where id = any($1::uuid[])`,
    [ids],
  );

  return r.rows;
}

async function finalizeJob(
  jobId: string,
  status: NotificationJobStatus,
  opts?: { lastError?: string; providerMessageId?: string | null },
): Promise<void> {
  await query(
    `update public.notification_jobs
        set status = $2::text,
            attempts = attempts + case when $2::text in ('failed', 'sent', 'skipped') then 1 else 0 end,
            last_error = $3,
            provider_message_id = coalesce($4, provider_message_id),
            updated_at = now()
      where id = $1`,
    [jobId, status, opts?.lastError?.slice(0, 2000) ?? null, opts?.providerMessageId ?? null],
  );
}

export async function retryNotificationJob(jobId: string): Promise<void> {
  await query(
    `update public.notification_jobs
        set status = 'pending',
            scheduled_at = now(),
            last_error = null,
            updated_at = now()
      where id = $1 and status in ('failed', 'cancelled', 'skipped')`,
    [jobId],
  );
}

export async function retryAllFailedNotificationJobs(): Promise<{
  retried: number;
  stillFailed: number;
}> {
  const r = await query(
    `update public.notification_jobs
        set status = 'pending',
            scheduled_at = now(),
            last_error = null,
            updated_at = now()
      where status = 'failed'
        and attempts < $1`,
    [NOTIFICATION_JOB_MAX_ATTEMPTS],
  );
  const retried = r.rowCount ?? 0;
  const left = await query<{ count: number }>(
    `select count(*)::int as count from public.notification_jobs where status = 'failed'`,
  );
  return { retried, stillFailed: left.rows[0]?.count ?? 0 };
}

export async function rebuildReminderJobsForAppointment(appointmentId: string): Promise<void> {
  const schedule = await import('./notificationJobs.schedule.js');
  await schedule.cancelPendingReminderJobs(appointmentId);
  const statusR = await query<{ status: string }>(
    `select status::text from public.appointments where id = $1`,
    [appointmentId],
  );
  const status = statusR.rows[0]?.status;
  if (status === 'confirmed') {
    await schedule.scheduleJobsAfterBookingConfirmed(appointmentId);
  } else if (status === 'pending') {
    await schedule.scheduleJobsAfterBookingCreated(appointmentId);
  }
}

export type ProcessJobsReport = {
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
  durationMs: number;
};

export async function processDueNotificationJobs(batchSize = 40): Promise<ProcessJobsReport> {
  const started = Date.now();
  const report = { claimed: 0, sent: 0, failed: 0, skipped: 0, durationMs: 0 };

  const jobs = await withTransaction(async (client) => claimDueJobs(client, batchSize));
  report.claimed = jobs.length;

  for (const job of jobs) {
    logNotification('reminder.due', {
      jobId: job.id,
      bookingId: job.appointment_id,
      type: job.job_type,
      channel: job.channel,
      recipientUserId: job.recipient_user_id,
      scheduledAt:
        job.scheduled_at instanceof Date
          ? job.scheduled_at.toISOString()
          : String(job.scheduled_at),
      now: new Date().toISOString(),
    });

    try {
      const result = await processNotificationJob(job);
      if (result.status === 'sent') {
        report.sent += 1;
        await finalizeJob(job.id, 'sent', { providerMessageId: result.providerMessageId });
        const { logBookingNotificationEvent } = await import('../appointments/bookingNotificationEvents.js');
        const evKind = String(job.job_type).includes('reminder') ? 'reminder' : 'sent';
        void logBookingNotificationEvent(job.appointment_id, evKind, {
          channel: job.channel,
          jobType: job.job_type,
          providerMessageId: result.providerMessageId,
        });
        logNotification('reminder.sent', {
          jobId: job.id,
          bookingId: job.appointment_id,
          channel: job.channel,
          recipientUserId: job.recipient_user_id,
          resendMessageId: result.providerMessageId,
        });
      } else if (result.status === 'skipped') {
        report.skipped += 1;
        await finalizeJob(job.id, 'skipped', { lastError: result.reason });
        logNotificationWarn('notification.skipped', {
          jobId: job.id,
          bookingId: job.appointment_id,
          channel: job.channel,
          reason: result.reason,
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      report.failed += 1;
      const attempts = job.attempts + 1;
      const finalStatus =
        attempts >= NOTIFICATION_JOB_MAX_ATTEMPTS ? 'failed' : 'pending';
      await finalizeJob(job.id, finalStatus === 'pending' ? 'pending' : 'failed', {
        lastError: message,
      });
      if (finalStatus === 'pending') {
        await query(`update public.notification_jobs set status = 'pending' where id = $1`, [
          job.id,
        ]);
      }
      logNotificationWarn('email.send.failed', {
        jobId: job.id,
        bookingId: job.appointment_id,
        channel: job.channel,
        error: message,
        attempts,
      });
      if (finalStatus === 'failed') {
        const { logBookingNotificationEvent } = await import('../appointments/bookingNotificationEvents.js');
        void logBookingNotificationEvent(job.appointment_id, 'failed', {
          channel: job.channel,
          jobType: job.job_type,
          error: message,
        });
      }
    }
  }

  report.durationMs = Date.now() - started;
  return report;
}
