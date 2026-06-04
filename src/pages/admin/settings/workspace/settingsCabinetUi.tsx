import type { ReactNode } from 'react';
import { HiArrowRight, HiCheck } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { SlottySelect, type SlottySelectOption } from '../../../../shared/ui/SlottySelect';

/** Вертикальный ритм как у LoginMethodsPanel (okx). */
export const settingsCabinetStack = 'space-y-5';

export const settingsCabinetActionBtn =
  'shrink-0 rounded-[10px] bg-[#F5F5F5] px-4 py-2 text-[14px] font-semibold text-[#111827] transition hover:bg-[#EBEBEB] disabled:opacity-50';

export const settingsCabinetPrimaryBtn =
  'inline-flex min-h-12 items-center justify-center rounded-[16px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-5 text-[15px] font-bold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

export const settingsCabinetOutlineBtn =
  'inline-flex min-h-12 items-center justify-center rounded-[16px] bg-[#FFF1F4] px-5 text-[14px] font-semibold text-[#ff5f7a] transition hover:bg-[#FFE8EE] active:scale-[0.98] disabled:opacity-50';

export const settingsCabinetFieldClass =
  'w-full rounded-[10px] border-0 bg-[#F5F5F5] px-4 py-3 text-[15px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:bg-[#EBEBEB] focus:ring-2 focus:ring-[#ff5f7a]/15';

export const settingsCabinetLabelClass = 'mb-1.5 block text-[12px] font-medium text-[#6B7280]';

export function SettingsCabinetSelect({
  label,
  value,
  onChange,
  options,
  sheetTitle,
  'aria-label': ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SlottySelectOption[];
  sheetTitle?: string;
  'aria-label'?: string;
}) {
  return (
    <div>
      <span className={settingsCabinetLabelClass}>{label}</span>
      <SlottySelect
        className="w-full"
        tone="cabinet"
        pickerLayer="auto"
        value={value}
        onChange={onChange}
        options={options}
        sheetTitle={sheetTitle ?? label}
        aria-label={ariaLabel ?? label}
      />
    </div>
  );
}

/** Компактный hero как на странице «Безопасность» (okx). */
export function SettingsCabinetHero({
  badge,
  title,
  description,
  loading,
}: {
  badge: ReactNode;
  title: string;
  description: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      {badge}
      <div className="min-w-0">
        <h2 className="text-[18px] font-bold text-[#111827]">{loading ? 'Загрузка…' : title}</h2>
        <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280]">{description}</p>
      </div>
    </div>
  );
}

