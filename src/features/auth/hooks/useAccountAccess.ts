import { useMemo } from 'react';
import { useAuth } from '../AuthProvider';
import { resolveAccountAccess, type AccountAccessState } from '../lib/accountAccess';

export function useAccountAccess(): AccountAccessState {
  const { profile } = useAuth();
  return useMemo(() => resolveAccountAccess(profile), [profile]);
}
