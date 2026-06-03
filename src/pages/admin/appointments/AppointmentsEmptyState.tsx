import type { ReactNode } from 'react';
import { NOTHING_FOUND_ILLUSTRATION_SRC } from '../../../shared/ui/nothingFoundIllustrationSrc';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import type { MiniPictureKey } from '../../../shared/ui/miniPictureSrc';
import { apptCardShell } from './adminAppointmentsTheme';

type Props = {
  title: string;
  text: string;
  hint?: string;
  action?: ReactNode;
  /** SVG-иконка вместо иллюстрации. */
  icon?: ReactNode;
  /** Мини-иллюстрация из `public/photos/minipicture`. */
  picture?: MiniPictureKey;
  /** Кастомная иллюстрация (по умолчанию «ничего не нашли.webp»). */
  illustrationSrc?: string;
};

export function AppointmentsEmptyState({
  title,
  text,
  hint,
  action,
  icon,
  picture,
  illustrationSrc = NOTHING_FOUND_ILLUSTRATION_SRC,
}: Props) {
  return (
    <section className={`${apptCardShell} flex w-full flex-col items-center justify-center px-6 py-10 text-center`}>
      {icon ? (
        icon
      ) : picture ? (
        <div className="flex w-full justify-center">
          <MiniPicture name={picture} variant="empty" className="mb-1" />
        </div>
      ) : (
        <img
          src={illustrationSrc}
          alt=""
          width={320}
          height={280}
          decoding="async"
          className="mx-auto mb-1 w-full max-w-[16.5rem] select-none object-contain"
        />
      )}
      <h3 className="mt-5 text-[18px] font-bold tracking-[-0.03em] text-[#111827]">{title}</h3>
      <p className="mt-2 max-w-[18rem] text-[15px] leading-relaxed text-[#6B7280]">{text}</p>
      {hint ? <p className="mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#9CA3AF]">{hint}</p> : null}
      {action ? <div className="mt-6 w-full max-w-[16rem]">{action}</div> : null}
    </section>
  );
}
