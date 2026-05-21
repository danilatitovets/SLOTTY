import { ProfileSheetShell } from '../../../pages/profile/components/ProfileSheetShell';
import { LoginMethodsPanel } from './LoginMethodsPanel';

type Props = {
  open: boolean;
  onClose: () => void;
  /** settings = привязка; login = вход без аккаунта */
  mode?: 'settings' | 'login';
  onLinked?: () => void;
};

export function LoginMethodsSheet({ open, onClose, mode = 'settings', onLinked }: Props) {
  if (!open) return null;

  const handleLinked = () => {
    onLinked?.();
    if (mode === 'login') onClose();
  };

  return (
    <ProfileSheetShell onClose={onClose} labelledBy="login-methods-sheet-title">
      <SheetHandle />
      <h2
        id="login-methods-sheet-title"
        className="text-[22px] font-bold tracking-[-0.04em] text-[#111827]"
      >
        Способы входа
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
        {mode === 'settings'
          ? 'Подключите 2–3 способа — так вы не потеряете доступ к кабинету, даже если смените телефон или почту.'
          : 'Войдите, чтобы сохранить записи и настройки.'}
      </p>
      <div className="mt-5 pb-2">
        <LoginMethodsPanel mode={mode} appearance="sheet" onLinked={handleLinked} />
      </div>
    </ProfileSheetShell>
  );
}

function SheetHandle() {
  return (
    <div className="-mt-1 mb-4 flex justify-center sm:hidden" aria-hidden>
      <div className="h-1 w-10 rounded-full bg-[#EAECEF]" />
    </div>
  );
}
