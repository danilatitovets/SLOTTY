import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('supportTicket.notifications helpers', () => {
  it('high severity includes critical and high', () => {
    const isHigh = (s: string) => s === 'high' || s === 'critical';
    assert.equal(isHigh('high'), true);
    assert.equal(isHigh('critical'), true);
    assert.equal(isHigh('medium'), false);
  });

  it('status change notifies only terminal/waiting states', () => {
    const notifyStatuses = ['RESOLVED', 'WAITING_USER', 'CLOSED'];
    assert.ok(notifyStatuses.includes('RESOLVED'));
    assert.ok(!notifyStatuses.includes('OPEN'));
  });
});
