import type { IconType } from 'react-icons';
import {
  LuBell,
  LuBriefcase,
  LuCalendarDays,
  LuHeart,
  LuInbox,
  LuSettings,
  LuShield,
  LuSparkles,
  LuUser,
} from 'react-icons/lu';

/** Общий класс иконок пунктов меню аккаунта (Lucide / react-icons). */
export const ACCOUNT_MENU_ICON_CLASS =
  'h-[17px] w-[17px] shrink-0 text-[#1A1A1A] transition group-hover:text-[#111827]';

export const AccountMenuIcons = {
  appointments: LuCalendarDays,
  favorites: LuHeart,
  profile: LuUser,
  notifications: LuBell,
  settings: LuSettings,
  masterCabinet: LuBriefcase,
  masterInbox: LuInbox,
  becomeMaster: LuSparkles,
  admin: LuShield,
} as const satisfies Record<string, IconType>;
