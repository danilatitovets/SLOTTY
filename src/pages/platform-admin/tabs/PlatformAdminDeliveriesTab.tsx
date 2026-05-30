import { useCallback, useEffect, useState } from 'react';
import { EMPTY_DATE } from '../../../shared/lib/emptyDisplayText';
import { getAppointmentReminderFailures, getNotificationDeliveries } from '../api/platformAdminApi';
import type { AppointmentReminderFailureAdmin, NotificationDeliveryAdmin } from '../api/platformAdmin.types';
import {
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
} from '../shared/PlatformAdminSharedUi';
import { paFilterChip, paInput } from '../platformAdminTheme';

function formatDate(iso: string | null): string {
  if (!iso) return EMPTY_DATE;
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PlatformAdminDeliveriesTab() {
  const [deliveries, setDeliveries] = useState<NotificationDeliveryAdmin[]>([]);
  const [reminderFailures, setReminderFailures] = useState<AppointmentReminderFailureAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'skipped'>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, r] = await Promise.all([
        getNotificationDeliveries({
          channel: 'telegram',
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: search.trim() || undefined,
          limit: 50,
        }),
        getAppointmentReminderFailures({ search: search.trim() || undefined, limit: 30 }),
      ]);
      setDeliveries(d.items);
      setReminderFailures(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PlatformAdminLoading />;
  if (error) return <PlatformAdminError message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className={`${paInput} max-w-sm`}
          placeholder="Поиск по email / имени"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {(['all', 'sent', 'failed', 'skipped'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={paFilterChip(statusFilter === s)}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'Все' : s}
            </button>
          ))}
        </div>
      </div>

      <PlatformAdminCard className="overflow-x-auto p-4">
        <p className="mb-3 text-[14px] font-semibold text-[#111827]">Telegram delivery log</p>
        {deliveries.length === 0 ? (
          <PlatformAdminEmpty title="Нет записей" text="Логи появятся после отправки in-app → Telegram." />
        ) : (
          <table className="min-w-full text-left text-[13px]">
            <thead>
              <tr className="text-[#6B7280]">
                <th className="pb-2 pr-4">Пользователь</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Статус</th>
                <th className="pb-2 pr-4">Ошибка</th>
                <th className="pb-2">Когда</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((row) => (
                <tr key={row.id} className="border-t border-[#eef0f5]">
                  <td className="py-2 pr-4">{row.fullName}</td>
                  <td className="py-2 pr-4">{row.email ?? '—'}</td>
                  <td className="py-2 pr-4">{row.status}</td>
                  <td className="py-2 pr-4 text-[#9CA3AF]">{row.errorMessage ?? '—'}</td>
                  <td className="py-2">{formatDate(row.sentAt ?? row.failedAt ?? row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PlatformAdminCard>

      <PlatformAdminCard className="overflow-x-auto p-4">
        <p className="mb-3 text-[14px] font-semibold text-[#111827]">Appointment reminder failures</p>
        {reminderFailures.length === 0 ? (
          <PlatformAdminEmpty title="Нет ошибок" text="Неудачные напоминания о записях появятся здесь." />
        ) : (
          <table className="min-w-full text-left text-[13px]">
            <thead>
              <tr className="text-[#6B7280]">
                <th className="pb-2 pr-4">Клиент</th>
                <th className="pb-2 pr-4">Тип</th>
                <th className="pb-2 pr-4">Retry</th>
                <th className="pb-2 pr-4">Ошибка</th>
                <th className="pb-2">Когда</th>
              </tr>
            </thead>
            <tbody>
              {reminderFailures.map((row) => (
                <tr key={`${row.appointmentId}-${row.reminderKind}`} className="border-t border-[#eef0f5]">
                  <td className="py-2 pr-4">
                    {row.fullName}
                    {row.email ? ` · ${row.email}` : ''}
                  </td>
                  <td className="py-2 pr-4">{row.reminderKind}</td>
                  <td className="py-2 pr-4">{row.retryCount}</td>
                  <td className="py-2 pr-4 text-[#9CA3AF]">{row.errorMessage ?? '—'}</td>
                  <td className="py-2">{formatDate(row.failedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PlatformAdminCard>
    </div>
  );
}
