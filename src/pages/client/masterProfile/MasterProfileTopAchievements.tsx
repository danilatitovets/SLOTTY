import { useCallback, useEffect, useState } from 'react';
import { HiTrophy, HiXMark } from 'react-icons/hi2';
import { MASTER_ACHIEVEMENTS_EMPTY_ART } from '../lib/masterAchievementAssets';
import { MASTER_ACHIEVEMENT_VISUALS } from '../lib/masterAchievementPresentation';
import type { MasterTopAchievement } from '../lib/resolveMasterTopRankStatus';
import { catalogDesktopPanel, masterProfileCard, masterProfileSectionTitle } from './masterProfileTheme';

type Props = {
  achievements: MasterTopAchievement[];
  layout?: 'stack' | 'desktop';
  ready?: boolean;
  /** Только сетка карточек — для bottom sheet в кабинете. */
  bare?: boolean;
};

function AchievementExplainModal({
  achievement,
  onClose,
}: {
  achievement: MasterTopAchievement;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const visual = MASTER_ACHIEVEMENT_VISUALS[achievement.id];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#111827]/35 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-explain-title"
        className={`w-full max-w-md overflow-hidden rounded-[24px] ${masterProfileCard}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-32 overflow-hidden bg-[#FFF1F4]">
          <img
            src={visual.artSrc}
            alt=""
            className="h-full w-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        </div>
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p id="achievement-explain-title" className="text-[17px] font-bold text-[#111827]">
                {achievement.tooltipTitle}
              </p>
              <p className="mt-0.5 text-[14px] font-semibold text-[#F47C8C]">{achievement.title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[#6B7280] transition hover:bg-[#EBEBEB]"
            >
              <HiXMark className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <p className="text-[14px] leading-relaxed text-[#4B5563]">{achievement.tooltipBody}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-[12px] bg-[#FFF1F4] px-4 py-3 text-[14px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EC]"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}

function AchievementCard({
  achievement,
  onExplain,
}: {
  achievement: MasterTopAchievement;
  onExplain: (achievement: MasterTopAchievement) => void;
}) {
  const visual = MASTER_ACHIEVEMENT_VISUALS[achievement.id];

  return (
    <button
      type="button"
      onClick={() => onExplain(achievement)}
      className="group relative flex h-[120px] w-full min-w-0 overflow-hidden rounded-[20px] bg-white text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(244,124,140,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C8C]/30 active:scale-[0.99] sm:h-[124px]"
    >
      <img
        src={visual.artSrc}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="absolute inset-y-0 right-0 h-full w-[52%] object-cover object-right transition duration-200 group-hover:scale-[1.02]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-white from-[58%] via-white/98 via-[68%] to-transparent to-[88%]"
        aria-hidden
      />
      <div
        className={`absolute inset-y-0 left-0 w-[58%] ${visual.cardClass} opacity-[0.35]`}
        aria-hidden
      />

      <div className="relative z-10 flex h-full min-w-0 max-w-[58%] flex-col justify-between p-3.5 sm:p-4">
        <div className="min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-[0.04em] ${visual.metaClass}`}>
            {achievement.meta}
          </p>
          <p className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.02em] text-[#111827]">
            {achievement.title}
          </p>
        </div>
        <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-snug text-[#374151]">
          {achievement.description}
        </p>
      </div>

      <span className="absolute bottom-3 right-3 z-10 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-[#6B7280] opacity-0 shadow-sm transition group-hover:opacity-100">
        Подробнее
      </span>
    </button>
  );
}

function AchievementGrid({
  achievements,
  onExplain,
}: {
  achievements: MasterTopAchievement[];
  onExplain: (achievement: MasterTopAchievement) => void;
}) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          className="w-[min(280px,78vw)] shrink-0 snap-start sm:w-auto sm:min-w-0"
        >
          <AchievementCard achievement={achievement} onExplain={onExplain} />
        </div>
      ))}
    </div>
  );
}

export function MasterProfileTopAchievements({
  achievements,
  layout = 'stack',
  ready = true,
  bare = false,
}: Props) {
  const isDesktop = layout === 'desktop';
  const [explaining, setExplaining] = useState<MasterTopAchievement | null>(null);

  const closeExplain = useCallback(() => setExplaining(null), []);

  if (!ready) {
    return null;
  }

  if (bare) {
    if (achievements.length === 0) {
      return (
        <div className="flex justify-center py-2">
          <img
            src={MASTER_ACHIEVEMENTS_EMPTY_ART}
            alt="Достижения появятся после первых записей и отзывов"
            className="h-auto w-full max-w-[320px] object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      );
    }

    return (
      <>
        <AchievementGrid achievements={achievements} onExplain={setExplaining} />
        {explaining ? (
          <AchievementExplainModal achievement={explaining} onClose={closeExplain} />
        ) : null}
      </>
    );
  }

  if (achievements.length === 0) {
    return (
      <section className={isDesktop ? '' : 'mt-0'}>
        <div className={`${catalogDesktopPanel} px-5 py-6`}>
          <p className="text-[15px] font-semibold text-[#111827]">Достижения</p>
          <div className="mt-4 flex justify-center">
            <img
              src={MASTER_ACHIEVEMENTS_EMPTY_ART}
              alt="Достижения появятся после первых записей и отзывов"
              className="h-auto w-full max-w-[360px] object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={isDesktop ? '' : 'mt-0'}>
      <div className={`${catalogDesktopPanel} p-4 sm:p-5`}>
        <div className="mb-4 flex items-start gap-2.5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[#F47C8C]">
            <HiTrophy className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className={masterProfileSectionTitle}>Достижения</h2>
            <p className="mt-0.5 text-[14px] text-[#6B7280]">
              Топы недели и месяца, рейтинг и отзывы в Slotty
            </p>
          </div>
        </div>

        <AchievementGrid achievements={achievements} onExplain={setExplaining} />
      </div>

      {explaining ? (
        <AchievementExplainModal achievement={explaining} onClose={closeExplain} />
      ) : null}
    </section>
  );
}
