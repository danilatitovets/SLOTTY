import { query } from '../../config/db.js';
import { env } from '../../config/env.js';
import { logNotification } from '../notifications/notificationLog.js';

export async function scheduleBookingAutoCompleteJob(appointmentId: string): Promise<void> {
  const hours = env.BOOKING_AUTO_COMPLETE_HOURS;
  const runAfter = new Date(Date.now() + hours * 60 * 60 * 1000);
  try {
    await query(
      `insert into public.booking_completion_jobs (appointment_id, run_after, status)
       values ($1, $2, 'pending')
       on conflict (appointment_id) do update
         set run_after = excluded.run_after,
             status = 'pending',
             attempts = 0,
             last_error = null,
             updated_at = now()`,
      [appointmentId, runAfter.toISOString()],
    );
    logNotification('booking.auto_complete.scheduled', {
      bookingId: appointmentId,
      runAfter: runAfter.toISOString(),
      hours,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes('booking_completion_jobs')) throw e;
    logNotification('booking.auto_complete.schedule_skipped', { bookingId: appointmentId, reason: 'TABLE_MISSING' });
  }
}

export async function cancelBookingAutoCompleteJob(appointmentId: string): Promise<void> {
  try {
    await query(
      `update public.booking_completion_jobs
          set status = 'cancelled', updated_at = now()
        where appointment_id = $1 and status = 'pending'`,
      [appointmentId],
    );
  } catch {
    /* table may not exist yet */
  }
}

export async function claimDueBookingCompletionJobs(limit = 20): Promise<string[]> {
  try {
    const r = await query<{ appointment_id: string }>(
      `update public.booking_completion_jobs j
          set status = 'processing', updated_at = now()
        where j.id in (
          select id from public.booking_completion_jobs
           where status = 'pending' and run_after <= now()
           order by run_after asc
           limit $1
           for update skip locked
        )
        returning appointment_id`,
      [limit],
    );
    return r.rows.map((x) => x.appointment_id);
  } catch {
    return [];
  }
}

export async function markBookingCompletionJobDone(appointmentId: string): Promise<void> {
  try {
    await query(
      `update public.booking_completion_jobs set status = 'done', updated_at = now() where appointment_id = $1`,
      [appointmentId],
    );
  } catch {
    /* ignore */
  }
}

export async function markBookingCompletionJobFailed(
  appointmentId: string,
  error: string,
): Promise<void> {
  try {
    await query(
      `update public.booking_completion_jobs
          set status = 'pending',
              attempts = attempts + 1,
              last_error = $2,
              run_after = now() + interval '15 minutes',
              updated_at = now()
        where appointment_id = $1`,
      [appointmentId, error.slice(0, 500)],
    );
  } catch {
    /* ignore */
  }
}
