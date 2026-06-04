import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** При открытии legal-страницы — сверху; с hash — к секции (без «прыжка вниз» при первом заходе). */
export function useLegalPageScroll() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace(/^#/, '');
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ block: 'start' });
          return;
        }
        window.scrollTo(0, 0);
      });
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
}
