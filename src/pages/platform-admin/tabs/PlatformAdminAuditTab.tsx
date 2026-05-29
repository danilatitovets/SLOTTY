import { useCallback, useEffect, useState } from 'react';
import { getAuditLogs } from '../api/platformAdminApi';
import type { PlatformAuditLogItem } from '../api/platformAdmin.types';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
import {
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
} from '../shared/PlatformAdminSharedUi';
import { PlatformAdminLoadMore } from '../shared/PlatformAdminLoadMore';
import { labelAdminAuditAction, labelAdminAuditEntity } from '../platformAdminLabels';

function auditTargetLine(log: PlatformAuditLogItem): string | null {
  const meta = log.metadata;
  if (!meta || typeof meta !== 'object') return labelAdminAuditEntity(log.entityType);

  const name =
    (typeof meta.displayName === 'string' && meta.displayName) ||
    (typeof meta.masterName === 'string' && meta.masterName) ||
    (typeof meta.serviceName === 'string' && meta.serviceName) ||
    (typeof meta.fullName === 'string' && meta.fullName) ||
    (typeof meta.title === 'string' && meta.title);

  const entity = labelAdminAuditEntity(log.entityType);
  if (name && entity) return `${entity}: ${name}`;
  if (name) return name;
  return entity;
}

function auditMetaDetails(meta: Record<string, unknown> | null): string[] {
  if (!meta) return [];
  const lines: string[] = [];
  const push = (label: string, key: string) => {
    const v = meta[key];
    if (typeof v === 'string' && v.trim()) lines.push(`${label}: ${v}`);
  };
  push('Причина', 'reason');
  if (typeof meta.oldStatus === 'string' && typeof meta.newStatus === 'string') {
    lines.push(`Статус: ${meta.oldStatus} → ${meta.newStatus}`);
  }
  if (typeof meta.until === 'string') {
    lines.push(`До: ${new Date(meta.until).toLocaleDateString('ru-RU')}`);
  }
  if (typeof meta.validUntil === 'string') {
    lines.push(
      `Pro действует до: ${new Date(meta.validUntil).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    );
  }
  if (typeof meta.days === 'number' && Number.isFinite(meta.days)) {
    lines.push(`Срок: ${meta.days} дн.`);
  }
  if (typeof meta.planCode === 'string') {
    lines.push(`Тариф: ${meta.planCode === 'pro' ? 'Pro' : meta.planCode}`);
  }
  if (typeof meta.contactName === 'string' && meta.contactName.trim()) {
    lines.push(`Контакт: ${meta.contactName}`);
  }
  if (typeof meta.categoryBefore === 'string') {
    const after =
      (typeof meta.categoryAfter === 'string' && meta.categoryAfter) ||
      (typeof meta.requestedCategory === 'string' && meta.requestedCategory) ||
      null;
    if (after) {
      lines.push(`Категория: ${meta.categoryBefore} → ${after}`);
    }
  }
  if (typeof meta.adminComment === 'string' && meta.adminComment.trim()) {
    lines.push(`Комментарий админа: ${meta.adminComment}`);
  }
  return lines;
}

export function PlatformAdminAuditTab() {
  const [logs, setLogs] = useState<PlatformAuditLogItem[]>([]);
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
      const res = await getAuditLogs({ offset });
      setTotal(res.total);
      setLogs((prev) => (append ? [...prev, ...res.logs] : res.logs));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  return (
    <div>
      <PlatformAdminPageIntro />

      {loading ? <PlatformAdminLoading /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load(0)} /> : null}
      {!loading && !error && logs.length === 0 ? (
        <PlatformAdminEmpty
          title="Журнал пуст"
          text="Здесь появятся блокировки, скрытия профилей и другие действия администраторов."
        />
      ) : null}

      {!loading && !error ? (
        <div className="space-y-3">
          {logs.map((log) => {
            const target = auditTargetLine(log);
            return (
              <PlatformAdminCard key={log.id}>
                <p className="text-[13px] text-[#9CA3AF]">
                  {new Date(log.createdAt).toLocaleString('ru-RU')} · {log.adminName}
                </p>
                <h3 className="mt-1 text-[16px] font-bold text-[#111827]">
                  {labelAdminAuditAction(log.action)}
                </h3>
                {target ? <p className="mt-1 text-[14px] text-[#6B7280]">{target}</p> : null}
                {log.reason ? (
                  <p className="mt-2 rounded-xl bg-[#f6f7fb] px-3 py-2 text-[13px] leading-relaxed text-[#374151]">
                    {log.reason}
                  </p>
                ) : null}
                {auditMetaDetails(log.metadata).map((line) => (
                  <p key={line} className="mt-1 text-[13px] text-[#6B7280]">
                    {line}
                  </p>
                ))}
              </PlatformAdminCard>
            );
          })}
          <PlatformAdminLoadMore
            loadedCount={logs.length}
            total={total}
            loading={loadingMore}
            onLoadMore={() => void load(logs.length)}
          />
        </div>
      ) : null}
    </div>
  );
}
