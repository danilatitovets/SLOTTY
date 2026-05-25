import { Link, NavLink, Outlet } from 'react-router-dom';
import { HEADER_LOGO_SRC } from '../../app/headerLogo';
import { HUB_PATH } from '../../app/paths';
import { useAuth } from '../../features/auth/AuthProvider';
import { PLATFORM_ADMIN_NAV } from './platformAdminNav';
import {
  PLATFORM_ADMIN_MAIN_OFFSET,
  PLATFORM_ADMIN_SIDEBAR_WIDTH,
  platformAdminNavItemClass,
} from './platformAdminShell';
import { paCanvas } from './platformAdminTheme';

export function PlatformAdminLayout() {
  const { profile } = useAuth();

  return (
    <div className={`min-h-dvh ${paCanvas}`}>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden ${PLATFORM_ADMIN_SIDEBAR_WIDTH} flex-col border-r border-[#eef0f5] bg-white lg:flex`}
      >
        <div className="shrink-0 border-b border-[#eef0f5] px-5 py-5">
          <Link to={HUB_PATH} className="inline-flex">
            <img src={HEADER_LOGO_SRC} alt="SLOTTY" className="h-10 w-auto object-contain" />
          </Link>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
            Админ платформы
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Разделы админки">
          {PLATFORM_ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => platformAdminNavItemClass(isActive)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[#eef0f5] p-4">
          <p className="truncate text-[14px] font-semibold text-[#111827]">{profile?.full_name}</p>
          <p className="mt-0.5 text-[12px] text-[#9CA3AF]">Администратор</p>
        </div>
      </aside>

      <div className={`flex min-h-dvh min-w-0 flex-col ${PLATFORM_ADMIN_MAIN_OFFSET}`}>
        <header className="sticky top-0 z-30 border-b border-[#eef0f5] bg-white/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4 lg:hidden">
            <span className="text-[15px] font-bold text-[#111827]">SLOTTY Admin</span>
            <Link
              to={HUB_PATH}
              className="rounded-2xl border border-[#e5e7eb] px-3 py-1.5 text-[13px] font-semibold text-[#374151]"
            >
              На сайт
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
            {PLATFORM_ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    isActive ? 'bg-[#ff5f7a] text-white' : 'bg-[#f3f4f6] text-[#6B7280]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden h-14 items-center justify-end px-8 lg:flex">
            <Link
              to={HUB_PATH}
              className="rounded-2xl border border-[#e5e7eb] px-4 py-2 text-[13px] font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
            >
              На сайт
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
