import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Статическая проверка: reminder jobs планируются только для confirmed/pending, отмена — cancelPending. */
function testScheduleModuleExports() {
  const dir = dirname(fileURLToPath(import.meta.url));
  const schedulePath = join(dir, '../modules/notifications/notificationJobs.schedule.js');
  const rebuildPath = join(dir, '../modules/notifications/notificationJobs.service.js');
  const scheduleSrc = readFileSync(schedulePath.replace('.js', '.ts'), 'utf8');
  const rebuildSrc = readFileSync(rebuildPath.replace('.js', '.ts'), 'utf8');

  assert.match(scheduleSrc, /scheduleJobsAfterBookingConfirmed/);
  assert.match(rebuildSrc, /cancelPendingReminderJobs/);
  assert.match(rebuildSrc, /status === 'confirmed'/);
}

function testRebuildSkipsTerminalStatuses() {
  const dir = dirname(fileURLToPath(import.meta.url));
  const rebuildSrc = readFileSync(
    join(dir, '../modules/notifications/notificationJobs.service.ts'),
    'utf8',
  );
  assert.doesNotMatch(rebuildSrc, /status === 'cancelled_by_client'/);
  assert.doesNotMatch(rebuildSrc, /status === 'no_show'/);
  assert.doesNotMatch(rebuildSrc, /status === 'completed'/);
}

testScheduleModuleExports();
testRebuildSkipsTerminalStatuses();
console.log('bookingReminderJobs.unit.test: ok');
