import { useCallback, useMemo, useRef, useState } from 'react';
import {
  HiArrowTrendingUp,
  HiChatBubbleLeftRight,
  HiCheckCircle,
  HiExclamationTriangle,
  HiStar,
} from 'react-icons/hi2';
import { OverviewRatingChart } from './OverviewRatingChart';
import {
  computeReputationFromReviews,
  trySaveMasterReviewReply,
  type MasterOverviewReview,
} from './overviewReputationDemo';
import { formatReviewDayMonthRu } from './overviewFormat';
import { ratingToneFromValue, ratingToneUi } from './overviewRatingTone';
import {
  MINI_PICTURE,
  overviewCard,
  overviewDesktopCard,
  overviewDesktopCardPad,
  overviewIconCircle,
} from './adminOverviewTheme';
import { OverviewKpiCarousel, OverviewKpiStatCard } from './OverviewKpiBlocks';
import type { OverviewPeriodPreset } from './overviewAnalytics';
import { overviewPeriodLabel } from './overviewAnalytics';
import {
  OverviewHeroActionButton,
  OverviewDividedMetricsGrid,
  OverviewEmptyMetricCell,
  OverviewEmptyTabHero,
  OverviewMetricHeroPlaque,
} from './OverviewSharedUi';

type ReputationPanelProps = {
  data: import('./overviewReputationDemo').ReputationAnalyticsPayload;
  periodPreset: OverviewPeriodPreset;
  periodStart?: string;
  periodEnd?: string;
  useApi?: boolean;
  onReplied?: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
};

function reviewsCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return `${n} отзывов`;
  if (mod10 === 1) return `${n} отзыв`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} отзыва`;

  return `${n} отзывов`;
}

function unansweredActionLabel(n: number): string {
  if (n === 1) return 'Ответить на 1 отзыв';

  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return `Ответить на ${n} отзывов`;
  if (mod10 >= 2 && mod10 <= 4) return `Ответить на ${n} отзыва`;

  return `Ответить на ${n} отзывов`;
}

function RatingStars({
  value,
  light = false,
  size = 'md',
}: {
  value: number;
  light?: boolean;
  size?: 'sm' | 'md';
}) {
  const rounded = Math.round(value);
  const tone = ratingToneFromValue(value);
  const starClass = light ? 'text-white' : ratingToneUi[tone].stars;
  const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className={`flex items-center justify-center gap-0.5 ${starClass}`} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <HiStar
          key={i}
          className={`${starSize} ${i <= rounded ? 'opacity-100' : 'opacity-25'}`}
        />
      ))}
    </div>
  );
}

function ReputationRatingMetricCell({ average }: { average: number }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF] sm:text-[11px]">
        Рейтинг
      </p>
      <p className="mt-2 text-[clamp(1.5rem,4vw,1.875rem)] font-black tabular-nums leading-none tracking-[-0.06em] text-[#111827]">
        {average.toFixed(1)}
      </p>
      <div className="mt-2">
        <RatingStars value={average} size="sm" />
      </div>
    </div>
  );
}

function TrendText({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-[#9CA3AF]">без изменений</span>;
  }

  const sign = delta > 0 ? '+' : '';

  return (
    <span className={delta > 0 ? 'text-[#16A34A]' : 'text-[#EF4444]'}>
      {sign}
      {delta} к прошлому периоду
    </span>
  );
}

function SoftIcon({
  children,
  tone = 'pink',
}: {
  children: React.ReactNode;
  tone?: 'pink' | 'green' | 'yellow';
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-[#ECFDF3] text-[#22C55E]'
      : tone === 'yellow'
        ? 'bg-[#FFF7ED] text-[#F59E0B]'
        : 'bg-[#FFF1F4] text-[#ff5f7a]';

  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${toneClass}`}
    >
      {children}
    </span>
  );
}

function ReputationEmptyMetricsStrip({
  average,
  reviewsCount,
  newReviewsInPeriod,
  unansweredReviews,
}: {
  average: number;
  reviewsCount: number;
  newReviewsInPeriod: number;
  unansweredReviews: number;
}) {
  return (
    <OverviewDividedMetricsGrid>
      <ReputationRatingMetricCell average={average} />
      <OverviewEmptyMetricCell label="Отзывов" value={String(reviewsCount)} hint="Всего" />
      <OverviewEmptyMetricCell
        label="Новые"
        value={String(newReviewsInPeriod)}
        hint="За период"
      />
      <OverviewEmptyMetricCell
        label="Без ответа"
        value={String(unansweredReviews)}
        hint={unansweredReviews > 0 ? 'Нужен ответ' : 'Всё ок'}
      />
    </OverviewDividedMetricsGrid>
  );
}

