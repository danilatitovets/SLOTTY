import type { ChangeEvent, RefObject } from 'react';
import { ClientProfileAvatar } from './ClientProfileAvatar';
import { catalogPrimaryBtn, clientCabinetMobilePanel } from './clientProfileTheme';

type Props = {
  displayName: string;
  roleSubtitle: string;
  profileInitials: string;
  authLoading: boolean;
  isAuthenticated: boolean;
  avatarPreviewUrl: string | null;
  profileAvatarUrl: string | null;
  telegramPhotoUrl: string | null;
  avatarBusy: boolean;
  avatarErr: string | null;
  avatarFileInputRef: RefObject<HTMLInputElement>;
  onAvatarFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  telegramUserPhotoUrl: string | null;
  onApplyTelegramAvatar: () => void;
  onEditProfile: () => void;
};

export function ClientProfileIdentityCard({
  displayName,
  roleSubtitle,
  profileInitials,
  authLoading,
  isAuthenticated,
  avatarPreviewUrl,
  profileAvatarUrl,
  telegramPhotoUrl,
  avatarBusy,
  avatarErr,
  avatarFileInputRef,
  onAvatarFileChange,
  telegramUserPhotoUrl,
  onApplyTelegramAvatar,
  onEditProfile,
}: Props) {
  return (
    <div className={`${clientCabinetMobilePanel} mb-3 overflow-hidden`}>
      <div className="flex flex-col items-center gap-4 px-5 py-6 text-center sm:flex-row sm:items-center sm:text-left lg:px-6 lg:py-7">
        <ClientProfileAvatar
          authLoading={authLoading}
          isAuthenticated={isAuthenticated}
          avatarPreviewUrl={avatarPreviewUrl}
          profileAvatarUrl={profileAvatarUrl}
          telegramPhotoUrl={telegramPhotoUrl}
          profileInitials={profileInitials}
          avatarBusy={avatarBusy}
          avatarFileInputRef={avatarFileInputRef}
          onAvatarFileChange={onAvatarFileChange}
          size="lg"
          showCameraHint
        />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] lg:hidden">
            Профиль
          </p>
          <h2 className="mt-1 text-[22px] font-bold tracking-[-0.03em] text-[#111827] sm:mt-0 sm:text-[24px]">
            {authLoading ? 'Загрузка…' : displayName}
          </h2>
          <p className="mt-1 text-[14px] font-medium text-[#6B7280]">{roleSubtitle}</p>
          {isAuthenticated ? (
            <button type="button" onClick={onEditProfile} className={`${catalogPrimaryBtn} mt-4`}>
              Редактировать
            </button>
          ) : null}
        </div>
      </div>

      {avatarErr ? (
        <p className="border-t border-[#EEEEEE] px-5 py-3 text-[13px] font-medium text-red-600 lg:px-6">
          {avatarErr}
        </p>
      ) : null}

      {isAuthenticated && telegramUserPhotoUrl ? (
        <div className="border-t border-[#EEEEEE] px-5 py-3 lg:px-6">
          <button
            type="button"
            disabled={avatarBusy}
            onClick={onApplyTelegramAvatar}
            className="w-full rounded-[10px] bg-[#F6F7FB] px-3 py-2.5 text-[13px] font-semibold text-[#374151] transition hover:bg-[#F1EFEF] disabled:opacity-50 sm:w-auto"
          >
            Обновить фото из Telegram
          </button>
        </div>
      ) : null}
    </div>
  );
}
