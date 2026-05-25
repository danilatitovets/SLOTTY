import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
import { ADMIN_PROFILE_COMPLETION_PATH } from '../../../app/paths';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { cabinetCard, cabinetCardPad } from './adminProfileCabinetTheme';
import { useProfileCompletionOverview } from './useProfileCompletionOverview';

export type ProfileCompletionHandlers = {
  onEditMain: () => void;
  onGoServices: () => void;
  onGoSchedule: () => void;
  onGoAddress: () => void;
  onGoPortfolio: () => void;
  onGoRules: () => void;
};

type Props = {
  /** Оставлено для совместимости с родителями. */
  draft: MasterDraft;
  handlers?: ProfileCompletionHandlers;
  surfaceClassName?: string;
};

const defaultSurfaceClass = `${cabinetCard} ${cabinetCardPad}`;

function statusCaption(
  loading: boolean,
  percent: number,
  isComplete: boolean,
  isPublished: boolean,
  isContentComplete: boolean,
): string {
  if (loading) return 'Загрузка…';
  if (isComplete) return 'Профиль готов';
  if (isContentComplete && !isPublished) return 'Осталось опубликовать';
  if (percent > 0) return 'Дозаполните разделы из списка';
  return 'Заполните разделы профиля';
}

export function ProfileCompletionBlock({ surfaceClassName }: Props) {
  const surface = surfaceClassName ?? defaultSurfaceClass;
  const { useCabinetApi, cabinetError } = useAdminMasterCabinet();
  const { percent, showLoading, isComplete, cabinet } = useProfileCompletionOverview();

  const displayPercent = Math.min(100, Math.max(0, percent));

  if (cabinetError && useCabinetApi) {
    return (
      <section className={surface}>
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Завершение профиля</h2>
        <p className="mt-2 text-[14px] leading-snug text-[#6B7280]">
          Не удалось загрузить данные кабинета. Обновите страницу.
        </p>
      </section>
    );
  }

  const caption = statusCaption(
    showLoading,
    displayPercent,
    isComplete,
    cabinet.isPublished,
    cabinet.isContentComplete,
  );

  const linkLabel = isComplete ? 'Подробнее' : 'Список разделов';

  return (
    <section className={surface}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-[#111827] lg:text-[17px]">
          Завершение профиля
        </h2>
        <span className="text-[15px] font-semibold tabular-nums text-[#F47C8C]">
          {showLoading ? '…' : `${displayPercent}%`}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F7F7F8] lg:mt-3 lg:h-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#F47C8C] to-[#F26D83] transition-[width] duration-500"
          style={{ width: showLoading ? '0%' : `${displayPercent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 lg:mt-3">
        <p className="min-w-0 text-[13px] leading-snug text-[#6B7280] lg:text-[14px]">{caption}</p>
        <Link
          to={ADMIN_PROFILE_COMPLETION_PATH}
          className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-[#F47C8C] no-underline transition hover:text-[#e84d68] lg:text-[14px]"
        >
          {linkLabel}
          <HiArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
