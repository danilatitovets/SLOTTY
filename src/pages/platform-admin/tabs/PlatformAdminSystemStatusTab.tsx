import { useCallback, useEffect, useState } from 'react';
import { fetchPlatformSystemStatus } from '../api/platformAdminApi';
import type { PublicStatusPage } from '../../../features/systemStatus/systemStatusApi';
import { getPlatformAdminPageMeta } from '../platformAdminNav';
import { paCard } from '../platformAdminTheme';

export function PlatformAdminSystemStatusTab() {
  const meta = getPlatformAdminPageMeta('/platform-admin/system-status');
  const [data, setData] = useState<PublicStatusPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchPlatformSystemStatus());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-[#111827]">{meta?.title ?? 'Статус системы'}</h1>
        <p className="mt-1 text-[14px] text-[#6B7280]">
          {meta?.description ??
            'Мониторинг компонентов, инциденты и плановые работы. Управление через API platform-admin.'}
        </p>
      </div>

      {error ? <p className="text-[14px] text-[#B91C1C]">{error}</p> : null}

      <div className={`${paCard} p-5`}>
        {loading || !data ? (
          <p className="text-[14px] text-[#9CA3AF]">Загрузка…</p>
        ) : (
          <>
            <p className="text-[16px] font-bold text-[#111827]">{data.overall.title}</p>
            <p className="mt-1 text-[14px] text-[#6B7280]">{data.monitoring.label}</p>
            <p className="mt-4 text-[13px] text-[#9CA3AF]">
              Создание инцидентов и maintenance: POST/PATCH{' '}
              <code className="rounded bg-[#F3F4F6] px-1">/api/platform-admin/system-status/*</code>
            </p>
            <ul className="mt-4 max-h-[420px] space-y-2 overflow-y-auto text-[14px]">
              {data.components.map((c) => (
                <li key={c.key} className="flex justify-between gap-2 rounded-[10px] bg-[#FAFAFA] px-3 py-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-[#6B7280]">{c.display.statusLabel}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
