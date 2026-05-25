import {
  CONTACT_CHANNEL_META,
  contactExternalHref,
  type ContactType,
  type MasterContact,
} from '../../features/master-onboarding/model/masterContacts';
import { ContactChannelBrandIcon } from './MasterProfileContactsBlock';

type Props = {
  contacts: MasterContact[];
  /** compact — в сетке кабинета; default — в профиле клиента */
  size?: 'compact' | 'default';
};

function openContact(href: string) {
  if (typeof window === 'undefined') return;
  const tg = (window as unknown as { Telegram?: { WebApp?: { openLink?: (u: string) => void } } })
    .Telegram?.WebApp;
  try {
    if (typeof tg?.openLink === 'function') {
      tg.openLink(href);
      return;
    }
  } catch {
    /* fall through */
  }
  window.open(href, '_blank', 'noopener,noreferrer');
}

export function MasterContactsChips({ contacts, size = 'default' }: Props) {
  const filled = contacts.filter((c) => c.value.trim());
  if (!filled.length) return null;

  const compact = size === 'compact';

  return (
    <div className="flex flex-wrap gap-1.5">
      {filled.map((c) => {
        const meta = CONTACT_CHANNEL_META.find((m) => m.type === c.type);
        const label = meta?.label ?? 'Контакт';
        const href = contactExternalHref(c.type, c.value);
        const display = c.value.trim();
        const key = `${c.type}:${display}`;

        const chipClass = compact
          ? 'flex min-h-9 max-w-full items-center gap-1.5 rounded-full bg-[#FFF1F4] px-3 text-[12px] font-semibold text-[#111827] transition hover:bg-[#FFE4EA] active:scale-[0.98]'
          : 'flex min-h-10 max-w-full items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#111827] ring-1 ring-[#F3F4F6] transition hover:bg-[#FAFAFA] active:scale-[0.98]';

        const inner = (
          <>
            <ContactChannelBrandIcon type={c.type as ContactType} className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{label}</span>
            {!compact ? (
              <span className="min-w-0 truncate text-[12px] font-medium text-[#6B7280]">{display}</span>
            ) : null}
          </>
        );

        if (href) {
          return (
            <button
              key={key}
              type="button"
              onClick={() => openContact(href)}
              className={chipClass}
              title={display}
            >
              {inner}
            </button>
          );
        }

        return (
          <span key={key} className={`${chipClass} cursor-default`} title={display}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}
