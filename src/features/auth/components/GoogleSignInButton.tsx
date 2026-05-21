import { useEffect, useId, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';

let gsiLoadPromise: Promise<void> | null = null;

function loadGoogleGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiLoadPromise) return gsiLoadPromise;
  gsiLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Google GSI failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google GSI failed'));
    document.head.appendChild(script);
  });
  return gsiLoadPromise;
}

type Props = {
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  className?: string;
  /** Ширина кнопки GIS в px; `full` — по контейнеру */
  buttonWidth?: number | 'full';
};

export function GoogleSignInButton({
  onCredential,
  onError,
  text = 'continue_with',
  className,
  buttonWidth = 280,
}: Props) {
  const containerId = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState(280);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    if (buttonWidth !== 'full' || !containerRef.current) return;

    const el = containerRef.current;
    const apply = () => {
      const w = Math.min(400, Math.max(200, Math.floor(el.offsetWidth)));
      setMeasuredWidth(w);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [buttonWidth]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    const width = buttonWidth === 'full' ? measuredWidth : buttonWidth;

    void loadGoogleGsi()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            const token = response.credential?.trim();
            if (token) onCredential(token);
            else onError?.('Не удалось получить токен Google');
          },
        });
        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          width,
          locale: 'ru',
        });
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) onError?.('Не удалось загрузить Google Sign-In');
      });

    return () => {
      cancelled = true;
    };
  }, [buttonWidth, clientId, measuredWidth, onCredential, onError, text, containerId]);

  if (!clientId) {
    return (
      <p className="text-[13px] font-medium text-neutral-500">
        Google Sign-In не настроен (задайте VITE_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  return (
    <div className={className}>
      <div ref={containerRef} id={containerId} className="flex min-h-11 justify-center" />
      {!ready ? (
        <p className="mt-2 text-center text-[12px] text-neutral-400">Загрузка Google…</p>
      ) : null}
    </div>
  );
}
