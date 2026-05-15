import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { resolveMasterBookingLink } from '../../../shared/lib/masterBookingLink';
import { openTelegramOrBrowserUrl, openTelegramShareUrlPicker } from '../../../shared/lib/telegramWebApp';

type Props = {
  draft: MasterDraft;
  /** Пока грузится кабинет с API — скелетон блока. */
  cabinetLoading?: boolean;
  useCabinetApi?: boolean;
};

function LinkFieldSkeleton() {
  return (
    <div className="mt-3 animate-pulse space-y-2 rounded-[18px] bg-[#F1EFEF] p-4">
      <div className="h-3 w-3/4 max-w-[14rem] rounded bg-neutral-200/90" />
      <div className="h-4 w-full rounded bg-neutral-200/80" />
    </div>
  );
}

export function MasterBookingLinkCard({ draft, cabinetLoading, useCabinetApi }: Props) {
  const [copied, setCopied] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);

  const resolved = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return resolveMasterBookingLink(draft.profileSlug, draft.masterId, window.location.origin);
  }, [draft.profileSlug, draft.masterId]);

  useEffect(() => {
    if (!shareHint) return undefined;
    const t = window.setTimeout(() => setShareHint(null), 2000);
    return () => window.clearTimeout(t);
  }, [shareHint]);

  useEffect(() => {
    if (!copied) return undefined;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyHref = useCallback(async (href: string) => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      return;
    } catch {
      /* fall through */
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = href;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    } catch {
      setShareHint('Не удалось скопировать');
    }
  }, []);

  const onCopy = useCallback(() => {
    if (!resolved) return;
    void copyHref(resolved.href);
  }, [resolved, copyHref]);

  const onShare = useCallback(async () => {
    if (!resolved) return;
    const { href } = resolved;
    const title = 'SLOTTY — запись к мастеру';
    if (openTelegramShareUrlPicker(href, title)) return;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: title, url: href });
        return;
      } catch {
        /* отмена или ошибка */
      }
    }
    await copyHref(href);
    setShareHint('Ссылка скопирована');
  }, [resolved, copyHref]);

  const onOpen = useCallback(() => {
    if (!resolved) return;
    openTelegramOrBrowserUrl(resolved.href);
  }, [resolved]);

  const showSkeleton = Boolean(useCabinetApi && cabinetLoading);

  const btnBase =
    'flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-[14px] font-semibold transition active:scale-[0.98]';

  return (
    <div className="rounded-[26px] bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.05)] ring-1 ring-[#F1EFEF]">
      <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-neutral-950">Ссылка для записи</h2>
      <p className="mt-1.5 text-[13px] leading-snug text-neutral-500">
        Отправьте эту ссылку клиентам или добавьте её в Instagram, Telegram, TikTok или Viber
      </p>

      {showSkeleton ? (
        <LinkFieldSkeleton />
      ) : resolved ? (
        <>
          <div className="mt-3 rounded-[18px] bg-[#F1EFEF] px-4 py-3 ring-1 ring-black/[0.04]">
            <p className="break-all text-[13px] font-medium leading-relaxed text-neutral-800">{resolved.href}</p>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onCopy}
              className={`${btnBase} bg-[#E29595] text-white shadow-[0_10px_24px_rgba(226,149,149,0.28)]`}
            >
              {copied ? 'Скопировано' : 'Скопировать'}
            </button>
            <button type="button" onClick={() => void onShare()} className={`${btnBase} bg-[#F1EFEF] text-neutral-900`}>
              Поделиться
            </button>
            <button type="button" onClick={onOpen} className={`${btnBase} bg-[#F1EFEF] text-neutral-900`}>
              Открыть
            </button>
          </div>
          {shareHint ? (
            <p className="mt-2 text-center text-[12px] font-medium text-neutral-600" role="status">
              {shareHint}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-[13px] leading-relaxed text-neutral-500">
          Не удалось сформировать ссылку: укажите <code className="rounded bg-[#F1EFEF] px-1">VITE_TELEGRAM_BOT_USERNAME</code> в
          окружении или откройте приложение по HTTPS с сохранённым профилем мастера.
        </p>
      )}
    </div>
  );
}