/** Кольцевой прогресс как на баннере «Защита аккаунта». */
export function SettingsCabinetRingBadge({
  current,
  total,
  label = 'уровень',
  loading,
}: {
  current: number;
  total: number;
  label?: string;
  loading?: boolean;
}) {
  const size = 72;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;
  const offset = circumference - ratio * circumference;
  const complete = total > 0 && current >= total;

  return (
    <div
      className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center"
      role="img"
      aria-label={
        loading
          ? 'Загрузка прогресса'
          : `${current} из ${total}${label ? `, ${label}` : ''}`
      }
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="h-[72px] w-[72px] -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FDE8ED"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={complete ? '#22C55E' : '#F47C8C'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={loading ? circumference : offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
        <span
          className={`text-[15px] font-bold leading-none tabular-nums tracking-tight ${
            complete ? 'text-[#16A34A]' : 'text-[#111827]'
          }`}
        >
          {loading ? '…' : `${current}/${total}`}
        </span>
        {label ? (
          <span className="mt-0.5 max-w-[52px] text-[9px] font-medium leading-tight text-[#9CA3AF]">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsCabinetProgressCard({
  eyebrow,
  title,
  description,
  percent,
  loading,
}: {
  eyebrow: string;
  title: string;
  description: string;
  percent: number;
  loading?: boolean;
}) {
  const complete = percent >= 100;

  return (
    <div className="rounded-[20px] bg-[#F6F7FB] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#ff5f7a]">{eyebrow}</p>
          <p className="mt-1 text-[15px] font-bold text-[#111827]">{loading ? 'Загрузка…' : title}</p>
          <p className="mt-0.5 text-[13px] text-[#6B7280]">{description}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-black tabular-nums ${
            complete ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#FFF1F4] text-[#ff5f7a]'
          }`}
        >
          {loading ? '…' : `${percent}%`}
        </span>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-[#EAECEF]/80"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] transition-all duration-500"
          style={{ width: `${loading ? 0 : percent}%` }}
        />
      </div>
    </div>
  );
}

export function SettingsCabinetSectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-3">
      <h3 className="text-[16px] font-bold text-[#111827]">{title}</h3>
      {description ? <p className="mt-1 text-[13px] text-[#6B7280]">{description}</p> : null}
    </div>
  );
}

export function SettingsCabinetList({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[16px] bg-white divide-y divide-[#EBEBEB]">{children}</div>
  );
}

export function SettingsCabinetListRow({
  icon,
  title,
  subtitle,
  badge,
  disabled,
  to,
  linkState,
  externalHref,
  onClick,
  actionLabel = 'Открыть',
  trailing,
  iconTone = 'default',
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  disabled?: boolean;
  to?: string;
  linkState?: object;
  externalHref?: string;
  onClick?: () => void;
  actionLabel?: string;
  trailing?: ReactNode;
  iconTone?: 'default' | 'brand';
}) {
  const action = trailing ?? (disabled ? (
    <span className="text-[12px] font-semibold text-[#9CA3AF]">{badge ?? 'Скоро'}</span>
  ) : (
    <span className={`inline-flex items-center gap-1 ${settingsCabinetActionBtn} bg-transparent px-3 py-1.5 hover:bg-[#EBEBEB]`}>
      {actionLabel}
      <HiArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </span>
  ));

  const inner = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
          iconTone === 'brand'
            ? 'bg-white ring-1 ring-[#EBEBEB]'
            : 'bg-[#F5F5F5] text-[#6B7280]'
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-[#111827]">{title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center">{action}</div>
    </>
  );

  const rowClass = 'flex items-center gap-4 px-5 py-4 transition hover:bg-[#FAFAFA]';

  if (disabled) {
    return <div className={`${rowClass} opacity-70`}>{inner}</div>;
  }
  if (externalHref) {
    return (
      <a href={externalHref} target="_blank" rel="noopener noreferrer" className={`${rowClass} no-underline`}>
        {inner}
      </a>
    );
  }
  if (to) {
    return (
      <Link to={to} state={linkState} className={`${rowClass} no-underline`} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={`${rowClass} w-full text-left`} onClick={onClick}>
      {inner}
    </button>
  );
}

export function SettingsCabinetFeatureCard({
  icon,
  title,
  subtitle,
  badge,
  children,
  accent,
  trailing,
}: {
  icon?: ReactNode;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  children?: ReactNode;
  accent?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <div className="rounded-[16px] bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {icon ? (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
              accent ? 'bg-[#FFF1F4] text-[#ff5f7a]' : 'bg-[#F5F5F5] text-[#6B7280]'
            }`}
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[16px] font-bold leading-tight text-[#111827]">{title}</p>
            {badge}
          </div>
          <p className="mt-1 text-[13px] leading-snug text-[#6B7280]">{subtitle}</p>
        </div>
        {trailing ? (
          <div className="shrink-0 self-start">{trailing}</div>
        ) : accent ? (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6f88] to-[#ff5f7a] text-white"
            aria-hidden
          >
            <HiCheck className="h-4 w-4" strokeWidth={2.5} />
          </span>
        ) : null}
      </div>
      {children ? <div className="mt-4 pt-1">{children}</div> : null}
    </div>
  );
}

export function SettingsCabinetStatusPill({
  children,
  tone = 'success',
}: {
  children: ReactNode;
  tone?: 'success' | 'warning' | 'neutral' | 'pink';
}) {
  const cls =
    tone === 'success'
      ? 'bg-[#ECFDF5] text-[#15803D]'
      : tone === 'warning'
        ? 'bg-[#FFFBEB] text-[#B45309]'
        : tone === 'pink'
          ? 'bg-[#FFF1F4] text-[#ff5f7a]'
          : 'bg-[#F6F7FB] text-[#6B7280]';
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>{children}</span>;
}

/** Блок согласия / заметка без рамки. */
export function SettingsCabinetSurface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[16px] bg-white p-4 sm:p-5 ${className}`}>{children}</div>;
}

/** Переключатель в стиле кабинета (розовый градиент). */
export function SettingsCabinetSwitch({
  checked,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  'aria-label': string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/35 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? 'bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a]' : 'bg-[#D1D5DB]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
        aria-hidden
      />
    </button>
  );
}