function ReputationMetricsCarousel({
  average,
  ratingUi,
  reviewsCount,
  totalReviewsDelta,
  newReviewsInPeriod,
  newReviewsDelta,
  unansweredReviews,
}: {
  average: number;
  ratingUi: (typeof ratingToneUi)[keyof typeof ratingToneUi];
  reviewsCount: number;
  totalReviewsDelta: number;
  newReviewsInPeriod: number;
  newReviewsDelta: number;
  unansweredReviews: number;
}) {
  return (
    <OverviewKpiCarousel>
      <OverviewKpiStatCard
        surface="carousel"
        label="Средний рейтинг"
        value={`${average.toFixed(1)} / 5`}
        hint={`На основе ${reviewsCountLabel(reviewsCount)}`}
        icon={<HiStar className={`h-5 w-5 ${ratingUi.stars}`} aria-hidden />}
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Всего отзывов"
        value={String(reviewsCount)}
        hint={<TrendText delta={totalReviewsDelta} />}
        icon={<HiChatBubbleLeftRight className="h-5 w-5" aria-hidden />}
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Новые отзывы"
        value={String(newReviewsInPeriod)}
        hint={<TrendText delta={newReviewsDelta} />}
        icon={<HiArrowTrendingUp className="h-5 w-5" aria-hidden />}
      />
      <OverviewKpiStatCard
        surface="carousel"
        label="Без ответа"
        value={String(unansweredReviews)}
        hint={unansweredReviews > 0 ? 'Нужен ваш ответ' : 'Всё отвечено'}
        icon={<HiExclamationTriangle className="h-5 w-5" aria-hidden />}
      />
    </OverviewKpiCarousel>
  );
}

function ReputationHeroPlaque({
  average,
  reviewsCount,
  unansweredReviews,
  onScrollToUnanswered,
  periodPreset,
}: {
  average: number;
  reviewsCount: number;
  unansweredReviews: number;
  onScrollToUnanswered: () => void;
  periodPreset: OverviewPeriodPreset;
}) {
  const period = overviewPeriodLabel(periodPreset);

  return (
    <OverviewMetricHeroPlaque
      value={
        <div className="flex flex-wrap items-end gap-4">
          <p className="text-[48px] font-black leading-none tabular-nums tracking-[-0.08em] text-[#111827] lg:text-[64px]">
            {average.toFixed(1)}
          </p>
          <div className="pb-1">
            <RatingStars value={average} />
            <p className="mt-2 text-[13px] font-semibold text-[#6B7280]">
              на основе {reviewsCountLabel(reviewsCount)}
            </p>
          </div>
        </div>
      }
      caption={
        <p className="max-w-[660px] text-[15px] font-semibold leading-relaxed text-[#6B7280] lg:text-[16px]">
          Отзывы и рейтинг за {period.toLowerCase()}. Отвечайте клиентам — это влияет на запись.
        </p>
      }
      action={
        unansweredReviews > 0 ? (
          <OverviewHeroActionButton onClick={onScrollToUnanswered}>
            {unansweredActionLabel(unansweredReviews)}
          </OverviewHeroActionButton>
        ) : undefined
      }
    />
  );
}

function ReputationHeroShell({
  children,
  average,
  reviewsCount,
  unansweredReviews,
  onScrollToUnanswered,
  periodPreset,
}: {
  children: React.ReactNode;
  average: number;
  reviewsCount: number;
  unansweredReviews: number;
  onScrollToUnanswered: () => void;
  periodPreset: OverviewPeriodPreset;
}) {
  return (
    <div className={`overflow-hidden ${overviewDesktopCard}`}>
      <ReputationHeroPlaque
        average={average}
        reviewsCount={reviewsCount}
        unansweredReviews={unansweredReviews}
        onScrollToUnanswered={onScrollToUnanswered}
        periodPreset={periodPreset}
      />
      <div className="overflow-hidden bg-white px-3 pb-4 pt-1 sm:px-4">{children}</div>
    </div>
  );
}

