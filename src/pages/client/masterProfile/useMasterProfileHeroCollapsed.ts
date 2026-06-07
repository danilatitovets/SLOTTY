import { useLayoutEffect, useState } from 'react';

export const MASTER_PROFILE_HERO_ANCHOR_ID = 'master-profile-hero';

export const MASTER_PROFILE_COVER_ATTR = 'data-master-profile-cover';

function readCssPx(varName: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.top = '0';
  probe.style.height = raw;
  document.documentElement.appendChild(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px > 0 ? px : fallback;
}

function getActiveCoverEl(): HTMLElement | null {
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  const layout = isDesktop ? 'desktop' : 'mobile';
  return document.querySelector<HTMLElement>(`[${MASTER_PROFILE_COVER_ATTR}="${layout}"]`);
}

function readToolbarHeight(isDesktop: boolean): number {
  const layout = isDesktop ? 'desktop' : 'mobile';
  const toolbar = document.querySelector<HTMLElement>(`[data-master-profile-toolbar="${layout}"]`);
  if (toolbar) {
    const h = toolbar.getBoundingClientRect().height;
    if (h > 0) return h;
  }
  return 56;
}

function shouldSolidToolbar(cover: HTMLElement): boolean {
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  const stickyTop = isDesktop ? readCssPx('--slotty-header-height', 68) : 0;
  const toolbarHeight = readToolbarHeight(isDesktop);
  const coverRect = cover.getBoundingClientRect();
  return coverRect.bottom <= stickyTop + toolbarHeight + 2;
}

/** true — обложка ушла, toolbar белый и fixed. */
export function useMasterProfileHeroCollapsed(enabled: boolean): boolean {
  const [collapsed, setCollapsed] = useState(false);

  useLayoutEffect(() => {
    if (!enabled) {
      setCollapsed(true);
      return;
    }

    const update = () => {
      const cover = getActiveCoverEl();
      if (!cover) {
        setCollapsed(true);
        return;
      }
      setCollapsed(shouldSolidToolbar(cover));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    const mq = window.matchMedia('(min-width: 1024px)');
    mq.addEventListener('change', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      mq.removeEventListener('change', update);
    };
  }, [enabled]);

  return collapsed;
}
