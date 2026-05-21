import { createApp } from './app.js';
import { env } from './config/env.js';
import { getGoogleOAuthDiagnostics } from './modules/auth/googleOAuth.service.js';
import { startAppointmentRemindersScheduler } from './modules/appointments/appointmentReminders.scheduler.js';
import { initTelegramBotTransport } from './modules/telegram/telegram.service.js';

const app = createApp();

app.listen(env.PORT, () => {
  // Do not log secrets (DATABASE_URL, JWT_SECRET, TELEGRAM_BOT_TOKEN).
  console.log(`slotty-backend listening on port ${env.PORT}`);
  const googleOAuth = getGoogleOAuthDiagnostics();
  if (env.GOOGLE_CLIENT_ID && !googleOAuth.configured) {
    console.warn(
      `[auth] Google OAuth redirect не готов: ${googleOAuth.missing.join(', ')}. ` +
        'Привязка Google из Telegram не будет работать до настройки env на API-сервисе.',
    );
  } else if (googleOAuth.configured && googleOAuth.redirectUri) {
    console.log(`[auth] Google OAuth redirect → ${googleOAuth.redirectUri}`);
  }
  void initTelegramBotTransport();
  startAppointmentRemindersScheduler();
});
