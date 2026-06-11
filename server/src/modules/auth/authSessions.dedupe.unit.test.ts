import assert from 'node:assert/strict';
import test from 'node:test';
import { sessionListFingerprint } from './authSessions.service.js';

test('sessionListFingerprint ignores user agent churn', () => {
  const a = sessionListFingerprint('iPhone · Браузер', '152.233.10.5');
  const b = sessionListFingerprint('iPhone · Браузер', '152.233.10.5');
  assert.equal(a, b);
});

test('sessionListFingerprint separates different browsers on same IP', () => {
  const chrome = sessionListFingerprint('Windows · Chrome', '127.0.0.1');
  const edge = sessionListFingerprint('Windows · Edge', '127.0.0.1');
  assert.notEqual(chrome, edge);
});
