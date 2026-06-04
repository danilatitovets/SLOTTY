import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSupportTicketBodySchema, normalizeBookingCode } from './supportTicket.validation.js';

describe('normalizeBookingCode', () => {
  it('accepts SL- prefix codes', () => {
    assert.equal(normalizeBookingCode('sl-abc-123'), 'SL-ABC-123');
  });

  it('rejects invalid codes', () => {
    assert.equal(normalizeBookingCode('bad'), null);
    assert.equal(normalizeBookingCode(''), null);
  });
});

describe('createSupportTicketBodySchema', () => {
  it('requires consent', () => {
    const r = createSupportTicketBodySchema.safeParse({
      category: 'other',
      severity: 'low',
      subject: 'Test subject',
      affectedServices: ['unknown'],
      message: 'Long enough message here',
      preferredContactChannel: 'email',
      consentAccepted: false,
    });
    assert.equal(r.success, false);
  });

  it('accepts valid payload', () => {
    const r = createSupportTicketBodySchema.safeParse({
      category: 'appointments',
      severity: 'high',
      subject: 'Не принимаются записи',
      affectedServices: ['appointments', 'web_cabinet'],
      message: 'Клиенты не могут записаться с вчерашнего дня.',
      preferredContactChannel: 'telegram',
      consentAccepted: true,
    });
    assert.equal(r.success, true);
  });
});
