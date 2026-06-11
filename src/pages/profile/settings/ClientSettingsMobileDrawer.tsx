import { NavLink } from 'react-router-dom';
import { AdminBottomSheet } from '../../admin/shared/AdminBottomSheet';
import { SettingsSearchBox } from '../../admin/settings/workspace/SettingsSearchBox';
import { settingsNavGroupLabel, settingsNavItemClass } from '../../admin/settings/workspace/settingsWorkspaceTheme';
import {
  CLIENT_SETTINGS_NAV_GROUPS,
  clientSettingsNavIconClass,
  flattenClientSettingsNavItems,
  type ClientSettingsNavItem,
} from './clientSettingsNav';

type Props = {
  open: boolean;
  onClose: () => void;
  search: string;
  onSearchChange: (v: string) => void;
};

function filterItems(query: string): ClientSettingsNavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return flattenClientSettingsNavItems();
  return flattenClientSettingsNavItems().filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q)),
  );
}

export function ClientSettingsMobileDrawer({ open, onClose, search, onSearchChange }: Props) {
  const filtered = filterItems(search);
  const filteredIds = new Set(filtered.map((i) => i.id));

  return (
    <AdminBottomSheet open={open} onClose={onClose} title="Настройки">
      <SettingsSearchBox value={search} onChange={onSearchChange} placeholder="Поиск настроек" />
      <nav className="mt-2 flex flex-col pb-2" aria-label="Разделы настроек">
        {CLIENT_SETTINGS_NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => filteredIds.has(i.id));
          if (!items.length) return null;

          return (
            <div key={group.id}>
              <p className={settingsNavGroupLabel}>{group.label}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.to}
                        end={!item.matchPrefix}
                        onClick={onClose}
                        className={({ isActive }) => settingsNavItemClass(isActive)}
                      >
                        <Icon className={clientSettingsNavIconClass} aria-hidden />
                        <span className="min-w-0 flex-1">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-[14px] text-[#9CA3AF]">Ничего не найдено</p>
        ) : null}
      </nav>
    </AdminBottomSheet>
  );
}