function ReviewReplyBlock({
  review,
  onReplied,
  onReply,
}: {
  review: MasterOverviewReview;
  onReplied: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const canSubmit = text.trim().length > 0;

  if (review.masterReply) {
    return (
      <div className="mt-4 rounded-[18px] bg-[#FFF7F9] p-4 ring-1 ring-[#FFE1E8]">
        <p className="text-[11px] font-black uppercase tracking-wide text-[#ff5f7a]">
          Ваш ответ
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">
          {review.masterReply}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError('');
        }}
        rows={3}
        placeholder="Напишите аккуратный ответ клиенту…"
        className="w-full resize-none rounded-[18px] border border-[#EEF0F5] bg-[#F9FAFB] px-4 py-3 text-[13px] font-medium text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#ff9aad] focus:bg-white focus:ring-4 focus:ring-[#FFF1F4]"
      />

      {error ? (
        <p className="text-[12px] font-bold text-[#EF4444]">{error}</p>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit}
        className="w-full rounded-[18px] bg-[#ff5f7a] px-5 py-3 text-[14px] font-black text-white transition hover:bg-[#f04f6c] disabled:cursor-not-allowed disabled:opacity-45"
        onClick={() => {
          void (async () => {
            if (onReply) {
              try {
                await onReply(review.id, text);
                setText('');
                onReplied();
              } catch (e) {
                if (e instanceof Error && e.message === 'ALREADY_REPLIED') {
                  setError('На этот отзыв уже можно ответить только один раз.');
                } else {
                  setError('Не удалось отправить ответ.');
                }
                onReplied();
              }
              return;
            }

            const result = trySaveMasterReviewReply(review.id, text);

            if (!result.ok) {
              if (result.reason === 'already_replied') {
                setError('На этот отзыв уже можно ответить только один раз.');
              } else {
                setError('Не удалось отправить ответ.');
              }
              onReplied();
              return;
            }

            setText('');
            onReplied();
          })();
        }}
      >
        Ответить клиенту
      </button>
    </div>
  );
}

function ReviewCard({
  review,
  onReplied,
  onReply,
  showReply = true,
}: {
  review: MasterOverviewReview;
  onReplied: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
  showReply?: boolean;
}) {
  return (
    <article className="rounded-[24px] bg-[#F9FAFB] p-4 ring-1 ring-[#EEF0F5]">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ff5f7a] text-[15px] font-black text-white">
          {review.authorInitial}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[15px] font-black text-[#111827]">
              {review.author}
            </p>

            <p className="text-[12px] font-semibold text-[#9CA3AF]">
              {formatReviewDayMonthRu(review.dateIso)}
            </p>
          </div>

          <div className="mt-1">
            <RatingStars value={review.rating} />
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-[#374151]">
            {review.text}
          </p>
        </div>
      </div>

      {showReply ? (
        <ReviewReplyBlock review={review} onReplied={onReplied} onReply={onReply} />
      ) : null}
    </article>
  );
}

function RatingChartCard({
  data,
  ratingTone,
}: {
  data: import('./overviewReputationDemo').ReputationAnalyticsPayload;
  ratingTone: ReturnType<typeof ratingToneFromValue>;
}) {
  const trendBadge =
    data.ratingTrendPercent !== null && data.ratingTrend === 'up' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-3 py-1.5 text-[12px] font-black text-[#16A34A]">
        <HiArrowTrendingUp className="h-4 w-4" />
        +{data.ratingTrendPercent}%
      </span>
    ) : null;

  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Динамика рейтинга
          </h2>

          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            {data.ratingDelta !== null
              ? `${data.ratingDelta >= 0 ? '+' : ''}${data.ratingDelta.toFixed(
                  1,
                )} к прошлому периоду`
              : 'Средний рейтинг по дням'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {trendBadge}
          <span className={`${overviewIconCircle} h-11 w-11 rounded-[18px]`}>
            <HiStar className="h-5 w-5" aria-hidden />
          </span>
        </div>
      </div>

      <OverviewRatingChart stats={data.ratingByDay} tone={ratingTone} size="large" />

      {data.chartIsTruncated ? (
        <p className="mt-4 text-[12px] leading-snug text-[#9CA3AF]">
          График показывает последние 90 дней, итоги — за выбранный период.
        </p>
      ) : null}
    </section>
  );
}

function LatestReviewCard({
  review,
  onReplied,
  onReply,
}: {
  review: MasterOverviewReview;
  onReplied: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
}) {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Последний отзыв
          </h2>

          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            Ответ можно отправить только один раз.
          </p>
        </div>

        <SoftIcon>
          <HiChatBubbleLeftRight className="h-6 w-6" />
        </SoftIcon>
      </div>

      <ReviewCard review={review} onReplied={onReplied} onReply={onReply} />
    </section>
  );
}

function ReputationTrustCard() {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="flex items-start justify-between gap-4 lg:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <SoftIcon tone="green">
            <HiCheckCircle className="h-6 w-6" aria-hidden />
          </SoftIcon>

          <div className="min-w-0">
            <h2 className="text-[20px] font-black tracking-[-0.05em] text-[#111827] sm:text-[22px]">
              Отвечайте на отзывы
            </h2>
            <p className="mt-3 max-w-[42rem] text-[14px] leading-7 text-[#6B7280]">
              Вежливый ответ повышает доверие и помогает новым клиентам записаться.
            </p>
          </div>
        </div>

        <img
          src={MINI_PICTURE.reviewsEmpty}
          alt=""
          decoding="async"
          className="h-[72px] w-auto max-w-[38%] shrink-0 object-contain object-top sm:h-[100px] sm:max-w-none lg:h-[112px]"
        />
      </div>

      <div className="mt-5 rounded-[12px] bg-[#F6F7FB] p-5 ring-1 ring-[#EEEEEE]/80 lg:mt-6 lg:rounded-[16px] lg:ring-0">
        <p className="text-[14px] font-black text-[#111827]">Что важно смотреть?</p>
        <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">
          Стабильный рейтинг, новые отзывы и быстрые ответы — главные сигналы качества
          для клиентов в каталоге.
        </p>
      </div>
    </section>
  );
}

