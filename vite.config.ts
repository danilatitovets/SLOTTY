import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function resolveAppBuildId(): string {
  const fromCi = process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA;
  if (fromCi?.trim()) return fromCi.trim().slice(0, 12);
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
}

const appBuildId = resolveAppBuildId();

/** Inline-скрипт: Telegram WebView кэширует index.html; fetch свежего build id до загрузки бандла. */
const TELEGRAM_BUILD_REFRESH_INLINE_SCRIPT = `<script>
(function () {
  var KEY = 'slotty:build-id';
  var meta = document.querySelector('meta[name="slotty-build"]');
  var localBuild = meta && meta.getAttribute('content');
  if (!localBuild) return;
  var tg = window.Telegram && window.Telegram.WebApp;
  if (!tg || !tg.initData) return;
  function apply(remote) {
    try {
      var prev = sessionStorage.getItem(KEY);
      if (prev && prev !== remote) {
        sessionStorage.setItem(KEY, remote);
        location.reload();
        return;
      }
      sessionStorage.setItem(KEY, remote);
    } catch (e) {}
  }
  apply(localBuild);
  fetch('/?slotty-build-check=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' })
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var m = html.match(/name="slotty-build"\\s+content="([^"]+)"/);
      if (m && m[1]) apply(m[1]);
    })
    .catch(function () {});
})();
</script>`;

function injectAppBuildMeta(): Plugin {
  return {
    name: 'inject-app-build-meta',
    transformIndexHtml(html) {
      const meta = [
        '<meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate" />',
        '<meta http-equiv="Pragma" content="no-cache" />',
        `<meta name="slotty-build" content="${appBuildId}" />`,
        TELEGRAM_BUILD_REFRESH_INLINE_SCRIPT,
      ].join('\n    ');
      return html.replace('</head>', `    ${meta}\n  </head>`);
    },
  };
}

/**
 * Tailwind загружает `tailwind.config` через jiti и пишет кэш в `%TEMP%/node-jiti`.
 * На части установок Windows каталог не создаётся → PostCSS ENOENT и 500 на `index.css`.
 */
function ensureJitiTempDir(): Plugin {
  const mkdir = () => {
    try {
      fs.mkdirSync(path.join(os.tmpdir(), 'node-jiti'), { recursive: true });
    } catch {
      /* ignore */
    }
  };

  return {
    name: 'ensure-jiti-temp-dir',
    enforce: 'pre',
    buildStart: mkdir,
    configureServer: mkdir,
  };
}

export default defineConfig({
  define: {
    __SLOTTY_BUILD_ID__: JSON.stringify(appBuildId),
  },
  plugins: [ensureJitiTempDir(), injectAppBuildMeta(), react()],
  build: {
    target: 'es2020',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'router';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('@sentry')) return 'sentry';
          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('react-dom') || id.includes('/react/')) return 'react';
          if (id.includes('docx')) return 'docx';
          return 'vendor';
        },
      },
    },
  },
});
