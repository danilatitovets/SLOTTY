import { useCallback, useEffect, useState } from 'react';
import {
  blockUser,
  getPlatformUsers,
  restrictUser,
  unblockUser,
  unrestrictUser,
} from '../api/platformAdminApi';
import type { PlatformUserDetail, PlatformUserListItem } from '../api/platformAdmin.types';
import { PlatformAdminUserDetailSheet } from '../users/PlatformAdminUserDetailSheet';
import { PlatformAdminPageIntro } from '../shared/PlatformAdminPageIntro';
import { PlatformAdminToolbar } from '../shared/PlatformAdminToolbar';
import {
  ConfirmModal,
  PlatformAdminCard,
  PlatformAdminEmpty,
  PlatformAdminError,
  PlatformAdminLoading,
  StatusBadge,
} from '../shared/PlatformAdminSharedUi';
import { PlatformAdminLoadMore } from '../shared/PlatformAdminLoadMore';
import { paInput } from '../platformAdminTheme';

export function PlatformAdminUsersTab() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [users, setUsers] = useState<PlatformUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<PlatformUserListItem | null>(null);
  const [modal, setModal] = useState<{
    type: 'block' | 'restrict' | 'unblock' | 'unrestrict';
    user: PlatformUserListItem | PlatformUserDetail;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [restrictUntilMode, setRestrictUntilMode] = useState<'forever' | 'date'>('forever');
  const [restrictUntilDate, setRestrictUntilDate] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (offset = 0) => {
    const append = offset > 0;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getPlatformUsers({
        q: q.trim() || undefined,
        role: role === 'all' ? undefined : role,
        status: status === 'all' ? undefined : status,
        offset,
      });
      setTotal(res.total);
      setUsers((prev) => (append ? [...prev, ...res.users] : res.users));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [q, role, status]);

  useEffect(() => {
    const t = setTimeout(() => void load(0), 300);
    return () => clearTimeout(t);
  }, [load]);

  function openUser(u: PlatformUserListItem) {
    setSelectedId(u.id);
    setSelectedPreview(u);
  }

  async function runAction() {
    if (!modal) return;
    setBusy(true);
    try {
      if (modal.type === 'block') await blockUser(modal.user.id, reason);
      else if (modal.type === 'restrict') {
        const until =
          restrictUntilMode === 'date' && restrictUntilDate
            ? new Date(`${restrictUntilDate}T23:59:59.999`).toISOString()
            : undefined;
        await restrictUser(modal.user.id, reason, until);
      }
      else if (modal.type === 'unblock') await unblockUser(modal.user.id);
      else await unrestrictUser(modal.user.id);
      setModal(null);
      setReason('');
      setRestrictUntilMode('forever');
      setRestrictUntilDate('');
      await load(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  const contactLine = (u: PlatformUserListItem) => {
    const parts = [
      u.email,
      u.phone,
      u.telegramUsername ? `@${u.telegramUsername}` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Нет email — откройте карточку для способов входа';
  };

  const modalUserName = modal?.user.fullName ?? '';
  const modalUserIdShort = modal ? `${modal.user.id.slice(0, 8)}…` : '';

  return (
    <div>
      <PlatformAdminPageIntro />

      <PlatformAdminToolbar
        search={{
          value: q,
          onChange: setQ,
          placeholder: 'Имя, email, телефон или Telegram',
        }}
        resultCount={loading ? undefined : total}
        filterGroups={[
          {
            label: 'Роль',
            chips: [
              ['all', 'Все'],
              ['client', 'Клиенты'],
              ['master', 'Мастера'],
              ['admin', 'Админы'],
            ].map(([id, label]) => ({
              id,
              label,
              active: role === id,
              onClick: () => setRole(id),
            })),
          },
          {
            label: 'Статус аккаунта',
            chips: [
              ['all', 'Все'],
              ['active', 'Активные'],
              ['restricted', 'Ограничены'],
              ['blocked', 'Заблокированы'],
            ].map(([id, label]) => ({
              id,
              label,
              active: status === id,
              onClick: () => setStatus(id),
            })),
          },
        ]}
      />

      {loading ? <PlatformAdminLoading /> : null}
      {error ? <PlatformAdminError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && users.length === 0 ? (
        <PlatformAdminEmpty title="Никого не найдено" text="Измените поиск или фильтры." />
      ) : null}

      {!loading && !error ? (
        <div className="space-y-3">
          {users.map((u) => (
            <PlatformAdminCard key={u.id} className="cursor-pointer transition hover:ring-2 hover:ring-[#ff5f7a]/20">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => openUser(u)}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold text-[#111827]">{u.fullName}</h3>
                    <p className="mt-0.5 font-mono text-[11px] text-[#9CA3AF]">{u.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={u.role} />
                    <StatusBadge status={u.accountStatus} />
                  </div>
                </div>

                <p className="mt-2 text-[14px] text-[#6B7280]">{contactLine(u)}</p>

                {u.hasMasterProfile ? (
                  <p className="mt-1 text-[13px] text-[#9CA3AF]">Есть кабинет мастера</p>
                ) : null}

                <p className="mt-3 text-[13px] font-semibold text-[#ff5f7a]">Открыть подробности →</p>
              </button>

              <div
                className="mt-3 flex flex-wrap gap-3 border-t border-[#eef0f5] pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                {u.accountStatus !== 'blocked' ? (
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-[#ef4444]"
                    onClick={() => setModal({ type: 'block', user: u })}
                  >
                    Заблокировать
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-[#374151]"
                    onClick={() => setModal({ type: 'unblock', user: u })}
                  >
                    Разблокировать
                  </button>
                )}
                {u.accountStatus !== 'restricted' && u.accountStatus !== 'blocked' ? (
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-[#374151]"
                    onClick={() => setModal({ type: 'restrict', user: u })}
                  >
                    Ограничить
                  </button>
                ) : u.accountStatus === 'restricted' ? (
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-[#374151]"
                    onClick={() => setModal({ type: 'unrestrict', user: u })}
                  >
                    Снять ограничение
                  </button>
                ) : null}
              </div>
            </PlatformAdminCard>
          ))}
          <PlatformAdminLoadMore
            loadedCount={users.length}
            total={total}
            loading={loadingMore}
            onLoadMore={() => void load(users.length)}
          />
        </div>
      ) : null}

      <PlatformAdminUserDetailSheet
        userId={selectedId}
        listPreview={selectedPreview}
        onClose={() => {
          setSelectedId(null);
          setSelectedPreview(null);
        }}
        onOpenConflict={(id) => {
          const preview = users.find((u) => u.id === id) ?? null;
          setSelectedId(id);
          setSelectedPreview(preview);
        }}
        onModerate={(user) => {
          if (user.accountStatus === 'blocked') {
            setModal({ type: 'unblock', user });
          } else if (user.accountStatus === 'restricted') {
            setModal({ type: 'unrestrict', user });
          } else {
            setModal({ type: 'restrict', user });
          }
        }}
      />

      <ConfirmModal
        open={Boolean(modal)}
        title={
          modal?.type === 'block'
            ? `Заблокировать: ${modalUserName}?`
            : modal?.type === 'restrict'
              ? `Ограничить: ${modalUserName}?`
              : modal?.type === 'unblock'
                ? `Разблокировать: ${modalUserName}?`
                : `Снять ограничение: ${modalUserName}?`
        }
        description={
          modal
            ? [
                `ID: ${modal.user.id}. Действие только для этого профиля (${modalUserIdShort}).`,
                modal.type === 'block'
                  ? 'Пользователь не сможет войти и пользоваться платформой.'
                  : modal.type === 'restrict'
                    ? 'Пользователь сможет войти, но не сможет выполнять действия, влияющие на платформу.'
                    : null,
              ]
                .filter(Boolean)
                .join(' ')
            : undefined
        }
        confirmLabel={modal?.type === 'unblock' || modal?.type === 'unrestrict' ? 'Подтвердить' : 'Применить'}
        danger={modal?.type === 'block'}
        busy={busy}
        onConfirm={() => void runAction()}
        onClose={() => setModal(null)}
      >
        {modal && (modal.type === 'block' || modal.type === 'restrict') ? (
          <div className="space-y-3">
            <textarea
              className={`${paInput} min-h-[80px]`}
              placeholder="Причина *"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {modal.type === 'restrict' ? (
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-[#374151]">Срок</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                      restrictUntilMode === 'forever'
                        ? 'bg-[#111827] text-white'
                        : 'bg-[#f3f4f6] text-[#374151]'
                    }`}
                    onClick={() => setRestrictUntilMode('forever')}
                  >
                    Бессрочно
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                      restrictUntilMode === 'date'
                        ? 'bg-[#111827] text-white'
                        : 'bg-[#f3f4f6] text-[#374151]'
                    }`}
                    onClick={() => setRestrictUntilMode('date')}
                  >
                    До даты
                  </button>
                </div>
                {restrictUntilMode === 'date' ? (
                  <input
                    type="date"
                    className={paInput}
                    value={restrictUntilDate}
                    onChange={(e) => setRestrictUntilDate(e.target.value)}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </ConfirmModal>
    </div>
  );
}
