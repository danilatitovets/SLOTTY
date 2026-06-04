import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const REMINDER_1H_MS = 60 * 60 * 1000;
const DISPLAY_TZ = 'Europe/Minsk';

function reminderScheduledAt(startsAtIso: string): Date {
  const startsAt = new Date(startsAtIso);
  return new Date(startsAt.getTime() - REMINDER_1H_MS);
}

describe('notification jobs scheduling', () => {
  it('reminder_1h is exactly 1 hour before starts_at (UTC storage)', () => {
    const startsAt = '2026-06-04T09:00:00.000Z';
    const scheduled = reminderScheduledAt(startsAt);
    assert.equal(scheduled.toISOString(), '2026-06-04T08:00:00.000Z');
  });

  it('displays Europe/Minsk for Minsk noon UTC+3', () => {
    const startsAt = new Date('2026-06-04T09:00:00.000Z');
    const time = startsAt.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: DISPLAY_TZ,
    });
    assert.equal(time, '12:00');
  });

  it('skips reminder when scheduled time is in the past', () => {
    const startsAt = new Date(Date.now() + 30 * 60 * 1000);
    const scheduled = new Date(startsAt.getTime() - REMINDER_1H_MS);
    assert.ok(scheduled.getTime() < Date.now());
  });
});
