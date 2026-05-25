import { HiLink } from 'react-icons/hi2';
import { SiInstagram, SiTelegram, SiViber, SiVk, SiWhatsapp } from 'react-icons/si';
import {
  CONTACT_CHANNEL_META,
  canAddContactChannel,
  type ContactType,
  type MasterContactRow,
} from '../../features/master-onboarding/model/masterContacts';

/** Компактное поле контакта: на всю ширину колонки, placeholder мельче, чтобы длинные подсказки помещались. */
const contactInputClass = `
  w-full min-w-0
  rounded-[18px]
  bg-white
  px-3 py-2.5
  text-[15px] font-semibold
  text-neutral-950
  outline-none ring-0
  placeholder:text-[12px] placeholder:font-medium placeholder:leading-snug placeholder:text-neutral-400
  sm:px-3.5 sm:placeholder:text-[13px]
  transition
  focus:shadow-[0_8px_22px_rgba(17,17,17,0.06)]
`;

export function ContactChannelBrandIcon({
  type,
  className,
  tone = 'brand',
}: {
  type: ContactType;
  className: string;
  tone?: 'brand' | 'onAccent';
}) {
  const cls = `${className} shrink-0`;
  if (tone === 'onAccent') {
    switch (type) {
      case 'telegram':
        return <SiTelegram className={`${cls} text-white`} aria-hidden title="Telegram" />;
      case 'viber':
        return <SiViber className={`${cls} text-white`} aria-hidden title="Viber" />;
      case 'vk':
        return <SiVk className={`${cls} text-white`} aria-hidden title="VK" />;
      case 'instagram':
        return <SiInstagram className={`${cls} text-white`} aria-hidden title="Instagram" />;
      case 'whatsapp':
        return <SiWhatsapp className={`${cls} text-white`} aria-hidden title="WhatsApp" />;
      default:
        return <HiLink className={`${cls} text-white`} aria-hidden title="Ещё" />;
    }
  }
  switch (type) {
    case 'telegram':
      return <SiTelegram className={`${cls} text-[#229ED9]`} aria-hidden title="Telegram" />;
    case 'viber':
      return <SiViber className={`${cls} text-[#665CAC]`} aria-hidden title="Viber" />;
    case 'vk':
      return <SiVk className={`${cls} text-[#0077FF]`} aria-hidden title="VK" />;
    case 'instagram':
      return <SiInstagram className={`${cls} text-[#E4405F]`} aria-hidden title="Instagram" />;
    case 'whatsapp':
      return <SiWhatsapp className={`${cls} text-[#25D366]`} aria-hidden title="WhatsApp" />;
    default:
      return <HiLink className={`${cls} text-neutral-400`} aria-hidden title="Ещё" />;
  }
}

type Props = {
  variant?: 'default' | 'catalog';
  rows: MasterContactRow[];
  onAdd: (type: ContactType) => void;
  onChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onBlurRow: (id: string) => void;
  rowErrors: Record<string, string>;
  showRowError: (id: string) => boolean;
};

const catalogContactRowClass =
  'flex min-h-[46px] items-center gap-2 rounded-[10px] bg-[#EBEBEB] px-2.5 py-1.5 transition focus-within:bg-[#E4E4E4]';

const catalogContactInputClass = `
  min-w-0 flex-1
  border-0
  bg-transparent
  px-1 py-2
  text-[15px] font-medium
  text-[#111827]
  outline-none
  placeholder:text-[12px] placeholder:font-medium placeholder:text-[#8E8E93]
`;

