import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiBellAlert, HiEnvelope } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { MASTER_SETTINGS_SECURITY_PATH } from '../../../../../app/paths';
import { fetchAuthIdentities } from '../../../../../features/auth/api/authApi';
import type { AuthIdentityDto } from '../../../../../features/auth/types';
import {
  fetchMasterNotificationPreferences,
  saveMasterNotificationPreferences,
  type MasterNotificationPreferencesDto,
  type NotificationEventKey,
} from '../../../../../features/notifications/api/masterNotificationPreferencesApi';
import { getApiBaseUrl } from '../../../../../shared/api/backendClient';
import { AdminToast } from '../../../shared/AdminToast';
import { useAdminToast } from '../../../shared/useAdminToast';
import { integrationBrandIcon } from '../integrationBrandIcons';
import {
  NotificationChannelsCabinetList,
  NotificationEventsCabinetList,
  type NotificationChannelRow,
} from '../settingsCards';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';
import {
  SettingsCabinetHero,
  SettingsCabinetRingBadge,
  SettingsCabinetSectionTitle,
  SettingsCabinetSurface,
  settingsCabinetStack,
} from '../settingsCabinetUi';
import {
  SettingsComingSoonBanner,
  SettingsErrorState,
  SettingsSkeleton,
  SettingsStickySaveBar,
} from '../settingsUi';

const meta = SETTINGS_PAGE_META.notifications;

function hasProvider(identities: AuthIdentityDto[], provider: string): boolean {
  return identities.some((i) => i.provider === provider);
}

function hasVerifiedEmail(identities: AuthIdentityDto[]): boolean {
  const email = identities.find((i) => i.provider === 'email');
  return Boolean(email?.emailVerified);
}

function NotificationsLoadingSkeleton() {
  return (
    <div className={settingsCabinetStack}>
      <div className="flex items-start gap-4">
        <div className="h-[72px] w-[72px] shrink-0 animate-pulse rounded-full bg-[#F3F4F6]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-48 animate-pulse rounded-lg bg-[#F3F4F6]" />
          <div className="h-4 w-full max-w-sm animate-pulse rounded-lg bg-[#F3F4F6]" />
        </div>
      </div>
      <SettingsSkeleton rows={4} />
    </div>
  );
}

