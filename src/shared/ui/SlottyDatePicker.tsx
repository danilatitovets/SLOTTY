import type { CSSProperties, RefObject } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { SlottySelectTone } from './SlottySelect';

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Минимальная дата `yyyy-mm-dd` (обычно сегодня). */
  min?: string;
  /** Максимальная дата `yyyy-mm-dd`. */
  max?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  tone?: SlottySelectTone;
  /** Показать кнопку «Очистить» внизу календаря. */
  allowClear?: boolean;
  'aria-label'?: string;
};

const GAP = 8;
const VIEW_PAD = 8;
const PANEL_HEIGHT = 340;
const PANEL_Z_INDEX = 260;
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

const TONE_ACCENT: Record<SlottySelectTone, string> = {
  neutral: '#E29595',
  admin: '#F47C8C',
};

const TONE_TRIGGER: Record<SlottySelectTone, string> = {
  neutral:
    'flex w-full min-h-[3rem] items-center justify-between rounded-[18px] border border-neutral-200/60 bg-white px-4 py-3 text-left text-[16px] font-semibold text-neutral-900 outline-none transition focus:border-[#E29595] disabled:cursor-not-allowed disabled:opacity-50',
  admin:
    'flex w-full min-h-[3rem] items-center justify-between rounded-[16px] border border-[#EAECEF] bg-white px-4 py-3 text-left text-[15px] font-medium text-[#111827] outline-none transition focus:border-[#F9A8B4] focus:ring-2 focus:ring-[#FFF1F4] disabled:cursor-not-allowed disabled:opacity-50',
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function parseIsoDate(iso: string): Date {
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(y, (mo || 1) - 1, d || 1);
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Пн=0 … Вс=6 */
function getWeekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDisplayRu(iso: string): string {
  if (!iso.trim()) return '';
  const d = parseIsoDate(iso);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

function formatMonthYearRu(year: number, month: number): string {
  const d = new Date(year, month, 1);
  const s = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function useFixedCalendarPosition(open: boolean, anchorRef: RefObject<HTMLElement | null>): CSSProperties | null {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el || !open) return;
    const r = el.getBoundingClientRect();
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;

    const width = Math.min(Math.max(r.width, 280), vw - VIEW_PAD * 2);
    let left = r.left;
    left = Math.max(VIEW_PAD, Math.min(left, vw - width - VIEW_PAD));

    const spaceBelow = vh - r.bottom - VIEW_PAD;
    const spaceAbove = r.top - VIEW_PAD;
    const openDown = spaceBelow >= PANEL_HEIGHT || spaceBelow >= spaceAbove;

    if (openDown) {
      setStyle({
        position: 'fixed',
        top: Math.min(r.bottom + GAP, vh - PANEL_HEIGHT - VIEW_PAD),
        left,
        width,
        zIndex: PANEL_Z_INDEX,
      });
    } else {
      setStyle({
        position: 'fixed',
        top: Math.max(VIEW_PAD, r.top - GAP - PANEL_HEIGHT),
        left,
        width,
        zIndex: PANEL_Z_INDEX,
      });
    }
  }, [anchorRef, open]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }
    measure();
    const ro = new ResizeObserver(measure);
    const el = anchorRef.current;
    if (el) ro.observe(el);

    const onWin = () => measure();
    window.addEventListener('resize', onWin);
    window.visualViewport?.addEventListener('resize', onWin);
    window.visualViewport?.addEventListener('scroll', onWin);
    window.addEventListener('scroll', onWin, true);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWin);
      window.visualViewport?.removeEventListener('resize', onWin);
      window.visualViewport?.removeEventListener('scroll', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [open, measure, anchorRef]);

  return open ? style : null;
}

function buildMonthCells(
  viewYear: number,
  viewMonth: number,
  minIso: string | undefined,
  maxIso: string | undefined,
) {
  const minDay = minIso ? startOfLocalDay(parseIsoDate(minIso)).getTime() : null;
  const maxDay = maxIso ? startOfLocalDay(parseIsoDate(maxIso)).getTime() : null;
  const firstWd = getWeekdayIndex(new Date(viewYear, viewMonth, 1));
  const len = daysInMonth(viewYear, viewMonth);
  const cells: { key: string; day: number; iso: string; muted: boolean; disabled: boolean }[] = [];

  const isDisabled = (iso: string) => {
    const t = startOfLocalDay(parseIsoDate(iso)).getTime();
    if (minDay != null && t < minDay) return true;
    if (maxDay != null && t > maxDay) return true;
    return false;
  };

  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
  const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
  const prevLen = daysInMonth(prevYear, prevMonth);
  for (let i = firstWd - 1; i >= 0; i -= 1) {
    const day = prevLen - i;
    const iso = toIsoDate(new Date(prevYear, prevMonth, day));
    cells.push({ key: `p-${iso}`, day, iso, muted: true, disabled: isDisabled(iso) });
  }

  for (let day = 1; day <= len; day += 1) {
    const iso = toIsoDate(new Date(viewYear, viewMonth, day));
    cells.push({ key: `c-${iso}`, day, iso, muted: false, disabled: isDisabled(iso) });
  }

  let nextDay = 1;
  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  while (cells.length < 42) {
    const iso = toIsoDate(new Date(nextYear, nextMonth, nextDay));
    cells.push({ key: `n-${iso}`, day: nextDay, iso, muted: true, disabled: isDisabled(iso) });
    nextDay += 1;
  }

  return cells;
}

