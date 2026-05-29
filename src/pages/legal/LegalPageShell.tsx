import type { FC, ReactNode } from 'react';
import { HiArrowLeft } from 'react-icons/hi2';
import { useLegalPageBack } from './useLegalPageBack';

export const LegalPageShell: FC<{ title: string; children: ReactNode }> = ({ title, children }) => {
  const { goBack, backLabel } = useLegalPageBack();

  return (
    <div className="min-h-dvh bg-[#F8F6F6] text-neutral-900">
      <header className="sticky top-0 z-10 border-b border-black/[0.06] bg-white/90 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex min-h-10 items-center gap-1.5 text-[14px] font-semibold text-[#E29595] transition hover:opacity-90 active:scale-[0.99]"
          >
            <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {backLabel}
          </button>
          <span className="truncate text-right text-[13px] font-medium text-neutral-500">SLOTTY</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-semibold leading-tight tracking-[-0.04em] text-neutral-950">
          {title}
        </h1>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-neutral-700">{children}</div>
      </main>
    </div>
  );
};