export function SettingsNotificationsPage() {
  const { toast, showToast, showErrorToast, clearToast } = useAdminToast();
  const hasApi = Boolean(getApiBaseUrl());

  const [identities, setIdentities] = useState<AuthIdentityDto[]>([]);
  const [prefs, setPrefs] = useState<MasterNotificationPreferencesDto | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [loading, setLoading] = useState(hasApi);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!hasApi) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ids, p] = await Promise.all([fetchAuthIdentities(), fetchMasterNotificationPreferences()]);
      setIdentities(ids);
      setPrefs(p);
      setSavedSnapshot(JSON.stringify(p));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }, [hasApi]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const linked = useMemo(
    () => ({
      telegram: hasProvider(identities, 'telegram'),
      email: hasVerifiedEmail(identities),
    }),
    [identities],
  );

  const connectedChannels = (linked.telegram ? 1 : 0) + (linked.email ? 1 : 0) + 1;

  const channelRows = useMemo<NotificationChannelRow[]>(
    () => [
      {
        id: 'telegram',
        icon: integrationBrandIcon('telegram'),
        iconTone: 'brand',
        title: 'Telegram',
        subtitle: linked.telegram ? 'Бот и Mini App SLOTTY' : 'Подключите в разделе «Безопасность»',
        connected: linked.telegram,
      },
      {
        id: 'email',
        icon: <HiEnvelope className="h-5 w-5" aria-hidden />,
        title: 'Email',
        subtitle: linked.email
          ? 'Письма на подтверждённую почту'
          : 'Подтвердите email в разделе «Безопасность»',
        connected: linked.email,
      },
      {
        id: 'in_app',
        icon: <HiBellAlert className="h-5 w-5" aria-hidden />,
        title: 'Кабинет',
        subtitle: 'Колокол и лента в кабинете мастера',
        connected: true,
      },
    ],
    [linked.email, linked.telegram],
  );

  const dirty = prefs != null && JSON.stringify(prefs) !== savedSnapshot;

  const onPrefChange = useCallback(
    (eventId: string, channel: 'telegram' | 'email' | 'inApp', value: boolean) => {
      if (!prefs) return;
      setPrefs({
        ...prefs,
        events: {
          ...prefs.events,
          [eventId as NotificationEventKey]: {
            ...prefs.events[eventId as NotificationEventKey],
            [channel]: value,
          },
        },
      });
    },
    [prefs],
  );

  const savePrefs = async () => {
    if (!prefs || !hasApi) return;
    setSaving(true);
    try {
      const saved = await saveMasterNotificationPreferences({
        channels: prefs.channels,
        events: prefs.events,
      });
      setPrefs(saved);
      setSavedSnapshot(JSON.stringify(saved));
      showToast('Настройки уведомлений сохранены');
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (!hasApi) {
    return (
      <>
        <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />
        <SettingsComingSoonBanner
          badge="В разработке"
          title="Настройки уведомлений скоро будут доступны"
          description="Сейчас уведомления отправляются по стандартным правилам SLOTTY. Подключите backend (VITE_API_URL), чтобы сохранять предпочтения."
        />
      </>
    );
  }

  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />

      {loading ? <NotificationsLoadingSkeleton /> : null}

      {error && !loading ? (
        <SettingsErrorState message={error} onRetry={() => void loadAll()} />
      ) : null}

      {prefs && !loading && !error ? (
        <div className={`${settingsCabinetStack} pb-24`}>
          <SettingsCabinetHero
            badge={
              <SettingsCabinetRingBadge
                current={connectedChannels}
                total={3}
                label="каналов"
              />
            }
            title="Куда приходят уведомления"
            description={
              connectedChannels >= 3
                ? 'Все каналы готовы — настройте события ниже'
                : 'Подключите Telegram и email в разделе безопасности'
            }
          />

          {!linked.telegram || !linked.email ? (
            <p className="rounded-[12px] bg-[#FFF1F4] px-4 py-3 text-[13px] leading-relaxed text-[#374151]">
              Не все каналы настроены.{' '}
              <Link
                to={MASTER_SETTINGS_SECURITY_PATH}
                className="font-semibold text-[#ff5f7a] underline-offset-2 hover:underline"
              >
                Открыть «Безопасность»
              </Link>
            </p>
          ) : null}

          <section>
            <SettingsCabinetSectionTitle
              title="Каналы доставки"
              description="Где SLOTTY может присылать уведомления"
            />
            <NotificationChannelsCabinetList channels={channelRows} />
          </section>

          <section>
            <SettingsCabinetSectionTitle
              title="События"
              description="Выберите каналы для каждого типа. «Новая запись» и «Биллинг» всегда включены."
            />
            <NotificationEventsCabinetList
              prefs={prefs.events}
              onChange={onPrefChange}
              disabled={saving}
            />
          </section>

          <section>
            <SettingsCabinetSectionTitle
              title="Проверка доставки"
              description="Тестовые письма и push появятся в следующем обновлении"
            />
            <SettingsCabinetSurface>
              <p className="text-[13px] leading-relaxed text-[#6B7280]">
                Сейчас проверьте подключение Telegram и email в разделе «Безопасность».
              </p>
            </SettingsCabinetSurface>
          </section>
        </div>
      ) : null}

      <SettingsStickySaveBar
        visible={dirty}
        saving={saving}
        onSave={() => void savePrefs()}
        onDiscard={() => {
          if (!savedSnapshot) return;
          setPrefs(JSON.parse(savedSnapshot) as MasterNotificationPreferencesDto);
        }}
      />

      <AdminToast toast={toast} onDismiss={clearToast} />
    </>
  );
}
