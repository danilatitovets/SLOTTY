import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PLATFORM_ADMIN_REQUESTS_PATH } from '../../../app/paths';
import { getPlatformAdminOverview } from '../api/platformAdminApi';
import type { PlatformAdminOverview } from '../api/platformAdmin.types';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
import {
  PlatformAdminError,
  PlatformAdminLoading,
} from '../shared/PlatformAdminSharedUi';
import { paCard } from '../platformAdminTheme';

function KpiCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className={`${paCard} p-5`}>
      <p className="text-[13px] font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-2 text-[32px] font-bold tabular-nums tracking-tight text-[#111827]">{value}</p>
      {hint ? <p className="mt-1.5 text-[12px] leading-snug text-[#9CA3AF]">{hint}</p> : null}
    </div>
  );
}

export function PlatformAdminOverviewTab() {
  const [data, setData] = useState<PlatformAdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getPlatformAdminOverview());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PlatformAdminPageIntro />

      {loading ? <PlatformAdminLoading rows={4} /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load()} /> : null}

      {!loading && !error && data ? (
        <div className="space-y-8">
          {data.pendingCategoryRequests > 0 || data.pendingSponsorRequests > 0 ? (
            <div className="space-y-3">
              {data.pendingCategoryRequests > 0 ? (
                <div
                  className={`${paCard} flex flex-col gap-4 border-[#FDE8ED] bg-[#FFF8F9] p-5 sm:flex-row sm:items-center sm:justify-between`}
                >
                  <div>
                    <p className="text-[15px] font-bold text-[#111827]">Смена категории</p>
                    <p className="mt-1 text-[14px] text-[#6B7280]">
                      {data.pendingCategoryRequests} заявок на проверке
                    </p>
                  </div>
                  <Link
                    to={PLATFORM_ADMIN_REQUESTS_PATH}
                    className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#ff5f7a] px-5 py-2.5 text-[14px] font-semibold text-white"
                  >
                    Открыть
                  </Link>
                </div>
              ) : null}
              {data.pendingSponsorRequests > 0 ? (
                <div
                  className={`${paCard} flex flex-col gap-4 border-[#FDE8ED] bg-[#FFF8F9] p-5 sm:flex-row sm:items-center sm:justify-between`}
                >
                  <div>
                    <p className="text-[15px] font-bold text-[#111827]">Спонсорство SLOTTY</p>
                    <p className="mt-1 text-[14px] text-[#6B7280]">
                      {data.pendingSponsorRequests} заявок от мастеров
                    </p>
                  </div>
                  <Link
                    to={`${PLATFORM_ADMIN_REQUESTS_PATH}?kind=sponsor`}
                    className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#ff5f7a] px-5 py-2.5 text-[14px] font-semibold text-white"
                  >
                    Открыть
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          <section>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
              Люди на платформе
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Всего аккаунтов" value={data.usersTotal} />
              <KpiCard label="Клиенты" value={data.clientsTotal} />
              <KpiCard label="Мастера" value={data.mastersTotal} />
              <KpiCard
                label="В каталоге"
                value={data.activeMastersTotal}
                hint="Опубликованные профили"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
              Записи и модерация
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard label="Записи сегодня" value={data.bookingsToday} />
              <KpiCard label="Отмены за 7 дней" value={data.cancellationsLast7Days} />
              <KpiCard label="Заблокированные" value={data.blockedUsers} />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
