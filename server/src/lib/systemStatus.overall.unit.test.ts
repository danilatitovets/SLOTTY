import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeOverallStatus, sanitizePublicMetadata } from '../modules/system-status/systemStatus.overall.js';

test('computeOverallStatus operational when all ok', () => {
  assert.equal(
    computeOverallStatus({
      componentStatuses: ['operational', 'operational'],
      hasActiveMaintenance: false,
      hasActiveIncident: false,
    }),
    'operational',
  );
});

test('computeOverallStatus degraded from component', () => {
  assert.equal(
    computeOverallStatus({
      componentStatuses: ['operational', 'degraded'],
      hasActiveMaintenance: false,
      hasActiveIncident: false,
    }),
    'degraded',
  );
});

test('computeOverallStatus maintenance wins', () => {
  assert.equal(
    computeOverallStatus({
      componentStatuses: ['major_outage'],
      hasActiveMaintenance: true,
      hasActiveIncident: true,
    }),
    'maintenance',
  );
});

test('sanitizePublicMetadata strips secrets', () => {
  const out = sanitizePublicMetadata({
    pendingJobs: 2,
    apiKey: 'secret',
    token: 'x',
    ok: true,
  });
  assert.equal(out.pendingJobs, 2);
  assert.equal(out.ok, true);
  assert.equal('apiKey' in out, false);
  assert.equal('token' in out, false);
});