function isIsoDisabled(iso: string, minIso?: string, maxIso?: string): boolean {
  const t = startOfLocalDay(parseIsoDate(iso)).getTime();
  if (minIso && t < startOfLocalDay(parseIsoDate(minIso)).getTime()) return true;
  if (maxIso && t > startOfLocalDay(parseIsoDate(maxIso)).getTime()) return true;
  return false;
}

export function SlottyDatePicker({
  value,
  onChange,
  min,
  max,
  className = '',
  disabled = false,
  placeholder = 'Выберите дату',
  tone = 'neutral',
  allowClear = true,
  'aria-label': ariaLabel,
}: Props) {
  const autoId = useId();
  const buttonId = `${autoId}-btn`;
  const panelId = `${autoId}-panel`;
  const accent = TONE_ACCENT[tone];

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelStyle = useFixedCalendarPosition(open, btnRef);

  const initialView = value.trim() ? parseIsoDate(value) : new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const base = value.trim() ? parseIsoDate(value) : new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const minIso = min?.trim() || undefined;
  const maxIso = max?.trim() || undefined;
  const cells = buildMonthCells(viewYear, viewMonth, minIso, maxIso);
  const todayIso = toIsoDate(new Date());
  const todayDisabled = isIsoDisabled(todayIso, minIso, maxIso);

  const minMonthKey = minIso ? parseIsoDate(minIso).getFullYear() * 12 + parseIsoDate(minIso).getMonth() : null;
  const viewMonthKey = viewYear * 12 + viewMonth;
  const canPrevMonth = minMonthKey == null || viewMonthKey > minMonthKey;

  const display = value.trim() ? formatDisplayRu(value) : '';

  const pickDay = (iso: string) => {
    onChange(iso);
    close();
    btnRef.current?.focus();
  };

  const panel =
    open && panelStyle ? (
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="Выбор даты"
        style={panelStyle}
        className="rounded-[22px] border border-[#EAECEF]/80 bg-white p-3 shadow-[0_16px_48px_rgba(17,24,39,0.14)]"
      >
        <div className="flex items-center justify-between gap-2 px-1 pb-2">
          <p className="text-[15px] font-bold capitalize tracking-[-0.02em] text-[#111827]">
            {formatMonthYearRu(viewYear, viewMonth)}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={!canPrevMonth}
              onClick={() => {
                if (!canPrevMonth) return;
                if (viewMonth === 0) {
                  setViewYear((y) => y - 1);
                  setViewMonth(11);
                } else {
                  setViewMonth((m) => m - 1);
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B7280] transition hover:bg-[#F1EFEF] disabled:opacity-30"
              aria-label="Предыдущий месяц"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) {
                  setViewYear((y) => y + 1);
                  setViewMonth(0);
                } else {
                  setViewMonth((m) => m + 1);
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B7280] transition hover:bg-[#F1EFEF]"
              aria-label="Следующий месяц"
            >
              ▼
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-bold text-[#9CA3AF]">
          {WEEKDAYS.map((wd) => (
            <span key={wd} className="py-1">
              {wd}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const selected = value === cell.iso;
            return (
              <button
                key={cell.key}
                type="button"
                disabled={cell.disabled}
                onClick={() => !cell.disabled && pickDay(cell.iso)}
                className={`flex aspect-square max-h-10 min-h-9 w-full items-center justify-center rounded-[14px] text-[14px] font-semibold tabular-nums transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30 ${
                  selected
                    ? 'text-white shadow-[0_6px_18px_rgba(226,149,149,0.35)]'
                    : cell.muted
                      ? 'bg-transparent text-[#D1D5DB]'
                      : 'bg-[#F1EFEF] text-[#111827] hover:bg-[#EAECEF]'
                }`}
                style={selected ? { backgroundColor: accent } : undefined}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        <div className={`mt-2 flex border-t border-[#F3F4F6] pt-2 ${allowClear ? '' : 'justify-center'}`}>
          {allowClear ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                close();
              }}
              className="flex-1 py-2 text-[14px] font-bold"
              style={{ color: accent }}
            >
              Очистить
            </button>
          ) : null}
          <button
            type="button"
            disabled={todayDisabled}
            onClick={() => {
              if (!todayDisabled) pickDay(todayIso);
            }}
            className={`py-2 text-[14px] font-bold disabled:opacity-40 ${allowClear ? 'flex-1' : 'min-w-[8rem]'}`}
            style={{ color: accent }}
          >
            Сегодня
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div ref={wrapRef} className={className.trim()}>
      <button
        ref={btnRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={TONE_TRIGGER[tone]}
      >
        <span className={display ? (tone === 'admin' ? 'text-[#111827]' : 'text-neutral-900') : 'font-medium text-[#9CA3AF]'}>
          {display || placeholder}
        </span>
        <svg
          className={`shrink-0 ${tone === 'admin' ? 'text-[#9CA3AF]' : 'text-neutral-500'}`}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
      {panel && typeof document !== 'undefined' ? createPortal(panel, document.body) : null}
    </div>
  );
}
