import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import {
  createMySlot,
  deleteMySlot,
  getMySlots,
  type MySlotDto,
} from '../../../features/admin/api/adminSlotsApi';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { SlottySelect } from '../../../shared/ui/SlottySelect';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function buildTimeOptions(): string[] {
  const out: string[] = [];
  for (let h = 6; h <= 23; h += 1) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 23 && m > 0) break;
      out.push(`${pad2(h)}:${pad2(m)}`);
    }
  }
  return out;
}

const TIME_OPTIONS = buildTimeOptions().map((time) => ({ value: time, label: time }));

function localDateTimeToUtcIso(dateIso: string, timeHm: string): string {
  const [y, mo, d] = dateIso.split('-').map(Number);
  const [hh, mm] = timeHm.split(':').map(Number);
  const local = new Date(y, (mo || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return local.toISOString();
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatSlotDate(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d);
}

function formatSlotTimeRange(s: MySlotDto): string {
  const a = new Date(s.startsAt);
  const b = new Date(s.endsAt);
  const ta = a.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const tb = b.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${ta}–${tb}`;
}

function serviceTitleById(services: MasterOnboardingService[], id: string | null): string {
  if (!id) return 'Любая услуга';
  const s = services.find((x) => x.id === id);
  return s?.title ?? 'Услуга';
}

type Props = {
  visibleServices: MasterOnboardingService[];
  /** Загружать слоты только когда вкладка «Ручные окна» активна — меньше лишних запросов. */
  loadSlots: boolean;
};

export function AdminMasterRealSlotsPanel({ visibleServices, loadSlots }: Props) {
  const { useCabinetApi } = useAdminMasterCabinet();
  const [rows, setRows] = useState<MySlotDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [dateIso, setDateIso] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  });
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [serviceId, setServiceId] = useState<string>('');

  const serviceOptions = useMemo(
    () => [
      { value: '', label: 'Любая услуга' },
      ...visibleServices
        .filter((s) => isUuid(s.id))
        .map((s) => ({ value: s.id, label: s.title })),
    ],
    [visibleServices],
  );

  useEffect(() => {
    if (!loadSlots || !useCabinetApi) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getMySlots();
        if (!cancelled) setRows(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить окна');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSlots, useCabinetApi]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  const validateForm = useCallback((): string | null => {
    if (!dateIso.trim()) return 'Укажите дату.';
    if (!startTime.trim() || !endTime.trim()) return 'Укажите время начала и окончания.';
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return 'Время окончания должно быть позже начала.';
    }
    const startsAtMs = new Date(localDateTimeToUtcIso(dateIso, startTime)).getTime();
    if (startsAtMs <= Date.now()) return 'Нельзя добавить окно в прошлом.';
    if (serviceId.trim()) {
      const sid = serviceId.trim();
      if (!isUuid(sid)) return 'Выберите услугу из списка.';
      if (!visibleServices.some((s) => s.id === sid)) return 'Услуга недоступна или скрыта.';
    }
    return null;
  }, [dateIso, endTime, serviceId, startTime, visibleServices]);

  const onCreate = useCallback(async () => {
    if (!useCabinetApi) return;
    const v = validateForm();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const startsAt = localDateTimeToUtcIso(dateIso, startTime);
      const endsAt = localDateTimeToUtcIso(dateIso, endTime);
      await createMySlot({
        startsAt,
        endsAt,
        serviceId: serviceId.trim() ? serviceId.trim() : null,
      });
      showToast('Окно добавлено');
      const list = await getMySlots();
      setRows(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания');
    } finally {
      setSaving(false);
    }
  }, [dateIso, endTime, serviceId, showToast, startTime, useCabinetApi, validateForm]);

  const onDelete = useCallback(
    async (id: string) => {
      if (!useCabinetApi) return;
      if (!window.confirm('Удалить это окно? Клиенты больше не увидят это время.')) return;
      setError(null);
      try {
        await deleteMySlot(id);
        showToast('Удалено');
        const list = await getMySlots();
        setRows(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось удалить');
      }
    },
    [showToast, useCabinetApi],
  );

  const futureRows = useMemo(() => rows.filter((r) => new Date(r.endsAt).getTime() > Date.now()), [rows]);

  if (!useCabinetApi) {
    return (
      <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
        <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-neutral-950">Ручные окна</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
          Создание окон на сервере доступно в подключённом кабинете мастера. В демо-режиме используйте «По графику».
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
        <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-neutral-950">Свободные окна</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
          Добавьте конкретные времена, на которые клиенты смогут записаться.
        </p>

        {toast ? (
          <p className="mt-4 rounded-[20px] bg-[#EAFBF2] px-4 py-3 text-center text-[14px] font-semibold text-[#2F8A5B]">
            {toast}
          </p>
        ) : null}

        <div className="mt-5 space-y-4 rounded-[24px] bg-[#F8F6F6] p-4">
          <label className="block">
            <span className="text-[13px] font-semibold text-neutral-500">Дата</span>
            <input
              type="date"
              value={dateIso}
              onChange={(e) => {
                setDateIso(e.target.value);
                setError(null);
              }}
              className="mt-1.5 w-full rounded-[18px] border border-neutral-200/60 bg-white px-4 py-3.5 text-[16px] font-semibold text-neutral-900 outline-none focus:border-[#E29595]"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[13px] font-semibold text-neutral-500">С</span>
              <SlottySelect className="mt-1.5 w-full" value={startTime} onChange={setStartTime} options={TIME_OPTIONS} />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-neutral-500">По</span>
              <SlottySelect className="mt-1.5 w-full" value={endTime} onChange={setEndTime} options={TIME_OPTIONS} />
            </label>
          </div>
          <label className="block">
            <span className="text-[13px] font-semibold text-neutral-500">Услуга</span>
            <SlottySelect
              className="mt-1.5 w-full"
              value={serviceId}
              onChange={(v) => {
                setServiceId(v);
                setError(null);
              }}
              options={serviceOptions}
            />
          </label>
          {error ? (
            <p className="rounded-[20px] bg-[#FFF0F0] px-4 py-3 text-[14px] font-semibold text-[#9B2C2C]">{error}</p>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void onCreate()}
            className="flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#E29595] text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.22)] transition active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? 'Добавляем…' : 'Добавить окно'}
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
        <h3 className="text-[18px] font-semibold tracking-[-0.04em] text-neutral-950">Активные окна</h3>
        {loading ? (
          <p className="mt-4 text-[15px] text-neutral-500">Загрузка…</p>
        ) : futureRows.length === 0 ? (
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">
            Пока нет будущих окон. Добавьте первое окно выше.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {futureRows.map((s) => {
              const a = new Date(s.startsAt);
              return (
                <li
                  key={s.id}
                  className="rounded-[22px] border border-neutral-100 bg-[#F8F6F6] p-4"
                >
                  <p className="text-[16px] font-semibold text-neutral-950">{formatSlotDate(a)}</p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-700">{formatSlotTimeRange(s)}</p>
                  <p className="mt-1 text-[14px] text-neutral-500">{serviceTitleById(visibleServices, s.serviceId)}</p>
                  {s.status === 'available' ? (
                    <button
                      type="button"
                      onClick={() => void onDelete(s.id)}
                      className="mt-3 w-full rounded-full border border-neutral-200 bg-white py-2.5 text-[14px] font-semibold text-[#9B2C2C] transition active:scale-[0.98]"
                    >
                      Удалить
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
        <h3 className="text-[16px] font-semibold text-neutral-950">Как увидит клиент</h3>
        {futureRows.length === 0 ? (
          <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">Пока нет доступного времени для записи</p>
        ) : (
          <div className="mt-3 space-y-2">
            {futureRows.slice(0, 6).map((s) => {
              const a = new Date(s.startsAt);
              const line = `${formatSlotDate(a)}, ${formatSlotTimeRange(s)} · ${serviceTitleById(visibleServices, s.serviceId)}`;
              return (
                <p
                  key={s.id}
                  className="rounded-[16px] bg-[#F8F6F6] px-3 py-2 text-[13px] font-medium leading-snug text-neutral-800"
                >
                  {line}
                </p>
              );
            })}
          </div>
        )}
        {visibleServices.length === 0 ? (
          <p className="mt-3 text-[14px] text-neutral-500">
            Нет видимых услуг —{' '}
            <Link to={ADMIN_SERVICES_PATH} className="font-semibold text-[#E29595] underline-offset-2 hover:underline">
              перейдите к услугам
            </Link>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}
