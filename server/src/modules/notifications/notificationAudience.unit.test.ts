import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveNotificationAudience } from './notificationAudience.js';

describe('resolveNotificationAudience', () => {
  it('master booking completed → master', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_confirmed',
        title: 'Запись завершена',
        body: 'Клиент: Анна\nУслуга: Маникюр',
      }),
      'master',
    );
  });

  it('client booking confirmed → client', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_confirmed',
        title: 'Запись подтверждена',
        body: 'Запись подтверждена. Мастер ждёт вас.',
      }),
      'client',
    );
  });

  it('client pending request → client', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_pending',
        title: 'Заявка отправлена',
        body: 'Заявка отправлена мастеру.',
      }),
      'client',
    );
  });

  it('master pending reminder stored as appointment_pending → master', () => {
    assert.equal(
      resolveNotificationAudience({
        type: 'appointment_pending',
        title: 'Заявка ждёт решения',
        body: 'Заявка всё ещё ждёт решения.',
      }),
      'master',
    );
  });
});
