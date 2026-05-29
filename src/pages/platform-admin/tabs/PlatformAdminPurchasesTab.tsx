import { EMPTY_AMOUNT } from '../../../shared/lib/emptyDisplayText';
import { useCallback, useEffect, useState } from 'react';
import { getPlatformPurchases, getPlatformPurchasesSummary } from '../api/platformAdminApi';
import type { PlatformPurchaseRow, PlatformPurchasesSummary } from '../api/platformAdmin.types';
import {
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
} from '../shared/PlatformAdminSharedUi';
import { PlatformAdminLoadMore } from '../shared/PlatformAdminLoadMore';
import {
  labelBillingEventType,
  labelBillingPeriod,
  labelBillingSource,
} from '../platformAdminLabels';

function money(n: number, currency = 'BYN'): string {
  return `${n.toFixed(2)} ${currency}`;
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <PlatformAdminCard className="p-4">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{label}</p>
      <p className="mt-1 text-[22px] font-bold text-[#111827]">{value}</p>
      {hint ? <p className="mt-1 text-[13px] text-[#6B7280]">{hint}</p> : null}
    </PlatformAdminCard>
  );
}

export function PlatformAdminPurchasesTab() {
  const [summary, setSummary] = useState<PlatformPurchasesSummary | null>(null);
  const [items, setItems] = useState<PlatformPurchaseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (offset = 0) => {
    const append = offset > 0;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const [sum, list] = await Promise.all([
        offset === 0 ? getPlatformPurchasesSummary() : Promise.resolve(null),
        getPlatformPurchases({ offset }),
      ]);
      if (sum) setSummary(sum);
      setTotal(list.total);
      setItems((prev) => (append ? [...prev, ...list.purchases] : list.purchases));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  return (
    <div className="space-y-6">
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            label="Выручка всего"
            value={money(summary.totalRevenue)}
            hint={`${summary.purchasesCount} успешных покупок`}
          />
          <SummaryCard
            label="В этом месяце"
            value={money(summary.revenueThisMonth)}
            hint={`${summary.purchasesThisMonth} покупок`}
          />
          <SummaryCard
            label="Со скидкой по промо"
            value={String(summary.withPromoCount)}
            hint={`Скидок выдано на ${money(summary.totalDiscountGiven)}`}
          />
        </div>
      ) : null}

      {loading ? <PlatformAdminLoading /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load(0)} /> : null}

      {!loading && !error && items.length === 0 ? (
        <PlatformAdminEmpty
          title="Покупок пока нет"
          text="Здесь появятся оплаты Pro после подключения тарифа мастерами."
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((row) => (
            <li key={row.id}>
              <PlatformAdminCard className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[15px] font-semibold text-[#111827]">{row.masterName}</p>
                    <p className="mt-0.5 text-[13px] text-[#6B7280]">
                      {labelBillingEventType(row.eventType)}
                      {row.planCode ? ` · ${row.planCode.toUpperCase()}` : ''}
                      {row.billingPeriod ? ` · ${labelBillingPeriod(row.billingPeriod)}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-bold text-[#111827]">
                      {row.amount != null ? money(row.amount, row.currency) : EMPTY_AMOUNT}
                    </p>
                    <p className="text-[12px] text-[#9CA3AF]">{labelBillingSource(row.source)}</p>
                  </div>
                </div>
                {row.promoCode ? (
                  <p className="mt-2 text-[13px] text-[#059669]">
                    Промокод {row.promoCode}
                    {row.discountAmount != null && row.baseAmount != null
                      ? ` · было ${money(row.baseAmount)}, скидка −${money(row.discountAmount)}`
                      : ''}
                  </p>
                ) : null}
                <p className="mt-2 text-[12px] text-[#9CA3AF]">
                  {new Date(row.createdAt).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </PlatformAdminCard>
            </li>
          ))}
        </ul>
      ) : null}

      <PlatformAdminLoadMore
        loadedCount={items.length}
        total={total}
        loading={loadingMore}
        onLoadMore={() => void load(items.length)}
      />
    </div>
  );
}
