import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

async function readErr(res: Response): Promise<string> {
  return readSlottyApiErrorMessage(res);
}

function voucherPath(code: string, suffix: string): string {
  const v = encodeURIComponent(code.trim().toUpperCase());
  return `/api/me/appointments/voucher/${v}${suffix}`;
}

export async function clientConfirmCompletedByVoucher(bookingCode: string): Promise<void> {
  const res = await apiFetch(voucherPath(bookingCode, '/confirm-completed'), { method: 'POST' });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function clientDisputeByVoucher(
  bookingCode: string,
  body: { reason: string; comment?: string },
): Promise<void> {
  const res = await apiFetch(voucherPath(bookingCode, '/dispute'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function clientSignalByVoucher(
  bookingCode: string,
  kind: 'on-the-way' | 'running-late' | 'reported-arrived',
  options?: { comment?: string; lateMinutes?: number },
): Promise<void> {
  const res = await apiFetch(voucherPath(bookingCode, `/${kind}`), {
    method: 'POST',
    body: JSON.stringify(options ?? {}),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function clientCommentByVoucher(bookingCode: string, message: string): Promise<void> {
  const res = await apiFetch(voucherPath(bookingCode, '/comment'), {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function masterMarkCompleted(appointmentId: string): Promise<void> {
  const res = await apiFetch(`/api/masters/me/appointments/${appointmentId}/mark-completed`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error(await readErr(res));
}

export async function masterDispute(
  appointmentId: string,
  body: { reason: string; comment?: string },
): Promise<void> {
  const res = await apiFetch(`/api/masters/me/appointments/${appointmentId}/dispute`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readErr(res));
}