type ReviewSentimentTab = 'good' | 'poor';

function reviewSentimentTabLabel(tab: ReviewSentimentTab, count: number): string {
  if (tab === 'good') return count > 0 ? `Хорошие · ${count}` : 'Хорошие';
  return count > 0 ? `Требуют внимания · ${count}` : 'Требуют внимания';
}

function isGoodReview(rating: number): boolean {
  return rating >= 4;
}

function MasterReviewsBySentimentCard({
  reviews,
  onReplied,
  onReply,
}: {
  reviews: MasterOverviewReview[];
  onReplied: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
}) {
  const good = useMemo(() => reviews.filter((r) => isGoodReview(r.rating)), [reviews]);
  const poor = useMemo(() => reviews.filter((r) => !isGoodReview(r.rating)), [reviews]);
  const [tab, setTab] = useState<ReviewSentimentTab>(() =>
    poor.length > 0 && good.length === 0 ? 'poor' : 'good',
  );
  const list = tab === 'good' ? good : poor;

  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">Все отзывы</h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            4–5★ — хорошие, 1–3★ — требуют внимания и ответа.
          </p>
        </div>
        <SoftIcon>
          <HiStar className="h-6 w-6" />
        </SoftIcon>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Тип отзывов">
        {(['good', 'poor'] as const).map((id) => {
          const count = id === 'good' ? good.length : poor.length;
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                active
                  ? id === 'good'
                    ? 'bg-[#ECFDF5] text-[#059669] ring-1 ring-[#A7F3D0]'
                    : 'bg-[#FFF1F4] text-[#F47C8C] ring-1 ring-[#FDE8ED]'
                  : 'bg-white text-[#6B7280] ring-1 ring-[#E5E7EB] hover:bg-[#FAFAFA]'
              }`}
              onClick={() => setTab(id)}
            >
              {reviewSentimentTabLabel(id, count)}
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="rounded-[16px] bg-[#FAFAFA] px-4 py-8 text-center text-[14px] text-[#6B7280]">
          {tab === 'good' ? 'Пока нет отзывов 4–5★ за период' : 'Нет отзывов 1–3★ — отлично!'}
        </p>
      ) : (
        <div className="space-y-4">
          {list.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onReplied={onReplied}
              onReply={onReply}
              showReply
            />
          ))}
        </div>
      )}
    </section>
  );
}

function UnansweredReviewsCard({
  reviews,
  onReplied,
  onReply,
}: {
  reviews: MasterOverviewReview[];
  onReplied: () => void;
  onReply?: (reviewId: string, text: string) => Promise<void>;
}) {
  return (
    <section className={`${overviewDesktopCard} ${overviewDesktopCardPad}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
            Отзывы без ответа
          </h2>

          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            Отвечайте спокойно и профессионально. Ответ изменить нельзя.
          </p>
        </div>

        <SoftIcon tone="yellow">
          <HiExclamationTriangle className="h-6 w-6" />
        </SoftIcon>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onReplied={onReplied}
            onReply={onReply}
          />
        ))}
      </div>
    </section>
  );
}

