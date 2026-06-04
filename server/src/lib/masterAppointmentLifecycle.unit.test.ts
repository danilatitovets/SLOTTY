import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertCanCloseOverdueRecord,
  assertCanCompleteVisit,
  assertCanStartVisit,
  assertCanReportNoShow,
  assertLegacyClientArrivedForbidden,
  assertLegacyInstantNoShowForbidden,
  buildMasterAppointmentActions,
  isInVisitStartWindow,
  isVisitGuardError,
  isVisitOverdue,
  resolveMasterAppointmentPhase,
  VisitGuardError,
  VISIT_EARLY_START_MS,
  VISIT_LATE_START_BUFFER_MS,
} from './masterAppointmentLifecycle.js';

const start = new Date('2026-06-05T10:00:00.000Z');
const end = new Date('2026-06-05T11:00:00.000Z');

describe('masterAppointmentLifecycle', () => {
  it('start visit allowed in visit window', () => {
    const now = new Date(start.getTime() + 5 * 60_000);
    assert.equal(isInVisitStartWindow(start, end, now), true);
    assert.doesNotThrow(() =>
      assertCanStartVisit({ status: 'confirmed', startsAt: start, endsAt: end, now }),
    );
  });

  it('cannot start visit after appointmentEnd + buffer', () => {
    const now = new Date(end.getTime() + VISIT_LATE_START_BUFFER_MS + 60_000);
    assert.throws(
      () => assertCanStartVisit({ status: 'confirmed', startsAt: start, endsAt: end, now }),
      (err: unknown) => err instanceof VisitGuardError && err.code === 'VISIT_WINDOW_PASSED',
    );
  });

  it('confirmed overdue returns phase requires_attention', () => {
    const now = new Date(end.getTime() + 60_000);
    assert.equal(isVisitOverdue(end, 'confirmed', now), true);
    assert.equal(
      resolveMasterAppointmentPhase({ status: 'confirmed', startsAt: start, endsAt: end }, now),
      'requires_attention',
    );
    const ui = buildMasterAppointmentActions(
      { status: 'confirmed', startsAt: start, endsAt: end },
      now,
      undefined,
      'upcoming',
    );
    assert.equal(ui.phase, 'requires_attention');
    assert.equal(ui.primaryAction?.id, 'close_record');
    assert.equal(ui.secondaryAction?.id, 'report_no_show');
  });

  it('complete visit from in_progress works', () => {
    assert.doesNotThrow(() => assertCanCompleteVisit('in_progress'));
    assert.throws(() => assertCanCompleteVisit('confirmed'));
  });

  it('history does not expose active lifecycle actions except overdue close', () => {
    const now = new Date(start.getTime() + 5 * 60_000);
    const during = buildMasterAppointmentActions(
      { status: 'confirmed', startsAt: start, endsAt: end },
      now,
      undefined,
      'history',
    );
    assert.equal(during.primaryAction, null);
    assert.equal(during.allowsActiveLifecycle, false);

    const overdue = buildMasterAppointmentActions(
      { status: 'confirmed', startsAt: start, endsAt: end },
      new Date(end.getTime() + 60_000),
      undefined,
      'history',
    );
    assert.equal(overdue.primaryAction?.id, 'close_record');
  });

  it('visit window shows start, not client_arrived', () => {
    const now = new Date(start.getTime());
    const ui = buildMasterAppointmentActions(
      { status: 'confirmed', startsAt: start, endsAt: end, hasClientOnSiteSignal: true },
      now,
      undefined,
      'upcoming',
    );
    assert.equal(ui.primaryAction?.id, 'start_visit');
    assert.match(ui.helperText, /на месте/i);
  });

  it('before visit has cancel and contact, no start', () => {
    const now = new Date(start.getTime() - VISIT_EARLY_START_MS - 60_000);
    const ui = buildMasterAppointmentActions(
      { status: 'confirmed', startsAt: start, endsAt: end },
      now,
      undefined,
      'upcoming',
    );
    assert.equal(ui.phase, 'before_visit');
    assert.equal(ui.primaryAction, null);
    assert.equal(ui.secondaryAction?.id, 'cancel');
  });

  it('close overdue requires past end', () => {
    const now = new Date(end.getTime() + 60_000);
    assert.doesNotThrow(() =>
      assertCanCloseOverdueRecord({ status: 'confirmed', endsAt: end, now }),
    );
    assert.throws(() =>
      assertCanCloseOverdueRecord({
        status: 'confirmed',
        endsAt: end,
        now: new Date(start.getTime()),
      }),
    );
  });

  it('isVisitGuardError identifies guard errors', () => {
    try {
      assertCanCompleteVisit('confirmed');
    } catch (e) {
      assert.equal(isVisitGuardError(e), true);
    }
  });

  it('legacy instant no-show is blocked', () => {
    assert.throws(
      () => assertLegacyInstantNoShowForbidden(),
      (err: unknown) => err instanceof VisitGuardError && err.code === 'USE_SUPPORT_NO_SHOW',
    );
  });

  it('legacy client-arrived endpoint is blocked', () => {
    assert.throws(
      () => assertLegacyClientArrivedForbidden(),
      (err: unknown) => err instanceof VisitGuardError && err.code === 'DEPRECATED_CLIENT_ARRIVED',
    );
  });

  it('client_arrived in visit window offers start_visit', () => {
    const now = new Date(start.getTime() + 5 * 60_000);
    const ui = buildMasterAppointmentActions(
      { status: 'client_arrived', startsAt: start, endsAt: end, hasClientOnSiteSignal: true },
      now,
      undefined,
      'upcoming',
    );
    assert.equal(ui.phase, 'visit_window');
    assert.equal(ui.primaryAction?.id, 'start_visit');
  });

  it('client_arrived overdue shows requires_attention', () => {
    const ui = buildMasterAppointmentActions(
      { status: 'client_arrived', startsAt: start, endsAt: end },
      new Date(end.getTime() + 60_000),
      undefined,
      'upcoming',
    );
    assert.equal(ui.phase, 'requires_attention');
    assert.equal(ui.primaryAction?.id, 'close_record');
  });

  it('master_marked_completed overdue shows requires_attention close', () => {
    const ui = buildMasterAppointmentActions(
      { status: 'master_marked_completed', startsAt: start, endsAt: end },
      new Date(end.getTime() + 60_000),
      undefined,
      'history',
    );
    assert.equal(ui.phase, 'requires_attention');
    assert.equal(ui.primaryAction?.id, 'close_record');
  });

  it('no-show report allowed in visit window and overdue only', () => {
    assert.doesNotThrow(() =>
      assertCanReportNoShow({
        status: 'confirmed',
        startsAt: start,
        endsAt: end,
        now: new Date(start.getTime()),
      }),
    );
    assert.doesNotThrow(() =>
      assertCanReportNoShow({
        status: 'confirmed',
        startsAt: start,
        endsAt: end,
        now: new Date(end.getTime() + 60_000),
      }),
    );
    assert.throws(() =>
      assertCanReportNoShow({
        status: 'confirmed',
        startsAt: start,
        endsAt: end,
        now: new Date(start.getTime() - VISIT_EARLY_START_MS - 60_000),
      }),
    );
    assert.throws(() =>
      assertCanReportNoShow({
        status: 'in_progress',
        startsAt: start,
        endsAt: end,
        now: new Date(start.getTime() + 5 * 60_000),
      }),
    );
  });
});
