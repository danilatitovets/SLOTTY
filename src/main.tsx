import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { clearStaleTelegramLaunchParams } from './shared/lib/telegramEnv';
import { initSentryBrowser } from './shared/lib/sentry';
import './app/styles/index.css';

initSentryBrowser();
clearStaleTelegramLaunchParams();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
