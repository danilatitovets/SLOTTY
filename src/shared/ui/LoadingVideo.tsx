import type { ReactNode } from 'react';
import { LOADING_VIDEO_SRC } from './loadingVideoSrc';

const SIZE_CLASS = {
  sm: 'h-14 w-14',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
} as const;

type Size = keyof typeof SIZE_CLASS;

type LoadingVideoProps = {
  size?: Size;
  label?: string;
  className?: string;
};

export function LoadingVideo({ size = 'md', label, className = '' }: LoadingVideoProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2.5 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <video
        src={LOADING_VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        preload="auto"
        className={`${SIZE_CLASS[size]} object-contain`}
        aria-hidden
      />
      {label ? (
        <p className="max-w-[16rem] text-center text-[14px] font-medium leading-snug text-[#6B7280]">
          {label}
        </p>
      ) : (
        <span className="sr-only">Загрузка</span>
      )}
    </div>
  );
}

type LoadingScreenProps = {
  label?: string;
  className?: string;
  children?: ReactNode;
};

/** Полноэкранная загрузка (страница, роут). */
export function LoadingScreen({ label, className = '', children }: LoadingScreenProps) {
  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-12 ${className}`}
    >
      <LoadingVideo size="lg" label={label} />
      {children}
    </div>
  );
}

type LoadingPanelProps = {
  label?: string;
  className?: string;
  minHeight?: string;
};

/** Блок загрузки внутри карточки / секции. */
export function LoadingPanel({
  label,
  className = '',
  minHeight = 'min-h-[12rem]',
}: LoadingPanelProps) {
  return (
    <div
      className={`flex ${minHeight} items-center justify-center rounded-[24px] border border-[#F3F4F6] bg-white p-8 shadow-[0_8px_28px_rgba(17,24,39,0.04)] ${className}`}
    >
      <LoadingVideo label={label} />
    </div>
  );
}
