import assert from 'node:assert/strict';
import {
  buildClientAvailableActions,
  buildClientBookingHero,
  formatBookingTimelineEventForClient,
  formatRelativeAppointmentCountdown,
} from './bookingClientDetail.js';
import type { BookingEventRow } from '../modules/appointments/bookingEvents.service.js';

function testHeroConfirmed() {
  const starts = new Date(Date.now() + 30 * 60_000).toISOString();
  const hero = buildClientBookingHero({ status: 'confirmed', startsAt: starts, signal: { kind: null, lateMinutes: null, comment: null, at: null } });
  assert.equal(hero.title, 'Скоро запись');
  assert.ok(hero.countdown);
}

function testHeroLateSignal() {
  const hero = buildClientBookingHero({
    status: 'confirmed',
    startsAt: new Date(Date.now() + 3_600_000).toISOString(),
    signal: { kind: 'running_late', lateMinutes: 10, comment: 'Пробки', at: new Date().toISOString() },
  });
  assert.equal(hero.title, 'Вы сообщили об опоздании');
  assert.match(hero.subtitle, /10 минут/);
  assert.equal(hero.lateBadge, 'Опаздываете на 10 мин');
}

function testAvailableActionsConfirmedSoon() {
  const starts = new Date(Date.now() + 45 * 60_000).toISOString();
  const actions = buildClientAvailableActions({
    status: 'confirmed',
    startsAt: starts,
    hasOpenDispute: false,
    canLeaveReview: false,
    hasReview: false,
    hasAddress: true,
    hasDirectContact: true,
  });
  assert.ok(actions.includes('on_the_way'));
  assert.ok(actions.includes('running_late'));
  assert.ok(actions.includes('open_route'));
}

function testTimelineHidesTechnical() {
  const ev: BookingEventRow = {
    id: '1',
    event_type: 'booking.notification_sent',
    old_status: null,
    new_status: null,
    actor_role: 'system',
    reason: null,
    comment: null,
    metadata: null,
    created_at: new Date().toISOString(),
  };
  assert.equal(formatBookingTimelineEventForClient(ev), null);
}

function testCountdown() {
  const label = formatRelativeAppointmentCountdown(75 * 60_000);
  assert.equal(label, '1 ч 15 мин');
}

testHeroConfirmed();
testHeroLateSignal();
testAvailableActionsConfirmedSoon();
testTimelineHidesTechnical();
testCountdown();
console.log('bookingClientDetail.unit.test.ts: 5/5 passed');
