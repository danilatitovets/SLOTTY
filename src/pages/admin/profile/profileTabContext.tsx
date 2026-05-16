import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ADMIN_PATH } from '../../../app/paths';
import { CABINET_HEADER_STICKY_TOP, SectionTabs, type ProfileSectionId } from './AdminProfileCabinetUi';

type ProfileTabContextValue = {
  activeSection: ProfileSectionId;
  setActiveSection: (section: ProfileSectionId) => void;
};

const ProfileTabContext = createContext<ProfileTabContextValue | null>(null);

export function ProfileTabProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<ProfileSectionId>('main');
  const value = useMemo(
    () => ({ activeSection, setActiveSection }),
    [activeSection],
  );

  return <ProfileTabContext.Provider value={value}>{children}</ProfileTabContext.Provider>;
}

export function useProfileTabs(): ProfileTabContextValue {
  const ctx = useContext(ProfileTabContext);
  if (!ctx) {
    throw new Error('useProfileTabs must be used within ProfileTabProvider');
  }
  return ctx;
}

/** Вкладки в блоке героя; при скролле липнут под шапку с логотипом. */
export function ProfileSectionTabsBar() {
  const { pathname } = useLocation();
  const isProfileHome = pathname === ADMIN_PATH;

  if (!isProfileHome) return null;

  const { activeSection, setActiveSection } = useProfileTabs();

  return (
    <div
      className="sticky z-30 bg-white"
      style={{ top: CABINET_HEADER_STICKY_TOP }}
    >
      <SectionTabs active={activeSection} onChange={setActiveSection} />
    </div>
  );
}
