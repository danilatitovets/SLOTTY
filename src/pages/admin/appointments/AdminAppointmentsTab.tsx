import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ADMIN_BILLING_PATH, ADMIN_SCHEDULE_PATH, ADMIN_SERVICES_PATH } from '../../../app/paths';
import { planBadgeLabel } from '../../../features/billing/model/masterPlans';
import { useMasterPlanEntitlements } from '../../../features/billing/useMasterPlanEntitlements';
import type {
  DemoAppointmentStatus,
  DemoMasterAppointment,
} from '../../../features/master/model/demoMasterAppointments';
import { AdminTabContentTransition } from '../shared/AdminTabContentTransition';
import { AdminToast } from '../shared/AdminToast';
import { useAdminToast } from '../shared/useAdminToast';
import {
  APPOINTMENTS_PAGE_BG,
  apptBillingBanner,
  apptGroupLabel,
  apptListGap,
  apptHistoryDesktopPanel,
  apptHistoryMonthDivider,
  apptMonthLabel,
  apptHistoryTableHead,
  apptHistoryTableHeadCell,
  apptHistoryTableHeadCellEnd,
  apptPinkBtn,
  appointmentsDesktopCard,
  appointmentsDesktopCardPad,
  appointmentsDesktopTabsSticky,
  appointmentsShellCard,
  appointmentsTabPanelShell,
} from './adminAppointmentsTheme';
import { AppointmentsPageHeader } from './AppointmentsPageHeader';
import { AppointmentsSectionTabs } from './AppointmentsSectionTabs';
import {
  AppointmentsActionSheet,
  type AppointmentActionConfig,
} from './AppointmentsActionSheet';
import { AppointmentsBottomTabBar } from './AppointmentsBottomTabBar';
import { AppointmentsEmptyState } from './AppointmentsEmptyState';
import { AppointmentsFiltersSheet } from './AppointmentsFiltersSheet';
import { AppointmentsQuickFilters } from './AppointmentsQuickFilters';
import { AppointmentsHistoryRow } from './AppointmentsHistoryRow';
import { AppointmentsHistorySummary } from './AppointmentsHistorySummary';
import { AppointmentsNearestCard } from './AppointmentsNearestCard';
import { AppointmentsRequestCard } from './AppointmentsRequestCard';
import { AppointmentsUpcomingRow } from './AppointmentsUpcomingRow';
import {
  compareAppointmentsByDateAsc,
  compareAppointmentsByDateDesc,
  compareAppointmentsByPriceAsc,
  compareAppointmentsByPriceDesc,
  filterHistoryByPeriod,
  groupAppointmentsByDay,
  groupAppointmentsByMonth,
  isHistoryAppointment,
  isUpcomingTabAppointment,
  pickNearestUpcoming,
  uniqueServiceTitles,
} from './appointmentsFormat';
import type {
  AppointmentsTabId,
  HistoryPeriodFilter,
  HistorySort,
  HistoryStatusFilter,
  RequestsSort,
  UpcomingSort,
} from './appointmentsTypes';
import { AppointmentsLoadMore } from './AppointmentsLoadMore';
import { useMasterAppointmentsPage } from './useMasterAppointmentsPage';
import { useAdminSectionTab } from '../useAdminSectionTab';
import { AdminCabinetCrossLink } from '../shared/AdminCabinetCrossLink';
import {
  fetchMasterAppointments,
  type MasterAppointmentsTab,
} from '../../../features/admin/api/masterCabinetApi';
import { mapMasterAppointmentRowToDemo } from '../../../features/admin/lib/masterCabinetMapper';

const APPOINTMENTS_TABS = ['requests', 'upcoming', 'history'] as const satisfies readonly AppointmentsTabId[];

const APPOINTMENT_FOCUS_PARAM = 'focus';

function appointmentsTabForStatus(status: string): AppointmentsTabId {
  if (status === 'pending') return 'requests';
  if (status === 'confirmed' || status === 'client_arrived' || status === 'in_progress') {
    return 'upcoming';
  }
  return 'history';
}

