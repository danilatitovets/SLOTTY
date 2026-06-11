import type { IconType } from 'react-icons';
import {
  HiChatBubbleLeftRight,
  HiDocumentText,
  HiKey,
  HiLockClosed,
  HiSignal,
} from 'react-icons/hi2';
import {
  PROFILE_SETTINGS_DOCUMENTS_PATH,
  PROFILE_SETTINGS_LOGIN_METHODS_PATH,
  PROFILE_SETTINGS_PRIVACY_PATH,
  PROFILE_SETTINGS_SUPPORT_PATH,
  PROFILE_SETTINGS_SYSTEM_STATUS_PATH,
} from '../../../app/paths';

/** Как в бургер-меню кабинета (`ClientCabinetMobileMenu`). */
export const clientSettingsNavIconClass = 'h-[18px] w-[18px] shrink-0 opacity-90';

export type ClientSettingsNavItem = {
  id: string;
  to: string;
  label: string;
  keywords: string[];
  icon: IconType;
  matchPrefix?: boolean;
};

export type ClientSettingsNavGroup = {
  id: string;
  label: string;
  items: ClientSettingsNavItem[];
};

export const CLIENT_SETTINGS_NAV_GROUPS: ClientSettingsNavGroup[] = [
  {
    id: 'account',
    label: 'Аккаунт',
    items: [
      {
        id: 'security',
        to: PROFILE_SETTINGS_LOGIN_METHODS_PATH,
        label: 'Способы входа',
        keywords: ['вход', 'telegram', 'google', 'пароль', 'безопасность', 'сессия'],
        icon: HiKey,
      },
      {
        id: 'privacy',
        to: PROFILE_SETTINGS_PRIVACY_PATH,
        label: 'Данные и приватность',
        keywords: ['данные', 'экспорт', 'удаление', 'приватность', 'gdpr', 'аккаунт'],
        icon: HiLockClosed,
      },
    ],
  },
  {
    id: 'support',
    label: 'Поддержка',
    items: [
      {
        id: 'support',
        to: PROFILE_SETTINGS_SUPPORT_PATH,
        label: 'Поддержка',
        keywords: ['помощь', 'контакт', 'telegram', 'email', 'вопрос'],
        icon: HiChatBubbleLeftRight,
        matchPrefix: true,
      },
      {
        id: 'system-status',
        to: PROFILE_SETTINGS_SYSTEM_STATUS_PATH,
        label: 'Статус системы',
        keywords: ['статус', 'доступность', 'инцидент', 'работает'],
        icon: HiSignal,
      },
    ],
  },
  {
    id: 'legal',
    label: 'Документы',
    items: [
      {
        id: 'documents',
        to: PROFILE_SETTINGS_DOCUMENTS_PATH,
        label: 'Условия и согласия',
        keywords: ['условия', 'политика', 'конфиденциальность', 'согласие', 'оферта', 'документы'],
        icon: HiDocumentText,
        matchPrefix: true,
      },
    ],
  },
];

export function flattenClientSettingsNavItems(): ClientSettingsNavItem[] {
  return CLIENT_SETTINGS_NAV_GROUPS.flatMap((group) => group.items);
}

export const CLIENT_SETTINGS_PAGE_META: Record<
  string,
  { title: string; description: string; breadcrumb: string }
> = {
  security: {
    title: 'Способы входа',
    description: 'Управляйте способами входа и резервным доступом к аккаунту.',
    breadcrumb: 'Способы входа',
  },
  privacy: {
    title: 'Данные и приватность',
    description: 'Экспорт данных, согласия и удаление аккаунта.',
    breadcrumb: 'Данные и приватность',
  },
  support: {
    title: 'Поддержка',
    description: 'Свяжитесь с командой SLOTTY, если нужна помощь с записью или аккаунтом.',
    breadcrumb: 'Поддержка',
  },
  'system-status': {
    title: 'Статус системы',
    description: 'Доступность сервисов SLOTTY и текущие инциденты.',
    breadcrumb: 'Статус системы',
  },
  documents: {
    title: 'Документы',
    description: 'Условия пользования, политика конфиденциальности и согласия.',
    breadcrumb: 'Документы',
  },
};

export function resolveClientSettingsPageId(pathname: string): string {
  if (pathname.includes('/system-status')) return 'system-status';
  if (pathname.includes('/privacy')) return 'privacy';
  if (pathname.includes('/documents')) return 'documents';
  if (pathname.includes('/support')) return 'support';
  if (pathname.includes('/login-methods')) return 'security';
  return 'security';
}
