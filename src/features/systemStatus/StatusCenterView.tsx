import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowPath, HiChevronDown, HiMagnifyingGlass } from 'react-icons/hi2';
import { MASTER_SETTINGS_SUPPORT_CONTACT_PATH, PUBLIC_STATUS_PATH } from '../../app/paths';
import {
  settingsCabinetOutlineBtn,
  settingsCabinetPrimaryBtn,
} from '../../pages/admin/settings/workspace/settingsCabinetUi';
import type { PublicStatusPage } from './systemStatusApi';
import {
  ComponentCategoryIcon,
  StatusDot,
  statusAccentBar,
  statusPillClass,
  uptimeSegmentClass,
  PUBLIC_STATUS_HERO_BG,
  type StatusCenterVariant,
} from './statusCenterUi';

const INCIDENTS_PREVIEW = 5;

type Props = {
  load: () => Promise<PublicStatusPage>;
  reportIssueHref?: string;
  variant?: StatusCenterVariant;
};

type IncidentRow = {
  id: string;
  title: string;
  subtitle: string;
  updates?: Array<{ id: string; message: string; createdAt: string }>;
  code?: string;
};

function isOperational(status: string): boolean {
  return status === 'operational';
}

export function StatusCenterView({ load, reportIssueHref, variant = 'public' }: Props) {
  const [data, setData] = useState<PublicStatusPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAllIncidents, setShowAllIncidents] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const reportBase = reportIssueHref ?? MASTER_SETTINGS_SUPPORT_CONTACT_PATH;
  const overallStatus = data?.overall.status ?? 'operational';

  const filteredComponents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data?.components ?? [];
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false) ||
        c.category.toLowerCase().includes(q),
    );
  }, [data?.components, search]);

  const incidentRows = useMemo((): IncidentRow[] => {
    if (!data) return [];
    const active: IncidentRow[] = data.activeIncidents.map((inc) => ({
      id: inc.id,
      code: inc.incidentCode,
      title: inc.title,
      subtitle: `${inc.statusLabel} · ${new Date(inc.updatedAt).toLocaleString('ru-RU')}`,
      updates: inc.updates,
    }));
    const history: IncidentRow[] = data.incidentHistory.flatMap((g) =>
      g.incidents.map((inc) => ({
        id: `${g.period}-${inc.incidentCode}`,
        title: inc.title,
        subtitle: `${inc.statusLabel} · ${inc.durationLabel} · ${g.period}`,
      })),
    );
    return [...active, ...history];
  }, [data]);

  const visibleIncidents = showAllIncidents
    ? incidentRows
    : incidentRows.slice(0, INCIDENTS_PREVIEW);

  const toggleIncident = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const primaryMaintenance = data?.maintenance[0];

  return (
    <div className={variant === 'public' ? 'min-h-dvh bg-white text-[#111827]' : 'min-w-0'}>
      {variant === 'public' ? (
        <header
          className="relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden border-b border-white/10 bg-cover bg-center bg-no-repeat px-4 py-12 text-center text-white sm:min-h-[340px] sm:py-16"
          style={{ backgroundImage: `url(${PUBLIC_STATUS_HERO_BG})` }}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0B1220]/30 via-[#0B1220]/10 to-[#0B1220]/55"
            aria-hidden
          />
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-[32px] font-bold tracking-tight text-white drop-shadow-md sm:text-[40px]">
              Статус системы
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/90 drop-shadow-sm">
              Мониторинг доступности платформы в реальном времени: API, записи, оплаты, уведомления и
              интеграции.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to={reportBase} className={`no-underline ${settingsCabinetPrimaryBtn}`}>
                Сообщить о проблеме
              </Link>
            </div>
          </div>
        </header>
      ) : null}

      <div
        className={
          variant === 'public'
            ? 'mx-auto w-full max-w-[960px] px-4 py-10 sm:px-6'
            : 'mx-auto w-full min-w-0'
        }
      >
        {error ? (
          <p className="mb-6 rounded-[12px] bg-[#FEF2F2] px-4 py-3 text-[14px] text-[#B91C1C]" role="alert">
            {error}
          </p>
        ) : null}

        {variant === 'cabinet' ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-[#9CA3AF]">
              {data
                ? `Обновлено: ${new Date(data.monitoring.lastUpdatedAt).toLocaleString('ru-RU')}`
                : 'Загрузка…'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to={reportBase} className={`no-underline ${settingsCabinetPrimaryBtn}`}>
                Сообщить о проблеме
              </Link>
              <Link
                to={PUBLIC_STATUS_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className={`no-underline ${settingsCabinetOutlineBtn}`}
              >
                Публичная страница ↗
              </Link>
            </div>
          </div>
        ) : null}

        {/* Блок общего статуса / плановых работ (как у OKX) */}
        <section className="relative overflow-hidden bg-white">
          <div className={`h-1.5 w-full ${statusAccentBar(overallStatus)}`} />
          <div className="relative px-5 py-6 sm:px-8 sm:py-8">
            <button
              type="button"
              onClick={() => void reload()}
              disabled={loading}
              className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#6B7280] transition hover:bg-[#EBEBEB] hover:text-[#111827] disabled:opacity-50 sm:right-6 sm:top-6`}
              aria-label="Обновить статус"
            >
              <HiArrowPath className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            </button>
            <div className="flex flex-wrap items-start gap-3 pr-12 sm:pr-14">
              <StatusDot ok={isOperational(overallStatus)} />
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusPillClass(overallStatus)}`}
                >
                  {loading ? '…' : data?.overall.badgeLabel}
                </span>
                <h2 className="mt-2 text-[20px] font-bold text-[#111827] sm:text-[24px]">
                  {loading ? 'Загрузка…' : data?.overall.title}
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
                  {data?.overall.description}
                </p>
                {data?.monitoring.label ? (
                  <p className="mt-2 text-[13px] text-[#9CA3AF]">{data.monitoring.label}</p>
                ) : null}
              </div>
            </div>

            {primaryMaintenance ? (
              <div className="mt-6 border-t border-[#F0F1F5] pt-6">
                <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  Плановые работы
                </p>
                <p className="mt-2 text-[16px] font-bold text-[#111827]">{primaryMaintenance.title}</p>
                <p className="mt-1 text-[14px] text-[#6B7280]">
                  {new Date(primaryMaintenance.startsAt).toLocaleString('ru-RU')} —{' '}
                  {new Date(primaryMaintenance.endsAt).toLocaleString('ru-RU')}
                </p>
                {primaryMaintenance.description ? (
                  <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                    {primaryMaintenance.description}
                  </p>
                ) : null}
                <p className="mt-1 text-[13px] text-[#9CA3AF]">
                  Затронуто: {primaryMaintenance.affectedLabels.join(', ')}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {/* Инциденты — только если есть записи */}
        {!loading && incidentRows.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-[18px] font-bold text-[#111827]">Описание проблем</h2>
          <p className="mt-1 text-[14px] text-[#6B7280]">Активные и недавно закрытые инциденты</p>

            <ul className="mt-4 divide-y divide-[#F0F1F5] bg-white">
              {visibleIncidents.map((row) => {
                const open = expandedIds.has(row.id);
                const hasUpdates = (row.updates?.length ?? 0) > 0;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => hasUpdates && toggleIncident(row.id)}
                      className={`flex w-full items-center gap-4 px-4 py-4 text-left transition sm:px-5 ${
                        hasUpdates ? 'hover:bg-[#FAFAFA]' : 'cursor-default'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        {row.code ? (
                          <p className="font-mono text-[11px] font-bold text-[#ff5f7a]">{row.code}</p>
                        ) : null}
                        <p className="text-[15px] font-semibold text-[#111827]">{row.title}</p>
                        <p className="mt-0.5 text-[13px] text-[#9CA3AF]">{row.subtitle}</p>
                      </div>
                      {hasUpdates ? (
                        <HiChevronDown
                          className={`h-5 w-5 shrink-0 text-[#9CA3AF] transition ${open ? 'rotate-180' : ''}`}
                        />
                      ) : null}
                    </button>
                    {open && row.updates ? (
                      <div className="border-t border-[#F0F1F5] bg-[#FAFAFA] px-5 py-4">
                        <ul className="space-y-3">
                          {row.updates.map((u) => (
                            <li key={u.id} className="text-[14px] text-[#374151]">
                              <span className="font-semibold text-[#111827]">
                                {new Date(u.createdAt).toLocaleString('ru-RU')}
                              </span>
                              <span className="text-[#9CA3AF]"> — </span>
                              {u.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>

          {incidentRows.length > INCIDENTS_PREVIEW ? (
            <button
              type="button"
              onClick={() => setShowAllIncidents((v) => !v)}
              className="mt-3 text-[14px] font-semibold text-[#ff5f7a] hover:underline"
            >
              {showAllIncidents ? 'Свернуть' : 'Показать ещё'}
            </button>
          ) : null}
        </section>
        ) : null}

        {/* Таблица сервисов */}
        <section className="mt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">Статус сервисов</h2>
              <p className="mt-1 text-[14px] text-[#6B7280]">Компоненты платформы SLOTTY</p>
            </div>
            <label className="relative block w-full sm:max-w-[280px]">
              <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск сервиса"
                className="w-full rounded-[10px] bg-[#F5F5F5] py-2.5 pl-10 pr-4 text-[14px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:bg-[#EBEBEB] focus:ring-2 focus:ring-[#ff5f7a]/15"
              />
            </label>
          </div>

          <div className="mt-4 overflow-x-auto bg-white">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#F0F1F5] text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  <th className="px-4 py-3 font-bold sm:px-5">Сервис</th>
                  <th className="px-4 py-3 font-bold sm:px-5">Статус</th>
                  <th className="hidden px-4 py-3 font-bold sm:table-cell sm:px-5">Uptime</th>
                  <th className="px-4 py-3 font-bold sm:px-5">Обслуживание</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F1F5]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-[14px] text-[#6B7280]">
                      Загрузка…
                    </td>
                  </tr>
                ) : filteredComponents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-[14px] text-[#6B7280]">
                      Ничего не найдено
                    </td>
                  </tr>
                ) : (
                  filteredComponents.map((c) => {
                    const ok = isOperational(c.status);
                    const inMaintenance = c.status === 'maintenance';
                    return (
                      <tr key={c.key} className="group">
                        <td className="px-4 py-4 sm:px-5">
                          <div className="flex items-start gap-3">
                            <ComponentCategoryIcon category={c.category} />
                            <div className="min-w-0">
                              <p className="text-[15px] font-semibold text-[#111827]">{c.name}</p>
                              {c.description ? (
                                <p className="mt-0.5 text-[12px] text-[#9CA3AF]">{c.description}</p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 sm:px-5">
                          <div className="flex items-center gap-2">
                            <StatusDot ok={ok && !inMaintenance} />
                            <span
                              className={`text-[13px] font-semibold ${ok && !inMaintenance ? 'text-[#ff5f7a]' : 'text-[#6B7280]'}`}
                            >
                              {c.display.statusLabel}
                            </span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-4 sm:table-cell sm:px-5">
                          {c.uptime.hasHistory && c.uptime.bars.length > 0 ? (
                            <div
                              className="flex h-6 max-w-[200px] gap-px overflow-hidden rounded-sm"
                              title={c.uptime.message ?? undefined}
                            >
                              {c.uptime.bars.slice(-30).map((b) => (
                                <div
                                  key={b.date}
                                  className={`min-w-[4px] flex-1 ${uptimeSegmentClass(b.status)}`}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-[12px] text-[#9CA3AF]">{c.uptime.message ?? '—'}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-[13px] text-[#9CA3AF] sm:px-5">
                          {inMaintenance ? (
                            <span className="font-semibold text-[#4338CA]">Плановые работы</span>
                          ) : (
                            '—'
                          )}
                          <Link
                            to={`${reportBase}?component=${encodeURIComponent(c.key)}`}
                            className="mt-1 block text-[12px] font-semibold text-[#ff5f7a] opacity-0 transition group-hover:opacity-100 hover:underline"
                          >
                            Сообщить
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Доп. плановые работы */}
        {(data?.maintenance.length ?? 0) > 1 ? (
          <section className="mt-10">
            <h2 className="text-[18px] font-bold text-[#111827]">Другие плановые работы</h2>
            <ul className="mt-4 divide-y divide-[#F0F1F5] bg-white">
              {data!.maintenance.slice(1).map((m) => (
                <li key={m.id} className="px-5 py-4">
                  <p className="text-[15px] font-semibold text-[#111827]">{m.title}</p>
                  <p className="mt-1 text-[13px] text-[#6B7280]">
                    {new Date(m.startsAt).toLocaleString('ru-RU')} — {new Date(m.endsAt).toLocaleString('ru-RU')}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Информация */}
        <section className="mt-12 border-t border-[#F0F1F5] pt-10">
          <h2 className="text-[16px] font-bold text-[#111827]">О странице статуса</h2>
          <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-[#6B7280]">
            <p>
              Здесь публикуется актуальная информация о доступности SLOTTY: веб-кабинет, API, записи,
              уведомления, оплаты и интеграции. Данные обновляются автоматически по расписанию проверок.
            </p>
            <p>
              Если вы заметили проблему, которой нет в списке, создайте обращение в поддержку — мы
              свяжем инцидент с затронутым сервисом.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