export function MasterProfileContactsBlock({
  variant = 'default',
  rows,
  onAdd,
  onChange,
  onRemove,
  onBlurRow,
  rowErrors,
  showRowError,
}: Props) {
  const isCatalog = variant === 'catalog';

  return (
    <div className={isCatalog ? 'space-y-3' : 'mt-7 space-y-3'}>
      <div>
        <p className={`text-[13px] font-medium ${isCatalog ? 'text-[#6B7280]' : 'font-semibold text-neutral-500'}`}>
          Контакты для клиентов
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {CONTACT_CHANNEL_META.map((ch) => {
            const present = !canAddContactChannel(rows, ch.type);
            const addBlocked = ch.type === 'other' ? !canAddContactChannel(rows, 'other') : present;
            return (
              <button
                key={ch.type}
                type="button"
                disabled={addBlocked}
                onClick={() => {
                  if (!canAddContactChannel(rows, ch.type)) return;
                  onAdd(ch.type);
                }}
                className={`flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition active:scale-[0.98] disabled:cursor-default ${
                  present
                    ? isCatalog
                      ? 'bg-[#F47C8C] text-white disabled:opacity-100'
                      : 'bg-[#E29595] text-white shadow-[0_8px_20px_rgba(226,149,149,0.22)] disabled:opacity-100'
                    : isCatalog
                      ? 'bg-[#EBEBEB] text-[#374151] hover:bg-[#E4E4E4] disabled:opacity-40'
                      : 'bg-[#F1EFEF] text-neutral-600 disabled:opacity-40'
                }`}
              >
                <ContactChannelBrandIcon
                  type={ch.type}
                  className="h-3.5 w-3.5"
                  tone={present ? 'onAccent' : 'brand'}
                />
                {ch.label}
              </button>
            );
          })}
        </div>
      </div>

      {rows.length > 0 ? (
        <ul className={`flex flex-col ${isCatalog ? 'gap-2' : 'gap-2'}`}>
          {rows.map((row) => {
            const meta = CONTACT_CHANNEL_META.find((c) => c.type === row.type)!;
            const err = rowErrors[row.id];
            const showErr = showRowError(row.id) && err;
            if (isCatalog) {
              return (
                <li key={row.id}>
                  <div className={catalogContactRowClass}>
                    <span className="flex shrink-0 items-center justify-center" aria-hidden>
                      <ContactChannelBrandIcon type={row.type} className="h-5 w-5" />
                    </span>
                    <input
                      value={row.value}
                      onChange={(e) => onChange(row.id, e.target.value)}
                      onBlur={() => onBlurRow(row.id)}
                      placeholder={meta.placeholder}
                      maxLength={row.type === 'other' ? 200 : 460}
                      autoComplete="off"
                      aria-label={meta.label}
                      className={catalogContactInputClass}
                    />
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[18px] font-medium leading-none text-[#9CA3AF] transition hover:bg-white/60 hover:text-[#111827] active:scale-[0.96]"
                      aria-label={`Удалить ${meta.label}`}
                    >
                      ×
                    </button>
                  </div>
                  {showErr ? (
                    <p className="mt-1 px-0.5 text-[12px] font-medium leading-snug text-red-600">{err}</p>
                  ) : null}
                </li>
              );
            }
            return (
              <li
                key={row.id}
                className="overflow-hidden rounded-[22px] bg-[#F1EFEF] p-2.5 sm:p-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(17,17,17,0.06)]"
                    aria-hidden
                  >
                    <ContactChannelBrandIcon type={row.type} className="h-5 w-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-[13px] font-semibold leading-tight text-neutral-700">
                      {meta.label}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-semibold leading-none text-neutral-400 shadow-[0_2px_8px_rgba(17,17,17,0.06)] transition hover:text-neutral-700 active:scale-[0.96]"
                      aria-label={`Удалить ${meta.label}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <input
                  value={row.value}
                  onChange={(e) => onChange(row.id, e.target.value)}
                  onBlur={() => onBlurRow(row.id)}
                  placeholder={meta.placeholder}
                  maxLength={row.type === 'other' ? 200 : 460}
                  autoComplete="off"
                  className={`${contactInputClass} mt-2`}
                />
                {showErr ? (
                  <p className="mt-1 text-[11px] font-medium leading-snug text-red-600">{err}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
