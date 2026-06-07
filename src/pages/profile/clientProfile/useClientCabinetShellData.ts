import { useMemo } from 'react';
import { useAuth } from '../../../features/auth/AuthProvider';
import { profileDisplayAvatarUrl, profileDisplayInitials } from '../../../features/profile/lib/profileDisplayAvatar';
import { useIsMasterUser } from '../../../features/profile/hooks/useIsMasterUser';
import { useClientNotifications } from '../notifications/ClientNotificationsContext';
import { formatClientName } from '../../../shared/lib/displayFormat';
import { formatTelegramUserDisplayName } from '../../../shared/lib/telegramWebApp';
import { useTelegram } from '../../../shared/hooks/useTelegram';
export function useClientCabinetShellData() {
  const { profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const { telegramUserPreview } = useTelegram();
  const isMasterCabinet = useIsMasterUser();

  const { hasUnread: hasNewNotifications, unreadCount: notificationCount } = useClientNotifications();

  const { displayName, roleSubtitle, profileInitials } = useMemo(() => {
    if (profile) {
      const name = formatClientName({
        full_name: profile.full_name,
        phone: profile.phone ?? null,
        telegram_username: profile.telegram_username,
      });
      return {
        displayName: name,
        roleSubtitle: 'Клиент\u00a0SLOTTY',
        profileInitials: profileDisplayInitials(name),
      };
    }
    if (telegramUserPreview) {
      const name = formatTelegramUserDisplayName(telegramUserPreview);
      return {
        displayName: name,
        roleSubtitle: 'Клиент\u00a0SLOTTY',
        profileInitials: profileDisplayInitials(name),
      };
    }
    return { displayName: 'Гость', roleSubtitle: 'Войдите через Telegram', profileInitials: '?' };
  }, [profile, telegramUserPreview]);

  const profileAvatarUrl = useMemo(() => profileDisplayAvatarUrl(profile), [profile]);
  const telegramPhotoUrl = telegramUserPreview?.photoUrl ?? null;

  return {
    displayName,
    roleSubtitle,
    profileInitials,
    authLoading,
    isAuthenticated,
    profileAvatarUrl,
    telegramPhotoUrl,
    isMasterCabinet,
    hasNewNotifications,
    notificationCount,
  };
}
