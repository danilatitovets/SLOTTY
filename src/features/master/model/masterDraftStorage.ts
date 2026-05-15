import type { MasterDraft, MasterSchedule } from '../../profile/lib/demoMasterStorage';
import {
  getStoredMasterDraft,
  isDemoMaster,
  saveMasterDraft,
} from '../../profile/lib/demoMasterStorage';
import type { MasterLocation } from '../../profile/model/masterLocation';

/** Демо-id по умолчанию для `/master/:id`. TODO (Supabase): id из БД. */
export const DEFAULT_MASTER_ID = 'demo_master_local';

const DEFAULT_SCHEDULE: MasterSchedule = {
  workDays: [0, 1, 2, 3, 4],
  startTime: '09:00',
  endTime: '18:00',
  gapMinutes: 0,
};

function defaultLocation(): MasterLocation {
  return {
    visitType: 'studio',
    city: 'Минск',
    street: '',
    building: '',
    entrance: '',
    floor: '',
    room: '',
    intercom: '',
    landmark: '',
    directions: '',
    clientNote: '',
  };
}

function baseDefaultDraft(): MasterDraft {
  return {
    masterId: DEFAULT_MASTER_ID,
    category: 'Маникюр',
    name: 'Данила',
    description: 'Мастер SLOTTY',
    contact: '@slotty_master',
    services: [],
    schedule: { ...DEFAULT_SCHEDULE },
    location: defaultLocation(),
    createdAt: new Date().toISOString(),
  };
}

/** Флаг `slotty_is_master === 'true'`. */
export function isDemoMasterEnabled(): boolean {
  return isDemoMaster();
}

/**
 * Черновик мастера из `slotty_master_draft` с заполнением полей по умолчанию.
 * Если записи нет — возвращает демо-заготовку (для устойчивого UI кабинета).
 */
export function getMasterDraft(): MasterDraft {
  const raw = getStoredMasterDraft();
  if (!raw) return baseDefaultDraft();
  return normalizeMasterDraft(raw);
}

function normalizeMasterDraft(d: MasterDraft): MasterDraft {
  const base = baseDefaultDraft();
  const sched = d.schedule;
  const workDays =
    Array.isArray(sched?.workDays) && sched.workDays.length > 0 ? [...sched.workDays] : [...base.schedule.workDays];
  return {
    ...base,
    ...d,
    photoUrl: typeof d.photoUrl === 'string' && d.photoUrl.trim() ? d.photoUrl.trim() : undefined,
    phone: typeof d.phone === 'string' && d.phone.trim() ? d.phone.trim() : undefined,
    services: Array.isArray(d.services) ? d.services : [],
    schedule: {
      ...base.schedule,
      ...sched,
      workDays,
      startTime: typeof sched?.startTime === 'string' ? sched.startTime : base.schedule.startTime,
      endTime: typeof sched?.endTime === 'string' ? sched.endTime : base.schedule.endTime,
      gapMinutes: typeof sched?.gapMinutes === 'number' ? sched.gapMinutes : base.schedule.gapMinutes,
    },
    location: {
      ...base.location,
      ...d.location,
      visitType: d.location?.visitType === 'at_home' ? 'at_home' : 'studio',
    },
    experience: typeof d.experience === 'string' ? d.experience : undefined,
    certificates: Array.isArray(d.certificates) ? d.certificates : [],
    portfolio: Array.isArray(d.portfolio) ? d.portfolio : [],
    bookingRules: typeof d.bookingRules === 'string' ? d.bookingRules : undefined,
    cancellationPolicy: typeof d.cancellationPolicy === 'string' ? d.cancellationPolicy : undefined,
    paymentMethods: Array.isArray(d.paymentMethods) ? d.paymentMethods : [],
    paymentNote: typeof d.paymentNote === 'string' ? d.paymentNote : undefined,
    careerItems: Array.isArray(d.careerItems) ? d.careerItems : undefined,
    primaryCategoryId: typeof d.primaryCategoryId === 'string' && d.primaryCategoryId.trim() ? d.primaryCategoryId.trim() : undefined,
  };
}

/** Сохранить черновик в `slotty_master_draft` (нормализация перед записью). */
export function persistMasterDraft(draft: MasterDraft): void {
  saveMasterDraft(normalizeMasterDraft(draft));
}

/** Аватар по имени, если своё фото не задано. По умолчанию 192px — достаточно для карточек, меньше трафика чем 512. */
export function defaultMasterAvatarUrl(name: string, opts?: { size?: number }): string {
  const nameParam = encodeURIComponent((name || 'Мастер').trim() || 'Master');
  const size = opts?.size != null && Number.isFinite(opts.size) ? Math.round(opts.size) : 192;
  const clamped = Math.max(64, Math.min(512, size));
  return `https://ui-avatars.com/api/?name=${nameParam}&background=F1EFEF&color=525252&size=${clamped}`;
}

export { saveMasterDraft } from '../../profile/lib/demoMasterStorage';

export const WEEKDAY_LABELS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

const WEEKDAY_SHORT = WEEKDAY_LABELS_SHORT;

function padTimeHHMM(raw: string): string {
  const t = raw.trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return '09:00';
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = padTimeHHMM(t).split(':').map(Number);
  return h * 60 + m;
}

/** Базовое недельное расписание без слотов по дням (для API через workDays). */
export function buildWeeklyMasterSchedule(
  workDays: number[],
  startTime: string,
  endTime: string,
): MasterSchedule {
  const sorted = [...new Set(workDays.filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b);
  return {
    workDays: sorted.length ? sorted : [0, 1, 2, 3, 4],
    startTime: padTimeHHMM(startTime),
    endTime: padTimeHHMM(endTime),
    gapMinutes: 0,
  };
}

export function validateWeeklySchedule(
  workDays: number[],
  startTime: string,
  endTime: string,
): string | null {
  if (!workDays.length) return 'Выберите хотя бы один рабочий день';
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return 'Время окончания должно быть позже начала';
  }
  return null;
}

/** Строка вида «Клиенты смогут записываться: Пн–Пт, 09:00–18:00». */
export function formatScheduleClientPreview(schedule: MasterSchedule): string {
  const sorted = [...new Set(schedule.workDays)].sort((a, b) => a - b);
  if (!sorted.length) return 'Клиенты смогут записываться: выберите рабочие дни';
  const parts: string[] = [];
  let start = sorted[0]!;
  let prev = sorted[0]!;
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i];
    if (cur !== undefined && cur === prev + 1) {
      prev = cur;
      continue;
    }
    parts.push(start === prev ? WEEKDAY_SHORT[start]! : `${WEEKDAY_SHORT[start]!}–${WEEKDAY_SHORT[prev]!}`);
    if (cur === undefined) break;
    start = cur;
    prev = cur;
  }
  return `Клиенты смогут записываться: ${parts.join(', ')}, ${schedule.startTime}–${schedule.endTime}`;
}