function EmptyReputationPanel({ periodPreset }: { periodPreset: OverviewPeriodPreset }) {
  const period = overviewPeriodLabel(periodPreset);

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden lg:space-y-8">
      <OverviewEmptyTabHero
        metrics={
          <ReputationEmptyMetricsStrip
            average={0}
            reviewsCount={0}
            newReviewsInPeriod={0}
            unansweredReviews={0}
          />
        }
        title="Отзывов пока нет"
        caption={`После первых оценок здесь появятся рейтинг, динамика и отзывы за ${period.toLowerCase()}.`}
      />

      <section className={`${overviewCard} p-5 sm:p-8`}>
        <div className="flex items-start justify-between gap-4 lg:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            <span className={`${overviewIconCircle} h-10 w-10 shrink-0 rounded-[16px] sm:h-11 sm:w-11 sm:rounded-[18px]`}>
              <HiStar className="h-5 w-5" aria-hidden />
            </span>

            <div className="min-w-0">
              <h2 className="pt-0.5 text-[18px] font-black leading-snug tracking-[-0.05em] text-[#111827] sm:text-[22px] sm:leading-tight">
                Как повысить доверие
              </h2>

              <p className="mt-3 max-w-[42rem] text-[14px] leading-[1.65] text-[#6B7280] sm:mt-4 sm:leading-7">
                Заполните профиль, добавьте портфолио, услуги, график и правила записи.
                Когда клиенты начнут оставлять отзывы, отвечайте им в спокойном и дружелюбном стиле.
              </p>
            </div>
          </div>

          <img
            src={MINI_PICTURE.trust}
            alt=""
            decoding="async"
            className="h-[72px] w-auto max-w-[38%] shrink-0 object-contain object-top sm:h-[100px] sm:max-w-none lg:h-[112px]"
          />
        </div>
      </section>
    </div>
  );
}

export function OverviewReputationPanel({
  data: dataProp,
  periodPreset,
  periodStart,
  periodEnd,
  useApi = false,
  onReplied,
  onReply,
}: ReputationPanelProps) {
  const unansweredRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

  const refreshLocal = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  const refresh = onReplied ?? refreshLocal;

  const dataFromPeriod = useMemo(() => {
    if (useApi || !periodStart || !periodEnd) return null;

    void tick;

    return computeReputationFromReviews(periodStart, periodEnd);
  }, [periodEnd, periodStart, tick, useApi]);

  const data = useApi ? dataProp : dataFromPeriod ?? dataProp;

  const unansweredExceptLatest = useMemo(() => {
    const latestId = data.latestReview?.id;

    return data.unansweredList.filter((review) => review.id !== latestId);
  }, [data.latestReview?.id, data.unansweredList]);

  if (!data.hasReviews) {
    return <EmptyReputationPanel periodPreset={periodPreset} />;
  }

  const average = data.averageRating ?? 0;
  const ratingTone = ratingToneFromValue(average);
  const ratingUi = ratingToneUi[ratingTone];

  const scrollToUnanswered = () =>
    unansweredRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden lg:space-y-8">
      <ReputationHeroShell
        average={average}
        reviewsCount={data.reviewsCount}
        unansweredReviews={data.unansweredReviews}
        onScrollToUnanswered={scrollToUnanswered}
        periodPreset={periodPreset}
      >
        <ReputationMetricsCarousel
          average={average}
          ratingUi={ratingUi}
          reviewsCount={data.reviewsCount}
          totalReviewsDelta={data.totalReviewsDelta}
          newReviewsInPeriod={data.newReviewsInPeriod}
          newReviewsDelta={data.newReviewsDelta}
          unansweredReviews={data.unansweredReviews}
        />
      </ReputationHeroShell>

      <RatingChartCard data={data} ratingTone={ratingTone} />

      <MasterReviewsBySentimentCard
        reviews={data.reviews}
        onReplied={refresh}
        onReply={onReply}
      />

      <section className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        {data.latestReview ? (
          <LatestReviewCard
            review={data.latestReview}
            onReplied={refresh}
            onReply={onReply}
          />
        ) : (
          <section className={`${overviewDesktopCard} ${overviewDesktopCardPad} h-full`}>
            <div className="flex items-start gap-3">
              <span className={`${overviewIconCircle} h-11 w-11 shrink-0 rounded-[18px]`}>
                <HiChatBubbleLeftRight className="h-5 w-5" aria-hidden />
              </span>

              <div>
                <h2 className="text-[22px] font-black tracking-[-0.05em] text-[#111827]">
                  Последний отзыв
                </h2>

                <p className="mt-2 text-[14px] leading-7 text-[#6B7280]">
                  Когда клиент оставит отзыв, он появится здесь.
                </p>
              </div>
            </div>
          </section>
        )}

        <ReputationTrustCard />
      </section>

      {unansweredExceptLatest.length > 0 ? (
        <div ref={unansweredRef}>
          <UnansweredReviewsCard
            reviews={unansweredExceptLatest}
            onReplied={refresh}
            onReply={onReply}
          />
        </div>
      ) : data.unansweredReviews > 0 && data.latestReview ? (
        <div ref={unansweredRef} />
      ) : null}
    </div>
  );
}