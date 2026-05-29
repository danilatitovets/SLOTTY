import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Синхронизация под-вкладок кабинета с ?tab= в URL (можно делиться ссылкой). */
export function useAdminSectionTab<T extends string>(
  param: string,
  defaultTab: T,
  validTabs: readonly T[],
): [T, (tab: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo(() => {
    const raw = searchParams.get(param);
    if (raw && validTabs.includes(raw as T)) return raw as T;
    return defaultTab;
  }, [searchParams, param, defaultTab, validTabs]);

  const setActiveTab = useCallback(
    (tab: T) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === defaultTab) next.delete(param);
          else next.set(param, tab);
          return next;
        },
        { replace: true },
      );
    },
    [defaultTab, param, setSearchParams],
  );

  return [activeTab, setActiveTab];
}
