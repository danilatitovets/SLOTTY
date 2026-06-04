import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canClientLeaveReview,
  countsTowardEarned,
  countsTowardExpected,
  countsTowardPendingConfirmation,
  dbStatusToUi,
  isHistoryTabStatus,
  isUpcomingTabStatus,
  normalizeDbStatus,
} from './appointmentStatus.js';

describe('two-sided completion status helpers', () => {
  it('maps new db statuses to UI', () => {
    assert.equal(dbStatusToUi('master_marked_completed'), 'master_marked_completed');
    assert.equal(dbStatusToUi('client_confirmed_completed'), 'client_confirmed_completed');
    assert.equal(dbStatusToUi('disputed_by_client'), 'disputed');
  });

  it('upcoming tab includes pending confirmation statuses', () => {
    assert.equal(isUpcomingTabStatus('master_marked_completed'), true);
    assert.equal(isUpcomingTabStatus('client_confirmed_completed'), true);
    assert.equal(isHistoryTabStatus('disputed_by_client'), true);
  });

  it('revenue: earned only completed, expected includes active visit', () => {
    assert.equal(countsTowardEarned('completed'), true);
    assert.equal(countsTowardEarned('master_marked_completed'), false);
    assert.equal(countsTowardExpected('in_progress'), true);
    assert.equal(countsTowardPendingConfirmation('master_marked_completed'), true);
  });

  it('review only after completed without open dispute flag', () => {
    assert.equal(canClientLeaveReview('completed', false), true);
    assert.equal(canClientLeaveReview('completed', true), false);
    assert.equal(canClientLeaveReview('master_marked_completed', false), false);
  });

  it('normalize unknown status to pending', () => {
    assert.equal(normalizeDbStatus('unknown_status'), 'pending');
  });
});
