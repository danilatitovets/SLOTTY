import { useLocation, useNavigate } from 'react-router-dom';
import {
  ADMIN_SETTINGS_LOGIN_METHODS_PATH,
  ADMIN_SETTINGS_SPONSOR_PATH,
  ADMIN_SETTINGS_SUPPORT_PATH,
} from '../../../app/paths';
import { IconNavProfile, IconNavSponsor, IconNavSupport } from '../adminCabinetNav';
import { AdminSegmentTabNav } from '../shared/AdminSegmentTabNav';

type SettingsTabId = 'login-methods' | 'support' | 'sponsor';

const TABS = [
  { id: 'login-methods' as const, label: 'Способы входа', Icon: IconNavProfile, to: ADMIN_SETTINGS_LOGIN_METHODS_PATH },
  { id: 'support' as const, label: 'Справка', Icon: IconNavSupport, to: ADMIN_SETTINGS_SUPPORT_PATH },
  { id: 'sponsor' as const, label: 'Спонсор SLOTTY', Icon: IconNavSponsor, to: ADMIN_SETTINGS_SPONSOR_PATH },
];

function activeSettingsTab(pathname: string): SettingsTabId {
  if (pathname.includes('/sponsor')) return 'sponsor';
  if (pathname.includes('/support')) return 'support';
  return 'login-methods';
}

export function SettingsBottomTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = activeSettingsTab(pathname);

  return (
    <AdminSegmentTabNav
      tabs={TABS}
      active={active}
      onChange={(id) => {
        const tab = TABS.find((t) => t.id === id);
        if (tab) navigate(tab.to);
      }}
      ariaLabel="Разделы настроек"
      mode="mobile"
    />
  );
}
