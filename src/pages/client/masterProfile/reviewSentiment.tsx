export type ReviewSentimentTone = 'positive' | 'neutral' | 'negative';

export function reviewSentimentTone(rating: number): ReviewSentimentTone {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

export function isPositiveReviewRating(rating: number): boolean {
  return rating >= 4;
}

const TONE_STYLES: Record<ReviewSentimentTone, { shell: string; icon: string }> = {
  positive: { shell: 'bg-[#E8F9EE]', icon: 'text-[#16A34A]' },
  neutral: { shell: 'bg-[#FFF4DE]', icon: 'text-[#D97706]' },
  negative: { shell: 'bg-[#FEECEC]', icon: 'text-[#EF4444]' },
};

const SHELL_SIZE = {
  sm: 'h-[26px] w-[26px]',
  md: 'h-[32px] w-[32px]',
} as const;

const ICON_SIZE = {
  sm: 'h-[16px] w-[16px]',
  md: 'h-[19px] w-[19px]',
} as const;

export function ReviewSentimentIcon({
  tone,
  size = 'md',
  className = '',
}: {
  tone: ReviewSentimentTone;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const { shell, icon } = TONE_STYLES[tone];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${shell} ${SHELL_SIZE[size]} ${className}`}
      aria-hidden
    >
      {tone === 'positive' ? (
        <PositiveFaceIcon className={`${ICON_SIZE[size]} ${icon}`} />
      ) : tone === 'negative' ? (
        <NegativeFaceIcon className={`${ICON_SIZE[size]} ${icon}`} />
      ) : (
        <NeutralFaceIcon className={`${ICON_SIZE[size]} ${icon}`} />
      )}
    </span>
  );
}

function PositiveFaceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="8.75" cy="10" r="1.65" fill="currentColor" />
      <circle cx="15.25" cy="10" r="1.65" fill="currentColor" />
      <path
        d="M7.5 13.75c1.35 1.65 3.05 2.5 4.5 2.5s3.15-.85 4.5-2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NeutralFaceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="8.75" cy="10" r="1.65" fill="currentColor" />
      <circle cx="15.25" cy="10" r="1.65" fill="currentColor" />
      <path d="M8 14.25h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NegativeFaceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="8.75" cy="10" r="1.65" fill="currentColor" />
      <circle cx="15.25" cy="10" r="1.65" fill="currentColor" />
      <path
        d="M7.5 16.25c1.35-1.65 3.05-2.5 4.5-2.5s3.15.85 4.5 2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
