import { HiChevronRight } from 'react-icons/hi2';
import type { TimelineEvent } from './appointmentDetailHelpers';
import { formatTimelineEventTime } from './appointmentDetailHelpers';
import { apptDetailSectionLabel } from './adminAppointmentsTheme';

type Props = {
  events: TimelineEvent[];
  onReviewClick?: (reviewId?: string | null) => void;
};

function isReviewEvent(event: TimelineEvent): boolean {
  return (
    event.eventType === 'booking.review_left' ||
    event.eventType.includes('review') ||
    event.label.toLowerCase().includes('отзыв')
  );
}

function isHighlightEvent(event: TimelineEvent, index: number): boolean {
  if (index === 0) return true;
  return (
    isReviewEvent(event) ||
    event.eventType.includes('completed')
  );
}

export function MasterAppointmentTimelineBlock({ events, onReviewClick }: Props) {
  if (!events.length) return null;

  return (
    <div>
      <p className={apptDetailSectionLabel}>Хронология</p>
      <ul className="mt-3 space-y-0">
        {events.map((ev, index) => {
          const highlight = isHighlightEvent(ev, index);
          const isLast = index === events.length - 1;
          const reviewEvent = isReviewEvent(ev);
          const canOpenReview = reviewEvent && Boolean(onReviewClick);

          const cardClassName = `min-w-0 flex-1 rounded-[16px] px-3.5 py-3 ${
            highlight ? 'bg-white' : 'bg-transparent'
          } ${canOpenReview ? 'transition hover:bg-[#FAFAFA] active:scale-[0.995]' : ''}`;

          const cardBody = (
            <>
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`text-[14px] font-semibold leading-snug ${
                    highlight ? 'text-[#111827]' : 'text-[#374151]'
                  }`}
                >
                  {ev.label}
                </p>
                {canOpenReview ? (
                  <HiChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#F47C8C]" aria-hidden />
                ) : null}
              </div>
              <p className="mt-0.5 text-[12px] font-medium tabular-nums text-[#9CA3AF]">
                {formatTimelineEventTime(ev.createdAt)}
              </p>
              {canOpenReview ? (
                <p className="mt-1.5 text-[12px] font-semibold text-[#F47C8C]">Посмотреть отзыв</p>
              ) : null}
              {ev.comment?.trim() ? (
                <p className="mt-1.5 text-[13px] leading-snug text-[#6B7280]">{ev.comment.trim()}</p>
              ) : null}
            </>
          );

          return (
            <li key={`${ev.eventType}-${ev.createdAt}`} className="relative flex gap-3 pb-4 last:pb-0">
              <div className="flex w-5 shrink-0 flex-col items-center">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    highlight ? 'bg-[#F47C8C] ring-4 ring-[#FFF1F4]' : 'bg-[#D1D5DB]'
                  }`}
                  aria-hidden
                />
                {!isLast ? (
                  <span className="mt-1 w-px flex-1 bg-gradient-to-b from-[#E5E7EB] to-transparent" aria-hidden />
                ) : null}
              </div>

              {canOpenReview ? (
                <button
                  type="button"
                  onClick={() => onReviewClick?.(ev.reviewId)}
                  className={`${cardClassName} w-full text-left`}
                  aria-label="Посмотреть отзыв клиента"
                >
                  {cardBody}
                </button>
              ) : (
                <div className={cardClassName}>{cardBody}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
