import { useEffect, useState } from 'react';

const BOTTOM_EPS = 24;

function getLegalDocHeaderOffset(): number {
  if (typeof window === 'undefined') return 100;
  const css = getComputedStyle(document.documentElement).getPropertyValue('--slotty-header-height');
  const parsed = parseFloat(css);
  if (window.matchMedia('(min-width: 1024px)').matches && Number.isFinite(parsed) && parsed > 0) {
    return parsed + 16;
  }
  return 112;
}

export const LEGAL_DOC_HEADER_OFFSET = 100;

type ScrollContext = {
  el: HTMLElement | Window;
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
};

function getScrollContext(): ScrollContext {
  const main = document.querySelector<HTMLElement>('main.overflow-y-auto');
  if (main && main.scrollHeight > main.clientHeight + 8) {
    return {
      el: main,
      scrollTop: main.scrollTop,
      clientHeight: main.clientHeight,
      scrollHeight: main.scrollHeight,
    };
  }
  return {
    el: window,
    scrollTop: window.scrollY,
    clientHeight: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
  };
}

function resolveActiveSectionId(sectionIds: string[]): string {
  if (!sectionIds.length) return '';

  const probeY = getLegalDocHeaderOffset() + 12;
  const { scrollTop, clientHeight, scrollHeight } = getScrollContext();
  const isScrollable = scrollHeight > clientHeight + 48;
  const atBottom = isScrollable && scrollTop > 16 && scrollTop + clientHeight >= scrollHeight - BOTTOM_EPS;

  if (!atBottom) {
    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const id = sectionIds[i]!;
      const el = document.getElementById(id);
      if (!el) continue;
      const { top, bottom } = el.getBoundingClientRect();
      if (top <= probeY && bottom > probeY) return id;
    }

    const firstEl = document.getElementById(sectionIds[0]!);
    if (firstEl && firstEl.getBoundingClientRect().top > probeY) {
      return sectionIds[0]!;
    }
  }

  if (atBottom) {
    return sectionIds[sectionIds.length - 1]!;
  }

  let current = sectionIds[0]!;
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= probeY) current = id;
  }
  return current;
}

function getScrollTarget(): HTMLElement | Window {
  const ctx = getScrollContext();
  return ctx.el;
}

/** Подсветка содержания по прокрутке (учитывает scroll внутри main кабинета). */
export function useLegalTocActiveId(sectionIds: string[]): string {
  const [activeId, setActiveId] = useState(() => sectionIds[0] ?? '');

  useEffect(() => {
    if (!sectionIds.length) return;

    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setActiveId(resolveActiveSectionId(sectionIds));
      });
    };

    update();
    const target = getScrollTarget();
    target.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [sectionIds.join('|')]);

  return activeId;
}

export function scrollToLegalSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const ctx = getScrollContext();
  const headerOffset = getLegalDocHeaderOffset();
  if (ctx.el instanceof Window) {
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  } else {
    const main = ctx.el;
    const elTop = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
    main.scrollTo({ top: Math.max(0, elTop - headerOffset), behavior: 'smooth' });
  }

  const { pathname, search } = window.location;
  window.history.replaceState(null, '', `${pathname}${search}#${id}`);
}
