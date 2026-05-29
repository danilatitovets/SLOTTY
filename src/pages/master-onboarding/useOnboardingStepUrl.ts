import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useOnboardingStepUrl(totalSteps: number) {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlStep = useMemo(() => {
    const raw = searchParams.get('step');
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return null;
    if (n < 1 || n > totalSteps) return null;
    return n;
  }, [searchParams, totalSteps]);

  const setUrlStep = useCallback(
    (step: number, replace = true) => {
      const n = Math.max(1, Math.min(totalSteps, Math.trunc(step)));
      if (searchParams.get('step') === String(n)) return;
      const next = new URLSearchParams(searchParams);
      next.set('step', String(n));
      setSearchParams(next, { replace });
    },
    [searchParams, setSearchParams, totalSteps],
  );

  return { urlStep, setUrlStep };
}

