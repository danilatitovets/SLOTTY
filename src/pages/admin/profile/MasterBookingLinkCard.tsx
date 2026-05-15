import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiArrowTopRightOnSquare, HiCheck, HiClipboardDocument, HiShare } from 'react-icons/hi2';
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
    <div className="mt-2.5 flex animate-pulse items-center gap-2">
      <div className="h-9 min-w-0 flex-1 rounded-2xl bg-[#F1EFEF]" />
      <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200/80" />
      <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200/80" />
      <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200/80" />
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

  const iconBtn =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition active:scale-[0.94] disabled:opacity-40';

  const statusLine = copied ? 'Скопировано' : shareHint;

  return (
    <div className="rounded-[22px] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(17,17,17,0.04)] ring-1 ring-[#F1EFEF]">
      <h2 className="text-[15px] font-semibold tracking-[-0.03em] text-neutral-950">Ссылка для записи</h2>
      <p className="mt-0.5 text-[11px] leading-snug text-neutral-500 line-clamp-2">
        Отправьте клиентам или добавьте в соцсети
      </p>

      {showSkeleton ? (
        <LinkFieldSkeleton />
      ) : resolved ? (
        <>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="min-w-0 flex-1 rounded-2xl bg-[#F1EFEF] px-3 py-2 ring-1 ring-black/[0.04]">
              <p className="truncate text-[12px] font-medium text-neutral-800" title={resolved.href}>
                {resolved.href}
              </p>
            </div>
            <button
              type="button"
              onClick={onCopy}
              aria-label={copied ? 'Скопировано' : 'Скопировать ссылку'}
              className={`${iconBtn} ${
                copied ? 'bg-emerald-500/15 text-emerald-700' : 'bg-[#E29595] text-white shadow-[0_6px_16px_rgba(226,149,149,0.28)]'
              }`}
            >
              {copied ? <HiCheck className="h-[19px] w-[19px]" strokeWidth={2.25} /> : <HiClipboardDocument className="h-[19px] w-[19px]" />}
            </button>
            <button
              type="button"
              onClick={() => void onShare()}
              aria-label="Поделиться ссылкой"
              className={`${iconBtn} bg-[#F1EFEF]`}
            >
              <HiShare className="h-[19px] w-[19px]" />
            </button>
            <button type="button" onClick={onOpen} aria-label="Открыть ссылку" className={`${iconBtn} bg-[#F1EFEF]`}>
              <HiArrowTopRightOnSquare className="h-[19px] w-[19px]" />
            </button>
          </div>
          {statusLine ? (
            <p className="mt-1.5 text-center text-[11px] font-medium text-neutral-600" role="status">
              {statusLine}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-[12px] leading-snug text-neutral-500">
          Не удалось сформировать ссылку: укажите <code className="rounded bg-[#F1EFEF] px-1">VITE_TELEGRAM_BOT_USERNAME</code> в
          окружении или откройте приложение по HTTPS с сохранённым профилем мастера.
        </p>
      )}
    </div>
  );
}
