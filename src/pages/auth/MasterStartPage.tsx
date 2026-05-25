import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ADMIN_PATH,
  BECOME_MASTER_PATH,
  getMasterLoginPath,
  getMasterRegisterPath,
  HUB_PATH,
} from '../../app/paths';
import { useAuth } from '../../features/auth/AuthProvider';
import { useIsMasterUser } from '../../features/profile/hooks/useIsMasterUser';
import { LoadingScreen } from '../../shared/ui/LoadingVideo';
import { AuthSplitLayout } from './AuthSplitLayout';
import {
  AUTH_BACK_LINK_CLASS,
  AUTH_SUBTITLE_CLASS,
  AUTH_TITLE_CLASS,
} from './authPageLayout';

const STEPS = [
  {
    title: 'Профиль в каталоге',
    text: 'Имя, описание, адрес, контакты и портфолио — клиенты находят вас в SLOTTY.',
  },
  {
    title: 'Услуги и цены',
    text: 'Прайс, длительность и акции — всё настраивается в кабинете без таблиц в чатах.',
  },
  {
    title: 'Расписание и записи',
    text: 'Свободные окна, заявки и напоминания — клиенты бронируют сами, вы подтверждаете в один клик.',
  },
  {
    title: 'Доверие и рост',
    text: 'Сертификаты, отзывы и аналитика — видно, что работает, и проще набирать постоянных клиентов.',
  },
] as const;

const primaryBtnClass =
  'flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-[#E29595] px-5 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition hover:opacity-95 active:scale-[0.98] sm:text-[16px]';

const outlineBtnClass =
  'flex min-h-[3.25rem] w-full items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-5 text-[15px] font-semibold text-[#111827] transition hover:border-[#D1D5DB] hover:bg-[#FAFAFA] active:scale-[0.98] sm:text-[16px]';

export function MasterStartPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const isMasterUser = useIsMasterUser();

  const registerHref = useMemo(() => getMasterRegisterPath(BECOME_MASTER_PATH), []);
  const loginHref = useMemo(() => getMasterLoginPath(BECOME_MASTER_PATH), []);

  if (isLoading) {
    return <LoadingScreen className="bg-white" />;
  }

  if (isAuthenticated) {
    return <Navigate to={isMasterUser ? ADMIN_PATH : BECOME_MASTER_PATH} replace />;
  }

  return (
    <AuthSplitLayout>
      <Link to={HUB_PATH} className={AUTH_BACK_LINK_CLASS}>
        ← На главную
      </Link>

      <h1 className={`mt-6 lg:mt-0 ${AUTH_TITLE_CLASS}`}>Станьте мастером в SLOTTY</h1>
      <p className={AUTH_SUBTITLE_CLASS}>
        SLOTTY — сервис онлайн-записи для мастеров красоты, барберов, бровистов и других специалистов. Вы
        принимаете клиентов, мы помогаем с каталогом, расписанием и заявками.
      </p>

      <ol className="mt-8 space-y-5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FCE8E8] text-[14px] font-bold tabular-nums text-[#E29595]"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[15px] font-semibold leading-snug text-[#111827]">{step.title}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280]">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-[14px] leading-relaxed text-[#6B7280]">
        Сначала создайте аккаунт — затем заполните анкету мастера и откройте запись для клиентов. Это займёт
        несколько минут.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
        <Link to={registerHref} className={`${primaryBtnClass} no-underline`}>
          Зарегистрироваться
        </Link>
        <Link to={loginHref} className={`${outlineBtnClass} no-underline`}>
          Уже есть аккаунт
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
