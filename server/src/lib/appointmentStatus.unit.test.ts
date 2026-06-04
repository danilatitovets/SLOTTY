import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  countsTowardEarned,
  countsTowardExpected,
  dbStatusToUi,
  isHistoryTabStatus,
  isRequestsTabStatus,
  isUpcomingTabStatus,
} from './appointmentStatus.js';

describe('appointmentStatus', () => {
  it('maps db statuses to UI', () => {
    assert.equal(dbStatusToUi('pending'), 'pending');
    assert.equal(dbStatusToUi('client_arrived'), 'client_arrived');
    assert.equal(dbStatusToUi('cancelled_by_master'), 'cancelled');
    assert.equal(dbStatusToUi('no_show'), 'no_show');
  });

  it('tabs: requests vs upcoming vs history', () => {
    assert.equal(isRequestsTabStatus('pending'), true);
    assert.equal(isRequestsTabStatus('confirmed'), false);
    assert.equal(isUpcomingTabStatus('confirmed'), true);
    assert.equal(isUpcomingTabStatus('in_progress'), true);
    assert.equal(isHistoryTabStatus('completed'), true);
    assert.equal(isHistoryTabStatus('no_show'), true);
    assert.equal(isHistoryTabStatus('cancelled_by_client'), true);
  });

  it('revenue: earned only completed, expected upcoming active', () => {
    assert.equal(countsTowardEarned('completed'), true);
    assert.equal(countsTowardEarned('no_show'), false);
    assert.equal(countsTowardExpected('confirmed'), true);
    assert.equal(countsTowardExpected('pending'), false);
    assert.equal(countsTowardExpected('master_marked_completed'), true);
  });
});
