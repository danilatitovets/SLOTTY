# Railway / staging — booking lifecycle smoke checklist

Используйте после деплоя backend + frontend на staging (Railway).

## 1. Переменные окружения

| Переменная | Обязательно | Проверка |
|------------|-------------|----------|
| `DATABASE_URL` | да | `npm run db:v2:status` — 057–059 applied |
| `JWT_SECRET` | да | вход клиента/мастера/админа |
| `TELEGRAM_BOT_TOKEN` | для TG | diagnostics: Telegram configured = да |
| `RESEND_API_KEY` | для email | diagnostics: Resend configured = да |
| `RESEND_FROM` | для email | diagnostics: from email отображается |
| `CLIENT_URL` | да | diagnostics: App public URL |
| `NOTIFICATION_JOBS_ENABLED` | `true` | worker running = да |
| `BOOKING_AUTO_COMPLETE_HOURS` | `24` (или по политике) | auto-complete worker lastRun |

Не выводите секреты в UI и логи клиента.

## 2. Миграции

```bash
npm run db:v2:migrate
npm run db:v2:status
```

Ожидаются applied:

- `057_notification_jobs.sql`
- `058_appointment_lifecycle.sql`
- `059_booking_two_sided_lifecycle.sql`

## 3. Сборка и старт

```bash
cd server && npm run build && npm run start
# frontend: npm run build && preview/static host
```

Health:

```bash
curl -s "$API_URL/api/health/ready" | jq .status
# ожидается "ok"
```

## 4. Diagnostics UI

1. Войти как platform-admin.
2. Открыть `/platform-admin/notifications?tab=diagnostics`.
3. Проверить: Resend, Telegram, оба worker heartbeat, pending/failed counts.

Кнопки:

- **Отправить test email** — письмо на email админа (или ошибка «Resend не настроен»).
- **Отправить test Telegram** — сообщение в TG админа (или «Telegram не настроен» / skipped).
- **Проверить booking notification** — ввести `SL-…`, отправить тест booking email.
- **Retry failed jobs** — число `retried` в ответе UI.

## 5. Семь сценариев (ручной прогон)

| # | Сценарий | Критерий успеха |
|---|----------|-----------------|
| 1 | Заявка → подтверждение | Мастер: заявки → подтвердить → предстоящие; клиент: «Подтверждена» |
| 2 | Опоздание | Клиент: «Я опаздываю» 10 мин; мастер: баннер; админ: event в timeline |
| 3 | Завершение + отзыв | client_arrived → start → complete → клиент confirm → отзыв |
| 4 | No-show + спор | no-show → клиент «Оспорить» → админ видит dispute → resolve |
| 5 | Deep links | in-app → `/client/appointments/:code` и `/master/appointments/:code`; чужой — 403 |
| 6 | Reminder 1h | CONFIRMED будущая запись → job `booking_reminder_1h`; cancelled — jobs cancelled |
| 7 | Resend/Telegram | diagnostics test + job SENT/FAILED с last_error |

## 6. Автоматические smoke (dev/CI)

```bash
# backend unit
cd server && npm run test:booking-lifecycle && npm run test:booking-reminder-jobs

# Playwright API (нужны E2E_API_URL, опционально E2E_PLATFORM_ADMIN_TOKEN)
E2E_API_URL=https://api.staging.example npm run e2e:smoke -- e2e/booking-lifecycle.spec.ts
```

## 7. После прогона

Зафиксировать в отчёте:

- Railway/staging или только dev
- Resend: письмо пришло / ошибка
- Telegram: сообщение пришло / skipped / ошибка
- failed jobs до/после retry
- worker lastRunAt
