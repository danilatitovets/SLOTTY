import type { ReactNode } from 'react';
import { scrollToLegalSection } from './useLegalTocActiveId';

export type LegalTocItem = { id: string; label: string };

/** Боковое «Содержание» — только у длинных документов. */
export const LEGAL_DOC_TOC_MIN_SECTIONS = 8;

export function shouldShowLegalDocToc(sectionCount: number): boolean {
  return sectionCount > LEGAL_DOC_TOC_MIN_SECTIONS;
}

/** Крупная читаемая типографика (Help Center). */
export const legalDocProseClass =
  'text-[17px] font-normal leading-[1.65] text-[#374151] antialiased sm:text-[18px] sm:leading-[1.7]';

export const legalDocSectionTitleClass =
  'text-[18px] font-semibold leading-[1.35] text-[#111827] sm:text-[20px]';

export const legalDocLinkClass =
  'font-medium text-[#111827] underline decoration-[#111827]/25 underline-offset-[3px] transition hover:decoration-[#111827]';

export const legalDocListClass = 'list-disc space-y-2.5 pl-5 marker:text-[#D1D5DB]';

export function LegalDocIntro({ children }: { children: ReactNode }) {
  return <p className={`${legalDocProseClass} text-[#6B7280]`}>{children}</p>;
}

export function LegalDocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[calc(6.5rem+env(safe-area-inset-top,0px)+0.75rem)] lg:scroll-mt-[calc(var(--slotty-header-height,4.25rem)+1rem)]"
    >
      <h2 className={legalDocSectionTitleClass}>{title}</h2>
      <div className={`mt-3 space-y-3 ${legalDocProseClass}`}>{children}</div>
    </section>
  );
}

export function LegalDocSubsection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="pt-2">
      <h3 className="text-[17px] font-semibold leading-snug text-[#111827] sm:text-[18px]">{title}</h3>
      <div className={`mt-2 space-y-3 ${legalDocProseClass}`}>{children}</div>
    </div>
  );
}

export function LegalDocTocNav({
  items,
  className = '',
  activeId = '',
}: {
  items: LegalTocItem[];
  className?: string;
  activeId?: string;
}) {
  if (!items.length) return null;

  return (
    <nav className={className} aria-label="Содержание документа">
      <p className="text-[13px] font-medium uppercase tracking-[0.06em] text-[#9CA3AF]">Содержание</p>
      <ul className="mt-2 space-y-0.5">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToLegalSection(item.id);
                }}
                className={`block rounded-[6px] py-2 pl-3 text-[15px] leading-[1.5] transition sm:text-[16px] ${
                  active
                    ? 'border-l-2 border-[#111827] bg-[#FAFAFA] font-semibold text-[#111827]'
                    : 'border-l-2 border-transparent font-normal text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#111827]'
                }`}
                aria-current={active ? 'location' : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Тёмная тема — страница политики конфиденциальности. */
export const legalDocDarkProseClass =
  'text-[17px] font-normal leading-[1.65] text-white/75 antialiased sm:text-[18px] sm:leading-[1.7] [&_strong]:font-semibold [&_strong]:text-white';

export const legalDocDarkSectionTitleClass =
  'text-[18px] font-semibold leading-[1.35] text-white sm:text-[20px]';

export const legalDocDarkLinkClass =
  'font-medium text-[#ff8fa3] underline decoration-[#ff8fa3]/35 underline-offset-[3px] transition hover:text-[#ffb3c0] hover:decoration-[#ffb3c0]';

export const legalDocDarkListClass = 'list-disc space-y-2.5 pl-5 marker:text-white/25';

export function LegalDocDarkIntro({ children }: { children: ReactNode }) {
  return <p className={`${legalDocDarkProseClass} text-white/55`}>{children}</p>;
}

export function LegalDocDarkSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[calc(6.5rem+env(safe-area-inset-top,0px)+0.75rem)] lg:scroll-mt-[calc(var(--slotty-header-height,4.25rem)+1rem)]"
    >
      <h2 className={legalDocDarkSectionTitleClass}>{title}</h2>
      <div className={`mt-3 space-y-3 ${legalDocDarkProseClass}`}>{children}</div>
    </section>
  );
}

export function LegalDocDarkTocNav({
  items,
  className = '',
  activeId = '',
}: {
  items: LegalTocItem[];
  className?: string;
  activeId?: string;
}) {
  if (!items.length) return null;

  return (
    <nav className={className} aria-label="Содержание документа">
      <p className="text-[13px] font-medium uppercase tracking-[0.06em] text-white/40">Содержание</p>
      <ul className="mt-2 space-y-0.5">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToLegalSection(item.id);
                }}
                className={`block rounded-[6px] py-2 pl-3 text-[15px] leading-[1.5] transition sm:text-[16px] ${
                  active
                    ? 'border-l-2 border-[#ff5f7a] bg-white/[0.06] font-semibold text-white'
                    : 'border-l-2 border-transparent font-normal text-white/50 hover:bg-white/[0.04] hover:text-white/90'
                }`}
                aria-current={active ? 'location' : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
