import type { FC } from 'react';
import { HOME_FAQ_ITEMS } from './home/homeFaqContent';

export const HomeFaq: FC = () => {
  return (
    <section id="faq" className="mt-14 scroll-mt-28 sm:mt-16" style={{ animationDelay: '100ms' }}>
      <div className="mx-auto max-w-[40rem] px-0.5 text-center">
        <h2 className="text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]">
          Частые вопросы
        </h2>
      </div>

      <div className="mt-8 space-y-2.5 sm:mt-10">
        {HOME_FAQ_ITEMS.map((item) => (
          <details
            key={item.key}
            className="group rounded-full bg-[#F1EFEF] px-5 py-4 shadow-[0_4px_18px_rgba(17,24,39,0.04)] transition-[border-radius] duration-200 group-open:rounded-[2rem] sm:px-6"
          >
            <summary
              className="cursor-pointer list-none text-left text-[15px] font-semibold tracking-tight text-[#111827] [&::-webkit-details-marker]:hidden"
            >
              <span className="flex items-center justify-between gap-3">
                {item.q}
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-lg font-light leading-none text-[#9CA3AF] transition group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </span>
            </summary>

            <p className="mt-3 text-left text-[14px] leading-relaxed text-[#6B7280] sm:text-[15px]">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
};