type Props = {
  appointments: DemoMasterAppointment[];
  /** API-режим: списки с сервера по вкладкам + пагинация. */
  useRemoteList?: boolean;
  onChangeAppointments: (
    rows: DemoMasterAppointment[],
    options?: { cancelReason?: string },
  ) => void | Promise<void>;
  onOpenDetail: (appointment: DemoMasterAppointment) => void;
};

function updateStatus(
  rows: DemoMasterAppointment[],
  id: string,
  status: DemoAppointmentStatus,
): DemoMasterAppointment[] {
  return rows.map((row) => (row.id === id ? { ...row, status } : row));
}

function apptLimitProgressClass(ratio: number): string {
  if (ratio >= 1) return 'bg-[#EF4444]';
  if (ratio >= 0.85) return 'bg-amber-400';
  return 'bg-[#F47C8C]';
}

export function AdminAppointmentsTab({
  appointments,
  useRemoteList = false,
  onChangeAppointments,
  onOpenDetail,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get(APPOINTMENT_FOCUS_PARAM);
  const focusHandledRef = useRef<string | null>(null);
  const [tab, setTab] = useAdminSectionTab('tab', 'requests', APPOINTMENTS_TABS);
  const remote = useMasterAppointmentsPage({ enabled: useRemoteList, tab });

  const clearAppointmentFocus = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(APPOINTMENT_FOCUS_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (!focusId || focusHandledRef.current === focusId) return;

    const openLocal = (row: DemoMasterAppointment) => {
      focusHandledRef.current = focusId;
      setTab(appointmentsTabForStatus(row.status));
      onOpenDetail(row);
      clearAppointmentFocus();
    };

    if (!useRemoteList) {
      const local = appointments.find((a) => a.id === focusId);
      if (local) openLocal(local);
      else clearAppointmentFocus();
      return;
    }

    let cancelled = false;
    const apiTabs: MasterAppointmentsTab[] = ['pending', 'upcoming', 'history', 'all'];

    void (async () => {
      for (const apiTab of apiTabs) {
        try {
          const out = await fetchMasterAppointments({ tab: apiTab, limit: 100, offset: 0 });
          const row = out.appointments.find((a) => a.id === focusId);
          if (row && !cancelled) {
            const mapped = mapMasterAppointmentRowToDemo(row);
            focusHandledRef.current = focusId;
            setTab(appointmentsTabForStatus(mapped.status));
            onOpenDetail(mapped);
            clearAppointmentFocus();
            return;
          }
        } catch {
          /* пробуем следующую вкладку */
        }
      }
      if (!cancelled) clearAppointmentFocus();
    })();

    return () => {
      cancelled = true;
    };
  }, [
    appointments,
    clearAppointmentFocus,
    focusId,
    onOpenDetail,
    setTab,
    useRemoteList,
  ]);
  const listAppointments = useRemoteList ? remote.items : appointments;
  const [actionConfig, setActionConfig] = useState<AppointmentActionConfig | null>(null);
  const [actionApiError, setActionApiError] = useState<string | null>(null);
  const { toast, showToast, showErrorToast, clearToast } = useAdminToast();

  const [requestsService, setRequestsService] = useState('all');
  const [requestsSort, setRequestsSort] = useState<RequestsSort>('newest');
  const [upcomingService, setUpcomingService] = useState('all');
  const [upcomingSort, setUpcomingSort] = useState<UpcomingSort>('date');
  const [historyStatus, setHistoryStatus] = useState<HistoryStatusFilter>('all');
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriodFilter>('all');
  const [historySort, setHistorySort] = useState<HistorySort>('newest');
  const [historyService, setHistoryService] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setFilterOpen(false);
  }, [tab]);

  const stats = useMemo(() => {
    if (useRemoteList && remote.stats) {
      return {
        requests: remote.stats.pending,
        upcoming: remote.stats.upcoming,
        history: remote.stats.history,
      };
    }
    const requests = appointments.filter((a) => a.status === 'pending').length;
    const upcoming = appointments.filter((a) => isUpcomingTabAppointment(a)).length;
    const history = appointments.filter((a) => isHistoryAppointment(a)).length;
    return { requests, upcoming, history };
  }, [appointments, remote.stats, useRemoteList]);

  const pendingRows = useMemo(() => {
    if (useRemoteList && tab === 'requests') return listAppointments;
    return listAppointments.filter((a) => a.status === 'pending');
  }, [listAppointments, tab, useRemoteList]);

  const upcomingRows = useMemo(() => {
    if (useRemoteList && tab === 'upcoming') return listAppointments;
    return listAppointments.filter((a) => isUpcomingTabAppointment(a));
  }, [listAppointments, tab, useRemoteList]);

  const historyRows = useMemo(() => {
    if (useRemoteList && tab === 'history') return listAppointments;
    return listAppointments.filter((a) => isHistoryAppointment(a));
  }, [listAppointments, tab, useRemoteList]);

  const requestsFiltered = useMemo(() => {
    let rows = pendingRows;
    if (requestsService !== 'all') {
      rows = rows.filter((a) => a.serviceTitle === requestsService);
    }
    return [...rows].sort(
      requestsSort === 'newest' ? compareAppointmentsByDateDesc : compareAppointmentsByDateAsc,
    );
  }, [pendingRows, requestsService, requestsSort]);

  const upcomingFiltered = useMemo(() => {
    let rows = upcomingRows;
    if (upcomingService !== 'all') {
      rows = rows.filter((a) => a.serviceTitle === upcomingService);
    }
    return [...rows].sort(
      upcomingSort === 'date' ? compareAppointmentsByDateAsc : compareAppointmentsByDateDesc,
    );
  }, [upcomingRows, upcomingService, upcomingSort]);

  const nearest = useMemo(() => pickNearestUpcoming(upcomingFiltered), [upcomingFiltered]);

  const upcomingRest = useMemo(() => {
    if (!nearest) return upcomingFiltered;
    return upcomingFiltered.filter((a) => a.id !== nearest.id);
  }, [upcomingFiltered, nearest]);

  const upcomingGroups = useMemo(
    () => groupAppointmentsByDay(upcomingRest),
    [upcomingRest],
  );

  const historySortFn = useMemo(() => {
    switch (historySort) {
      case 'oldest':
        return compareAppointmentsByDateAsc;
      case 'price_high':
        return compareAppointmentsByPriceDesc;
      case 'price_low':
        return compareAppointmentsByPriceAsc;
      default:
        return compareAppointmentsByDateDesc;
    }
  }, [historySort]);

  const historyFiltered = useMemo(() => {
    let rows = historyRows;
    if (historyService !== 'all') {
      rows = rows.filter((a) => a.serviceTitle === historyService);
    }
    if (historyStatus === 'completed') {
      rows = rows.filter((a) => a.status === 'completed' || a.status === 'no_show');
    }
    if (historyStatus === 'cancelled') rows = rows.filter((a) => a.status === 'cancelled');
    rows = filterHistoryByPeriod(rows, historyPeriod);
    return rows;
  }, [historyRows, historyService, historyStatus, historyPeriod]);

  const historyGroups = useMemo(
    () => groupAppointmentsByMonth(historyFiltered, historySortFn),
    [historyFiltered, historySortFn],
  );

  const historySummary = useMemo(() => {
    if (useRemoteList && remote.stats) {
      return {
        completedCount: remote.stats.completedCount,
        cancelledCount: remote.stats.cancelledCount,
        earnedTotal: remote.stats.earnedTotal,
      };
    }
    const completed = historyRows.filter((a) => a.status === 'completed');
    const cancelled = historyRows.filter((a) => a.status === 'cancelled');
    const earned = completed.reduce((s, a) => s + (Number.isFinite(a.priceByn) ? a.priceByn : 0), 0);
    return {
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      earnedTotal: earned,
    };
  }, [historyRows, remote.stats, useRemoteList]);

  const {
    planId: billingPlanId,
    limits: billingLimits,
    monthlyAppointments: monthlyApptCount,
    freeAppointmentLimitReached: atFreeApptLimit,
    freeAppointmentLimitAlmostReached: almostFreeAppt,
  } = useMasterPlanEntitlements();
  const freeApptCap = billingLimits.maxMonthlyAppointments ?? 20;
  const apptUsageRatio = Math.min(1, monthlyApptCount / freeApptCap);

  const openAction = useCallback((config: AppointmentActionConfig) => {
    setActionApiError(null);
    setActionConfig(config);
  }, []);

  const closeAction = useCallback(() => {
    setActionApiError(null);
    setActionConfig(null);
  }, []);

  const applyAction = useCallback(
    async (rejectReason?: string) => {
      if (!actionConfig) return;
      const { appointment, nextStatus } = actionConfig;
      const nextRows = updateStatus(appointments, appointment.id, nextStatus);
      setActionApiError(null);
      try {
        await Promise.resolve(
          onChangeAppointments(nextRows, {
            cancelReason:
              nextStatus === 'cancelled' ? rejectReason?.trim() : undefined,
          }),
        );
        if (useRemoteList) {
          await remote.reload();
        }
        if (nextStatus === 'confirmed') {
          showToast('Запись подтверждена');
          setTab('upcoming');
        } else if (nextStatus === 'completed') {
          showToast('Запись завершена');
          setTab('history');
        } else if (nextStatus === 'cancelled') {
          const suffix = rejectReason ? `: ${rejectReason}` : '';
          showToast(
            actionConfig.kind === 'reject' ? `Заявка отклонена${suffix}` : `Запись отменена${suffix}`,
          );
          setTab('history');
        }
        setActionConfig(null);
      } catch (e) {
        showErrorToast(e instanceof Error ? e.message : 'Не удалось обновить запись');
      }
    },
    [actionConfig, listAppointments, onChangeAppointments, remote, showErrorToast, showToast, useRemoteList],
  );

  const listPagination = useRemoteList ? (
    <AppointmentsLoadMore
      hasMore={remote.hasMore}
      loading={remote.loadingMore}
      loadedCount={remote.items.length}
      total={remote.total}
      onLoadMore={remote.loadMore}
    />
  ) : null;

  const listLoadingBlock =
    useRemoteList && remote.loading && remote.items.length === 0 ? (
      <p className="py-10 text-center text-[14px] font-medium text-[#9CA3AF]">Загрузка записей…</p>
    ) : null;

  const listErrorBlock = useRemoteList && remote.error ? (
    <p className="rounded-[18px] bg-[#FFF0F0] px-4 py-3 text-center text-[14px] font-semibold text-[#9B2C2C]">
      {remote.error}
    </p>
  ) : null;

  const servicePills = (rows: DemoMasterAppointment[]) => [
    { id: 'all', label: 'Все услуги' },
    ...uniqueServiceTitles(rows).map((title) => ({ id: title, label: title })),
  ];

  const sheetFilterActive =
    tab === 'requests'
      ? requestsService !== 'all'
      : tab === 'upcoming'
        ? upcomingService !== 'all'
        : historyService !== 'all';

  const sheetAriaLabel = useMemo(() => {
    if (tab === 'requests') {
      return requestsService === 'all' ? 'Все услуги' : `Услуга: ${requestsService}`;
    }
    if (tab === 'upcoming') {
      return upcomingService === 'all' ? 'Все услуги' : `Услуга: ${upcomingService}`;
    }
    return historyService === 'all' ? 'Все услуги и фильтры' : `Услуга: ${historyService}`;
  }, [tab, requestsService, upcomingService, historyService]);

  const resetFilters = useCallback(() => {
    if (tab === 'requests') {
      setRequestsService('all');
      setRequestsSort('newest');
      return;
    }
    if (tab === 'upcoming') {
      setUpcomingService('all');
      setUpcomingSort('date');
      return;
    }
    setHistoryStatus('all');
    setHistoryPeriod('all');
    setHistorySort('newest');
    setHistoryService('all');
  }, [tab]);

  const renderRequests = () => {
    if (listLoadingBlock) return listLoadingBlock;
    if (listErrorBlock) return listErrorBlock;
    if (!requestsFiltered.length) {
      return (
        <AppointmentsEmptyState
          title="Новых заявок пока нет"
          text="Когда клиент отправит заявку на запись, она появится здесь"
          hint="Чтобы клиенты могли записаться, проверьте услуги и откройте окна в расписании"
          action={
            <div className="flex w-full flex-col gap-2">
              <AdminCabinetCrossLink to={ADMIN_SCHEDULE_PATH}>Открыть расписание</AdminCabinetCrossLink>
              <AdminCabinetCrossLink to={ADMIN_SERVICES_PATH}>Настроить услуги</AdminCabinetCrossLink>
            </div>
          }
        />
      );
    }
    return (
      <>
        <ul className={apptListGap}>
          {requestsFiltered.map((a) => (
            <li key={a.id}>
              <AppointmentsRequestCard
                appointment={a}
                onConfirm={() =>
                  openAction({
                    kind: 'confirm',
                    title: 'Подтвердить заявку?',
                    text: `Клиент ${a.clientName} увидит, что запись подтверждена.`,
                    buttonLabel: 'Подтвердить',
                    nextStatus: 'confirmed',
                    appointment: a,
                  })
                }
                onReject={() =>
                  openAction({
                    kind: 'reject',
                    title: 'Отклонить заявку?',
                    text: `Заявка клиента ${a.clientName} будет перенесена в историю.`,
                    buttonLabel: 'Отклонить',
                    nextStatus: 'cancelled',
                    appointment: a,
                  })
                }
              />
            </li>
          ))}
        </ul>
        {listPagination}
      </>
    );
  };

  const renderUpcoming = () => {
    if (listLoadingBlock) return listLoadingBlock;
    if (listErrorBlock) return listErrorBlock;
    if (!upcomingFiltered.length && useRemoteList && stats.upcoming > 0) {
      return (
        <div className="rounded-[12px] bg-[#FFF4F6] px-4 py-5 text-center">
          <p className="text-[15px] font-semibold text-[#111827]">Записи загружаются…</p>
          <button type="button" className={`${apptPinkBtn} mt-3`} onClick={() => void remote.reload()}>
            Обновить список
          </button>
        </div>
      );
    }
    if (!upcomingFiltered.length) {
      return (
        <AppointmentsEmptyState
          title="Предстоящих записей нет"
          text="Подтверждённые записи появятся здесь после того, как вы примете заявку"
          action={
            stats.requests > 0 ? (
              <button type="button" onClick={() => setTab('requests')} className={apptPinkBtn}>
                Перейти к заявкам ({stats.requests})
              </button>
            ) : (
              <AdminCabinetCrossLink to={ADMIN_SCHEDULE_PATH}>Открыть расписание</AdminCabinetCrossLink>
            )
          }
        />
      );
    }
    return (
      <div className="space-y-4">
        {nearest ? <AppointmentsNearestCard appointment={nearest} onOpen={() => onOpenDetail(nearest)} /> : null}
        {upcomingGroups.map((group) => (
          <section key={group.dayIso}>
            <h3 className={`mb-2 px-0.5 ${apptGroupLabel}`}>{group.label}</h3>
            <ul className={apptListGap}>
              {group.items.map((a) => (
                <li key={a.id}>
                  <AppointmentsUpcomingRow appointment={a} onOpen={() => onOpenDetail(a)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        {listPagination}
      </div>
    );
  };

  const renderHistory = () => {
    if (listLoadingBlock) return listLoadingBlock;
    if (listErrorBlock) return listErrorBlock;
    if (!historyRows.length) {
      return (
        <AppointmentsEmptyState
          title="Истории записей пока нет"
          text="Завершённые и отменённые записи появятся здесь"
        />
      );
    }
    if (!historyFiltered.length) {
      return (
        <AppointmentsEmptyState
          title="Ничего не найдено"
          text="Попробуйте изменить фильтры статуса или периода"
        />
      );
    }
    const historyFilters = (
      <AppointmentsQuickFilters
        sheetActive={sheetFilterActive}
        sheetOpen={filterOpen}
        onOpenSheet={() => setFilterOpen(true)}
        sheetAriaLabel={sheetAriaLabel}
      />
    );

    return (
      <div className="space-y-3 lg:space-y-5">
        <div className="relative lg:hidden">
          <AppointmentsHistorySummary
            completedCount={historySummary.completedCount}
            earnedTotal={historySummary.earnedTotal}
            cancelledCount={historySummary.cancelledCount}
          />
          <div className="absolute right-3 top-3.5">{historyFilters}</div>
        </div>

        <div className="hidden items-start justify-between gap-5 lg:flex">
          <AppointmentsHistorySummary
            completedCount={historySummary.completedCount}
            earnedTotal={historySummary.earnedTotal}
            cancelledCount={historySummary.cancelledCount}
          />
          <div className="shrink-0 pt-1">{historyFilters}</div>
        </div>

        <div className={apptHistoryDesktopPanel}>
          <div className={apptHistoryTableHead} role="row">
            <span className={apptHistoryTableHeadCell}>Клиент</span>
            <span className={apptHistoryTableHeadCell}>Услуга</span>
            <span className={apptHistoryTableHeadCell}>Дата</span>
            <span className={apptHistoryTableHeadCellEnd}>Сумма</span>
            <span className={apptHistoryTableHeadCellEnd}>Статус</span>
          </div>
          {historyGroups.map((group, groupIndex) => (
            <section key={group.monthKey} className={groupIndex > 0 ? 'border-t border-[#F0F0F0]' : undefined}>
              <h3 className={apptHistoryMonthDivider}>{group.label}</h3>
              <ul className="flex flex-col" role="list">
                {group.items.map((a, rowIndex) => (
                  <li key={a.id} className={rowIndex === group.items.length - 1 ? 'last:[&_button]:border-b-0' : undefined}>
                    <AppointmentsHistoryRow appointment={a} onOpen={() => onOpenDetail(a)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {historyGroups.map((group) => (
          <section key={`${group.monthKey}-mobile`} className="lg:hidden">
            <h3 className={apptMonthLabel}>{group.label}</h3>
            <ul className={apptListGap}>
              {group.items.map((a) => (
                <li key={a.id}>
                  <AppointmentsHistoryRow appointment={a} onOpen={() => onOpenDetail(a)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        {listPagination}
      </div>
    );
  };

  const billingBanner =
    billingPlanId === 'free' ? (
      <section
        className={`${apptBillingBanner} ${
          atFreeApptLimit ? 'border-amber-300 ring-amber-100' : almostFreeAppt ? 'border-amber-200' : ''
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 flex-1 text-[14px] font-semibold text-[#374151]">
            {planBadgeLabel(billingPlanId)} · {monthlyApptCount} / {freeApptCap} записей в месяце
          </p>
          <Link
            to={ADMIN_BILLING_PATH}
            className="inline-flex shrink-0 rounded-[10px] bg-[#F47C8C] px-3 py-1.5 text-[12px] font-bold text-white transition hover:opacity-95 active:scale-[0.98]"
          >
            Мой тариф
          </Link>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EBEBEB]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${apptLimitProgressClass(apptUsageRatio)}`}
            style={{ width: `${apptUsageRatio * 100}%` }}
            role="progressbar"
            aria-valuenow={monthlyApptCount}
            aria-valuemin={0}
            aria-valuemax={freeApptCap}
            aria-label={`Записей в месяце: ${monthlyApptCount} из ${freeApptCap}`}
          />
        </div>
        {atFreeApptLimit || almostFreeAppt ? (
          <p className="mt-1.5 text-[12px] font-semibold text-amber-800/85">
            {atFreeApptLimit
              ? 'Лимит Free исчерпан — откройте Pro в тарифах.'
              : 'Почти достигнут лимит Free на этот месяц.'}
          </p>
        ) : null}
      </section>
    ) : null;

  const filterSheets = (
    <>
      {tab === 'requests' ? (
        <AppointmentsFiltersSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          mode="requests"
          serviceOptions={servicePills(pendingRows)}
          service={requestsService}
          onService={setRequestsService}
          sort={requestsSort}
          onSort={setRequestsSort}
          onReset={resetFilters}
        />
      ) : null}
      {tab === 'upcoming' ? (
        <AppointmentsFiltersSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          mode="upcoming"
          serviceOptions={servicePills(upcomingRows)}
          service={upcomingService}
          onService={setUpcomingService}
          sort={upcomingSort}
          onSort={setUpcomingSort}
          onReset={resetFilters}
        />
      ) : null}
      {tab === 'history' ? (
        <AppointmentsFiltersSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          mode="history"
          serviceOptions={servicePills(historyRows)}
          service={historyService}
          onService={setHistoryService}
          sort={historySort}
          onSort={setHistorySort}
          status={historyStatus}
          onStatus={setHistoryStatus}
          period={historyPeriod}
          onPeriod={setHistoryPeriod}
          onReset={resetFilters}
        />
      ) : null}
    </>
  );

  const toolbar = (
    <AppointmentsQuickFilters
      sheetActive={sheetFilterActive}
      sheetOpen={filterOpen}
      onOpenSheet={() => setFilterOpen(true)}
      sheetAriaLabel={sheetAriaLabel}
    />
  );

  const tabPanels = (
    <AdminTabContentTransition activeKey={tab} className="min-w-0">
      {tab === 'requests' ? renderRequests() : null}
      {tab === 'upcoming' ? renderUpcoming() : null}
      {tab === 'history' ? renderHistory() : null}
    </AdminTabContentTransition>
  );

  const mobileBody = (
    <section
      className={`-mx-4 min-w-0 space-y-4 px-4 pb-[calc(5.75rem+1.25rem+env(safe-area-inset-bottom,0px))] lg:hidden ${APPOINTMENTS_PAGE_BG}`}
    >
      <AppointmentsPageHeader tab={tab} stats={stats} />
      {billingBanner}
      {tab === 'history' ? null : toolbar}
      {tabPanels}
    </section>
  );

  const desktopBody = (
    <div className={`${appointmentsShellCard} space-y-6`}>
      <div className={`${appointmentsDesktopCard} ${appointmentsDesktopTabsSticky}`}>
        <AppointmentsSectionTabs active={tab} onChange={setTab} counts={stats} />
      </div>
      <div className="min-w-0 space-y-6">
        <AppointmentsPageHeader tab={tab} stats={stats} />
        {billingBanner}
        <div
          className={
            tab === 'history'
              ? 'min-w-0 max-lg:overflow-hidden max-lg:rounded-[16px] max-lg:bg-white max-lg:ring-1 max-lg:ring-[#EEEEEE] lg:bg-transparent lg:ring-0'
              : appointmentsTabPanelShell
          }
        >
          <div
            className={
              tab === 'history'
                ? 'space-y-4 max-lg:p-4 max-lg:sm:p-5 lg:space-y-5 lg:p-0'
                : `space-y-4 lg:space-y-5 ${appointmentsDesktopCardPad}`
            }
          >
            <div className={tab === 'history' ? 'lg:hidden' : undefined}>{toolbar}</div>
            {tabPanels}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AppointmentsBottomTabBar active={tab} onChange={setTab} variant="mobile" />
      {mobileBody}
      {desktopBody}
      <AdminToast toast={toast} onDismiss={clearToast} />
      {filterSheets}
      <AppointmentsActionSheet
        config={actionConfig}
        apiError={actionApiError}
        onClose={closeAction}
        onConfirm={(reason) => void applyAction(reason)}
      />
    </>
  );
}
