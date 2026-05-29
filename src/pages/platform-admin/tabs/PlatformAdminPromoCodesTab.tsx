import { EMPTY_DATE } from '../../../shared/lib/emptyDisplayText';
import { useCallback, useEffect, useState } from 'react';
import { createPromoCode, getPromoCodes, setPromoCodeActive } from '../api/platformAdminApi';
import type { PromoCodeAdmin } from '../api/platformAdmin.types';
import {
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
} from '../shared/PlatformAdminSharedUi';
import { paGhostBtn, paInput, paPrimaryBtn } from '../platformAdminTheme';
import { labelBillingPeriod } from '../platformAdminLabels';

function formatDate(iso: string | null): string {
  if (!iso) return EMPTY_DATE;
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PlatformAdminPromoCodesTab() {
  const [items, setItems] = useState<PromoCodeAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [billingPeriod, setBillingPeriod] = useState<'' | 'month' | 'year'>('');
  const [maxRedemptions, setMaxRedemptions] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getPromoCodes());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const pct = Number(discountPercent);
    if (!code.trim() || !Number.isFinite(pct) || pct < 1 || pct > 100) return;
    setCreating(true);
    setError(null);
    try {
      await createPromoCode({
        code: code.trim(),
        title: title.trim() || null,
        discountPercent: pct,
        billingPeriod: billingPeriod || null,
        maxRedemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
      });
      setCode('');
      setTitle('');
      setDiscountPercent('10');
      setBillingPeriod('');
      setMaxRedemptions('');
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(row: PromoCodeAdmin) {
    setBusyId(row.id);
    try {
      await setPromoCodeActive(row.id, !row.isActive);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-[#6B7280]">
          Промокоды снижают цену Pro при оформлении. Мастер вводит код на шаге оплаты.
        </p>
        <button type="button" className={paPrimaryBtn} onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? 'Скрыть форму' : 'Новый промокод'}
        </button>
      </div>

      {formOpen ? (
        <PlatformAdminCard className="p-5">
          <form className="space-y-4" onSubmit={(e) => void onCreate(e)}>
            <h3 className="text-[15px] font-semibold text-[#111827]">Создать промокод</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[13px] font-medium text-[#374151]">Код *</span>
                <input
                  className={paInput}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SLOTTY20"
                  required
                  minLength={3}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[13px] font-medium text-[#374151]">Название (внутреннее)</span>
                <input className={paInput} value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[13px] font-medium text-[#374151]">Скидка, % *</span>
                <input
                  className={paInput}
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[13px] font-medium text-[#374151]">Период оплаты</span>
                <select
                  className={paInput}
                  value={billingPeriod}
                  onChange={(e) => setBillingPeriod(e.target.value as '' | 'month' | 'year')}
                >
                  <option value="">Любой (месяц и год)</option>
                  <option value="month">Только месяц</option>
                  <option value="year">Только год</option>
                </select>
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-[13px] font-medium text-[#374151]">Лимит использований</span>
                <input
                  className={paInput}
                  type="number"
                  min={1}
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  placeholder="Без лимита"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className={paPrimaryBtn} disabled={creating}>
                {creating ? 'Создаём…' : 'Создать'}
              </button>
              <button type="button" className={paGhostBtn} onClick={() => setFormOpen(false)}>
                Отмена
              </button>
            </div>
          </form>
        </PlatformAdminCard>
      ) : null}

      {loading ? <PlatformAdminLoading /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load()} /> : null}

      {!loading && !error && items.length === 0 ? (
        <PlatformAdminEmpty title="Промокодов пока нет" text="Создайте первый код для акций и партнёров." />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((row) => (
            <li key={row.id}>
              <PlatformAdminCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[16px] font-bold text-[#111827]">{row.code}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                        row.isActive ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#f3f4f6] text-[#6B7280]'
                      }`}
                    >
                      {row.isActive ? 'Активен' : 'Выключен'}
                    </span>
                  </div>
                  {row.title ? <p className="mt-1 text-[14px] text-[#6B7280]">{row.title}</p> : null}
                  <p className="mt-2 text-[13px] text-[#374151]">
                    Скидка {row.discountPercent}%
                    {row.billingPeriod ? ` · только ${labelBillingPeriod(row.billingPeriod)}` : ''}
                    {' · '}
                    использований: {row.redemptionCount}
                    {row.maxRedemptions != null ? ` / ${row.maxRedemptions}` : ''}
                  </p>
                  <p className="mt-1 text-[12px] text-[#9CA3AF]">
                    Срок: {formatDate(row.validFrom)} — {formatDate(row.validUntil)}
                  </p>
                </div>
                <button
                  type="button"
                  className={paGhostBtn}
                  disabled={busyId === row.id}
                  onClick={() => void toggleActive(row)}
                >
                  {row.isActive ? 'Отключить' : 'Включить'}
                </button>
              </PlatformAdminCard>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
