import { displayOrEmpty, EMPTY_FIELD } from '../../../shared/lib/emptyDisplayText';
import { useCallback, useEffect, useState } from 'react';
import { getPlatformUser } from '../api/platformAdminApi';
import type { PlatformUserDetail, PlatformUserListItem } from '../api/platformAdmin.types';
import {
  PlatformAdminError,
  PlatformAdminLoading,
  StatusBadge,
} from '../shared/PlatformAdminSharedUi';
import { paCard, paGhostBtn, paPrimaryBtn } from '../platformAdminTheme';

const PROVIDER_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  google: 'Google',
  email: 'Email и пароль',
};

function shortId(id: string) {
  return `${id.slice(0, 8)}…`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function identityLine(identity: PlatformUserDetail['identities'][number]) {
  if (identity.provider === 'telegram') {
    return `ID ${identity.providerUserId}`;
  }
  if (identity.provider === 'google') {
    return identity.email ?? `Google ID ${identity.providerUserId.slice(0, 12)}…`;
  }
  const verified = identity.emailVerified ? ' · подтверждён' : ' · не подтверждён';
  return `${identity.email ?? identity.providerUserId}${verified}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF] sm:w-36">
        {label}
      </dt>
      <dd className="min-w-0 text-[14px] font-medium text-[#111827] break-all">{value}</dd>
    </div>
  );
}

type Props = {
  userId: string | null;
  listPreview?: PlatformUserListItem | null;
  onClose: () => void;
  onOpenConflict: (id: string) => void;
  onModerate: (user: PlatformUserDetail) => void;
};

export function PlatformAdminUserDetailSheet({
  userId,
  listPreview,
  onClose,
  onOpenConflict,
  onModerate,
}: Props) {
  const [detail, setDetail] = useState<PlatformUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await getPlatformUser(userId));
    } catch (e) {
      setDetail(null);
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setDetail(null);
      setError(null);
      return;
    }
    void load();
  }, [userId, load]);

  if (!userId) return null;

  const title = detail?.fullName ?? listPreview?.fullName ?? 'Пользователь';

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40" role="presentation" onClick={onClose}>
      <div
        className={`${paCard} flex h-full w-full max-w-lg flex-col rounded-none border-0 shadow-2xl sm:rounded-l-3xl`}
        role="dialog"
        aria-modal
        aria-labelledby="pa-user-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-[#eef0f5] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="pa-user-detail-title" className="truncate text-[20px] font-bold text-[#111827]">
                {title}
              </h2>
              <p className="mt-1 font-mono text-[12px] text-[#9CA3AF]">{userId}</p>
            </div>
            <button type="button" className={paGhostBtn} onClick={onClose}>
              Закрыть
            </button>
          </div>
          {detail ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={detail.role} />
              <StatusBadge status={detail.accountStatus} />
            </div>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? <PlatformAdminLoading rows={3} /> : null}
          {error ? <PlatformAdminError message={error} onRetry={() => void load()} /> : null}

          {detail && !loading && !error ? (
            <div className="space-y-6">
              {detail.emailConflicts.length > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[14px] font-bold text-amber-900">Один email — несколько аккаунтов</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
                    Почта привязана ещё к другим профилям. Ограничения и блокировки действуют только на выбранный
                    аккаунт — проверьте ID перед действием.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {detail.emailConflicts.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="w-full rounded-xl bg-white/80 px-3 py-2 text-left text-[13px] font-semibold text-[#111827] hover:bg-white"
                          onClick={() => onOpenConflict(c.id)}
                        >
                          {c.fullName}{' '}
                          <span className="font-normal text-[#6B7280]">
                            ({c.role === 'master' ? 'мастер' : c.role === 'platform_admin' ? 'админ' : 'клиент'}) ·{' '}
                            {shortId(c.id)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <section>
                <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  Профиль
                </h3>
                <dl className="space-y-3">
                  <DetailRow label="Имя в SLOTTY" value={detail.fullName} />
                  <DetailRow label="Телефон" value={displayOrEmpty(detail.phone)} />
                  <DetailRow
                    label="Telegram"
                    value={detail.telegramUsername ? `@${detail.telegramUsername}` : EMPTY_FIELD}
                  />
                  <DetailRow label="Регистрация" value={formatDate(detail.createdAt)} />
                  <DetailRow label="Записей" value={String(detail.appointmentsCount)} />
                  <DetailRow
                    label="Кабинет мастера"
                    value={detail.hasMasterProfile ? 'Есть' : 'Нет'}
                  />
                </dl>
              </section>

              <section>
                <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                  Способы входа
                </h3>
                {detail.identities.length === 0 ? (
                  <p className="text-[14px] text-[#6B7280]">Нет привязанных способов входа</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.identities.map((identity) => (
                      <li
                        key={`${identity.provider}-${identity.providerUserId}`}
                        className="rounded-2xl bg-[#f6f7fb] px-4 py-3"
                      >
                        <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                          {PROVIDER_LABELS[identity.provider] ?? identity.provider}
                        </p>
                        <p className="mt-1 text-[14px] font-semibold text-[#111827] break-all">
                          {identityLine(identity)}
                        </p>
                        <p className="mt-1 text-[12px] text-[#9CA3AF]">
                          Привязан {formatDate(identity.linkedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {detail.securityEvents && detail.securityEvents.length > 0 ? (
                <section>
                  <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                    Безопасность
                  </h3>
                  <ul className="space-y-2">
                    {detail.securityEvents.map((ev) => (
                      <li key={ev.id} className="rounded-2xl bg-[#f6f7fb] px-4 py-3 text-[13px]">
                        <p className="font-semibold text-[#111827]">{ev.action}</p>
                        <p className="mt-1 text-[12px] text-[#9CA3AF]">{formatDate(ev.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {(detail.blockedReason ||
                detail.accessRestrictionReason ||
                detail.blockedAt ||
                detail.accessRestrictedUntil) && (
                <section>
                  <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                    Модерация
                  </h3>
                  <dl className="space-y-3">
                    {detail.blockedAt ? (
                      <DetailRow label="Заблокирован" value={formatDate(detail.blockedAt)} />
                    ) : null}
                    {detail.blockedReason ? (
                      <DetailRow label="Причина блока" value={detail.blockedReason} />
                    ) : null}
                    {detail.accessRestrictedUntil ? (
                      <DetailRow
                        label="Ограничен до"
                        value={formatDate(detail.accessRestrictedUntil)}
                      />
                    ) : null}
                    {detail.accessRestrictionReason ? (
                      <DetailRow label="Причина ограничения" value={detail.accessRestrictionReason} />
                    ) : null}
                  </dl>
                </section>
              )}
            </div>
          ) : null}
        </div>

        {detail && !loading ? (
          <footer className="shrink-0 border-t border-[#eef0f5] p-4">
            <button
              type="button"
              className={`${paPrimaryBtn} w-full`}
              onClick={() => onModerate(detail)}
            >
              Действия с аккаунтом
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
