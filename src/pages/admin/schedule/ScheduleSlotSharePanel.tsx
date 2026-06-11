import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiLink, HiShare } from 'react-icons/hi2';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import type { ScheduleWindowView } from './scheduleTypes';
import { buildScheduleWindowShareUrl, shareScheduleWindowLink } from './scheduleSlotShare';
import { ScheduleKpiPhotoBackdrop } from './ScheduleKpiPhotoBackdrop';

type Props = {
  masterId: string | null | undefined;
  window: ScheduleWindowView;
  services: MasterOnboardingService[];
  shareTitle: string;
};

export function ScheduleSlotSharePanel({ masterId, window, services, shareTitle }: Props) {
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const shareUrl = useMemo(
    () => buildScheduleWindowShareUrl({ masterId, window, services }),
    [masterId, services, window],
  );

  useEffect(() => {
    if (!copied) return undefined;
    const t = globalThis.setTimeout(() => setCopied(false), 1800);
    return () => globalThis.clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    if (!hint) return undefined;
    const t = globalThis.setTimeout(() => setHint(null), 2200);
    return () => globalThis.clearTimeout(t);
  }, [hint]);

  const onCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setHint('Ссылка скопирована');
    } catch {
      setHint('Не удалось скопировать');
    }
  }, [shareUrl]);

  const onShare = useCallback(async () => {
    if (!shareUrl) return;
    const result = await shareScheduleWindowLink(shareUrl, shareTitle);
    setHint(result === 'shared' ? 'Открыт диалог отправки' : 'Ссылка скопирована');
    if (result === 'copied') setCopied(true);
  }, [shareTitle, shareUrl]);

  return (
    <div className="relative overflow-hidden rounded-[16px] p-4">
      <ScheduleKpiPhotoBackdrop />

      <div className="relative z-10 space-y-3">
        <div>
          <p className="text-[14px] font-bold tracking-[-0.02em] text-[#111827] drop-shadow-sm">
            Поделиться окном
          </p>
          <p className="mt-0.5 text-[13px] font-medium text-[#4B5563] drop-shadow-sm">
            Отправьте ссылку — клиент сразу попадёт на запись в это время
          </p>
        </div>

        {!shareUrl ? (
          <p className="rounded-[10px] bg-white/80 px-3.5 py-3 text-[13px] font-medium leading-relaxed text-[#6B7280] backdrop-blur-[2px]">
            Чтобы поделиться окном, добавьте хотя бы одну услугу в каталог.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <div
                className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-white/85 px-3 backdrop-blur-[2px]"
                title={shareUrl}
              >
                <HiLink className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
                <p className="truncate text-[12px] font-medium text-[#111827]">{shareUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => void onCopy()}
                className={`flex h-11 shrink-0 items-center justify-center rounded-[10px] px-4 text-[13px] font-semibold shadow-sm transition active:scale-[0.98] ${
                  copied ? 'bg-emerald-50 text-emerald-700' : 'bg-[#3B4CCA] text-white hover:opacity-95'
                }`}
              >
                {copied ? 'Скопировано' : 'Копировать'}
              </button>
              <button
                type="button"
                onClick={() => void onShare()}
                aria-label="Поделиться ссылкой"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/85 text-[#3B4CCA] shadow-sm backdrop-blur-[2px] transition hover:bg-white active:scale-[0.98]"
              >
                <HiShare className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <p className="text-[12px] font-medium leading-relaxed text-[#4B5563] drop-shadow-sm">
              Клиент откроет экран записи с уже выбранным временем этого окна.
            </p>
          </>
        )}

        {hint ? (
          <p className="text-center text-[11px] font-semibold text-[#374151] drop-shadow-sm" role="status">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
