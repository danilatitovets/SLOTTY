import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  defaultMasterNotificationPreferences,
  normalizeIncomingPreferences,
} from './masterNotificationPreferences.state.js';

describe('masterNotificationPreferences.state', () => {
  it('defaults include all event keys', () => {
    const d = defaultMasterNotificationPreferences();
    assert.equal(Object.keys(d.events).length, 12);
    assert.equal(d.events.new_booking.telegram, true);
    assert.equal(d.events.news.telegram, true);
    assert.equal(d.events.news.email, true);
    assert.equal(d.events.client_on_the_way.telegram, true);
    assert.equal(d.channels.in_app, true);
  });

  it('normalizes partial payload', () => {
    const n = normalizeIncomingPreferences({
      channels: { telegram: false, email: true, in_app: true },
      events: { cancel: { telegram: false, email: true, inApp: false } },
    });
    assert.equal(n.channels.telegram, false);
    assert.equal(n.events.cancel.telegram, false);
    assert.equal(n.events.cancel.inApp, false);
    assert.equal(n.events.new_booking.telegram, true);
  });
});
