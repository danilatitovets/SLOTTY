import assert from 'node:assert/strict';
import { buildClientAvailableActions } from './bookingClientDetail.js';
import {
  DISPUTED_REVENUE_STATUS_SQL,
  EARNED_REVENUE_STATUS_SQL,
  EXPECTED_REVENUE_STATUS_SQL,
  HISTORY_TAB_SQL,
  UPCOMING_TAB_SQL,
} from './appointmentStatus.js';

function testClientDisputeOnNoShow() {
  const actions = buildClientAvailableActions({
    status: 'no_show',
    startsAt: new Date().toISOString(),
    hasOpenDispute: false,
    hasReview: false,
    canLeaveReview: false,
    hasAddress: false,
    hasDirectContact: false,
  });
  assert.ok(actions.includes('dispute'));
}

function testClientDisputeBlockedWhenOpen() {
  const actions = buildClientAvailableActions({
    status: 'no_show',
    startsAt: new Date().toISOString(),
    hasOpenDispute: true,
    hasReview: false,
    canLeaveReview: false,
    hasAddress: false,
    hasDirectContact: false,
  });
  assert.equal(actions.includes('dispute'), false);
}

function testRevenueSqlNonEmpty() {
  for (const sql of [
    UPCOMING_TAB_SQL,
    HISTORY_TAB_SQL,
    EXPECTED_REVENUE_STATUS_SQL,
    DISPUTED_REVENUE_STATUS_SQL,
    EARNED_REVENUE_STATUS_SQL,
  ]) {
    assert.ok(sql.length > 10);
    assert.match(sql, /status/);
  }
}

testClientDisputeOnNoShow();
testClientDisputeBlockedWhenOpen();
testRevenueSqlNonEmpty();
console.log('bookingLifecycleSmoke: ok');
