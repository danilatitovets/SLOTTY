import { useEffect, useState } from 'react';
import { fetchAuthIdentities } from '../api/authApi';
import {
  DEFAULT_ACCOUNT_VERIFICATION_STEPS,
  isAccountFullyVerified,
  listAccountVerificationPendingSteps,
  type AccountVerificationPendingStep,
} from '../lib/accountVerification';
import { useAuth } from '../AuthProvider';

export function useAccountVerificationStatus() {
  const { isAuthenticated, backendConfigured } = useAuth();
  const [verified, setVerified] = useState(false);
  const [pendingSteps, setPendingSteps] = useState<AccountVerificationPendingStep[]>(
    DEFAULT_ACCOUNT_VERIFICATION_STEPS,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !backendConfigured) {
      setVerified(false);
      setPendingSteps(DEFAULT_ACCOUNT_VERIFICATION_STEPS);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchAuthIdentities()
      .then((list) => {
        if (cancelled) return;
        setVerified(isAccountFullyVerified(list));
        setPendingSteps(listAccountVerificationPendingSteps(list));
      })
      .catch(() => {
        if (cancelled) return;
        setVerified(false);
        setPendingSteps(DEFAULT_ACCOUNT_VERIFICATION_STEPS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, backendConfigured]);

  return { verified, pendingSteps, loading };
}
