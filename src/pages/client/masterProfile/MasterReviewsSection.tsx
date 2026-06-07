import { useMemo, useState } from 'react';
import { HiStar } from 'react-icons/hi2';
import { SectionHeading } from '../components/SectionHeading';
import type { DemoReview } from '../../../features/services/model/demoMasters';
import { formatReviewsCountLabel } from '../../../features/services/model/demoMasters';
import { ReviewCard } from './ReviewCard';
import { catalogPrimaryBtn, catalogPanelListClass, masterProfileCard } from './masterProfileTheme';
import {
  isPositiveReviewRating,
  ReviewSentimentIcon,
  type ReviewSentimentTone,
} from './reviewSentiment';

const PREVIEW_COUNT = 4;

type ReviewTab = 'positive' | 'negative';

type Props = {
  reviews: DemoReview[];
  onViewAll?: () => void;
  onBook?: () => void;
  layout?: 'stack' | 'desktop';
};

function averageRating(reviews: DemoReview[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
}

function ratingBreakdown(reviews: DemoReview[]): number[] {
  const buckets = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    buckets[star - 1] += 1;
  }
  return [...buckets].reverse();
}

function reviewsCountShort(n: number): string {
  return String(Math.max(0, n));
}

function ReviewSummary({
  reviews,
  compact,
}: {
  reviews: DemoReview[];
  compact?: boolean;
}) {
  const avg = averageRating(reviews);
  const breakdown = ratingBreakdown(reviews);

  return (
    <div className={compact ? 'mb-4 border-b border-[#F0F0F0] pb-4' : ''}>
      <p className="text-[40px] font-bold leading-none tracking-[-0.04em] text-[#111827]">{avg.toFixed(1)}</p>
      <div className="mt-2 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <HiStar
            key={i}
            className={`h-4 w-4 ${i < Math.round(avg) ? 'text-[#F59E0B]' : 'text-[#E5E7EB]'}`}
            aria-hidden
          />
        ))}
      </div>
      <p className="mt-2 text-[13px] text-[#6B7280]">{formatReviewsCountLabel(reviews.length)}</p>
      <div className="mt-4 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star, idx) => {
          const count = breakdown[idx];
          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-[11px] text-[#6B7280]">
              <span className="w-3">{star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F0F0F0]">
                <div className="h-full rounded-full bg-[#F47C8C]" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-right tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MasterReviewsSection({ reviews, onViewAll, onBook, layout = 'stack' }: Props) {
  const positive = useMemo(() => reviews.filter((r) => isPositiveReviewRating(r.rating)), [reviews]);
  const negative = useMemo(() => reviews.filter((r) => !isPositiveReviewRating(r.rating)), [reviews]);
  const [tab, setTab] = useState<ReviewTab>(() =>
    negative.length > 0 && positive.length === 0 ? 'negative' : 'positive',
  );
  const [expanded, setExpanded] = useState(false);

  const activeList = tab === 'positive' ? positive : negative;
  const hasMore = activeList.length > PREVIEW_COUNT;
  const visible = expanded || !hasMore ? activeList : activeList.slice(0, PREVIEW_COUNT);
  const hiddenCount = activeList.length - PREVIEW_COUNT;
  const isDesktop = layout === 'desktop';

  return (
    <section className={isDesktop ? '' : 'mt-0'}>
      <SectionHeading
        title="Отзывы"
        subtitle={reviews.length > 0 ? formatReviewsCountLabel(reviews.length) : undefined}
        linkLabel={reviews.length > 4 ? 'Смотреть все' : undefined}
        onLinkClick={onViewAll}
      />

      {reviews.length === 0 ? (
        <div className={`${masterProfileCard} px-6 py-10 text-center`}>
          <p className="text-[16px] font-semibold text-[#111827]">У мастера пока нет отзывов на Slotty</p>
          <p className="mt-2 text-[14px] text-[#6B7280]">Вы можете стать первым клиентом</p>
          {onBook ? (
            <button type="button" onClick={onBook} className={`${catalogPrimaryBtn} mt-5 min-h-11 px-6`}>
              Записаться
            </button>
          ) : null}
        </div>
      ) : (
        <div className={`${masterProfileCard} overflow-hidden`}>
          <div className={`p-5 ${isDesktop ? 'grid grid-cols-[220px_1fr] gap-6' : ''}`}>
            <ReviewSummary reviews={reviews} compact={!isDesktop} />

            <div className="min-w-0">
              <div className="flex border-b border-[#EEEEEE]" role="tablist" aria-label="Тип отзывов">
                <ReviewTabButton
                  active={tab === 'positive'}
                  tone="positive"
                  label="Положительные"
                  count={positive.length}
                  onClick={() => {
                    setTab('positive');
                    setExpanded(false);
                  }}
                />
                <ReviewTabButton
                  active={tab === 'negative'}
                  tone="negative"
                  label="Отрицательные"
                  count={negative.length}
                  onClick={() => {
                    setTab('negative');
                    setExpanded(false);
                  }}
                />
              </div>

              {activeList.length === 0 ? (
                <p className="py-10 text-center text-[14px] font-medium text-[#6B7280]">
                  {tab === 'positive'
                    ? 'Положительных отзывов пока нет'
                    : 'Отрицательных отзывов нет — отлично!'}
                </p>
              ) : (
                <ul className={catalogPanelListClass}>
                  {visible.map((review) => (
                    <li key={review.id}>
                      <ReviewCard review={review} layout="list" />
                    </li>
                  ))}
                </ul>
              )}

              {hasMore && !expanded ? (
                <div className="border-t border-[#EEEEEE] py-3">
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="w-full rounded-[10px] bg-[#F5F5F5] px-4 py-2.5 text-[14px] font-semibold text-[#374151] transition hover:bg-[#EBEBEB]"
                  >
                    Показать ещё {formatReviewsCountLabel(hiddenCount)}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ReviewTabButton({
  active,
  tone,
  label,
  count,
  onClick,
}: {
  active: boolean;
  tone: ReviewSentimentTone;
  label: string;
  count: number;
  onClick: () => void;
}) {
  const activeBorder = tone === 'positive' ? 'border-[#16A34A]' : 'border-[#EF4444]';

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`mr-6 flex min-h-12 items-center gap-2 border-b-2 pb-3 pt-4 text-[14px] font-semibold transition last:mr-0 ${
        active
          ? `${activeBorder} text-[#111827]`
          : 'border-transparent text-[#6B7280] hover:text-[#374151]'
      }`}
    >
      <ReviewSentimentIcon tone={tone} size="sm" />
      <span>
        {label} {reviewsCountShort(count)}
      </span>
    </button>
  );
}
