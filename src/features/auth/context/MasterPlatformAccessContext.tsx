import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAccountAccess } from '../hooks/useAccountAccess';
import { MASTER_WRITE_BLOCKED_TITLE } from '../lib/accountAccess';

type MasterPlatformAccessValue = {
  canMutate: boolean;
  mutateDisabledTitle: string;
};

const MasterPlatformAccessContext = createContext<MasterPlatformAccessValue>({
  canMutate: true,
  mutateDisabledTitle: MASTER_WRITE_BLOCKED_TITLE,
});

export function MasterPlatformAccessProvider({ children }: { children: ReactNode }) {
  const access = useAccountAccess();
  const value = useMemo(
    () => ({
      canMutate: access.canMutateMaster,
      mutateDisabledTitle: MASTER_WRITE_BLOCKED_TITLE,
    }),
    [access.canMutateMaster],
  );
  return (
    <MasterPlatformAccessContext.Provider value={value}>{children}</MasterPlatformAccessContext.Provider>
  );
}

export function useMasterPlatformAccess(): MasterPlatformAccessValue {
  return useContext(MasterPlatformAccessContext);
}
