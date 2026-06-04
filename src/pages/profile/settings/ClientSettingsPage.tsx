import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { HiOutlineEnvelope } from 'react-icons/hi2';
import { LEGAL_DOCUMENTS } from '../../../constants/legalDocuments';
import {
  SUPPORT_EMAIL,
  SUPPORT_TELEGRAM,
  isPlaceholderContact,
  supportTelegramUrl,
} from '../../../constants/support';
import {
  PROFILE_SETTINGS_DOCUMENTS_PATH,
  PROFILE_SETTINGS_LOGIN_METHODS_PATH,
  PROFILE_SETTINGS_PATH,
  getProfileSettingsDocumentPath,
} from '../../../app/paths';
import { LoginMethodsPanel } from '../../../features/auth/components/LoginMethodsPanel';
import { useAuth } from '../../../features/auth/AuthProvider';
import { TelegramBrandIcon } from '../../../pages/admin/settings/workspace/integrationBrandIcons';
import { ClientSettingsLayout } from './ClientSettingsLayout';
import { SettingsListCard, SettingsListRow, SettingsRowButton } from './ClientSettingsListRow';
import {
  settingsCardClass,
  settingsDocSidebarLinkActiveClass,
  settingsDocSidebarLinkClass,
  settingsLayoutGridClass,
} from './clientSettingsTheme';

function TelegramIcon() {
  return <TelegramBrandIcon size={20} />;
}

function ClientSettingsLoginMethodsSection() {
  const navigate = useNavigate();
  const { isAuthenticated, backendConfigured } = useAuth();

  if (!backendConfigured) {
    return <p className="text-[14px] leading-relaxed text-[#6B7280]">Подключите API в .env, чтобы настроить вход.</p>;
  }

  return isAuthenticated ? (
    <LoginMethodsPanel
      mode="settings"
      appearance="okx"
      onLinked={() => void navigate(PROFILE_SETTINGS_LOGIN_METHODS_PATH)}
    />
  ) : (
    <LoginMethodsPanel
      mode="login"
      appearance="page"
      onLinked={() => void navigate(PROFILE_SETTINGS_LOGIN_METHODS_PATH)}
    />
  );
}

function ClientSettingsSupportSection() {
  const tgUrl = supportTelegramUrl(SUPPORT_TELEGRAM);
  const emailReady = !isPlaceholderContact(SUPPORT_EMAIL) && SUPPORT_EMAIL.includes('@');

  return (
    <SettingsListCard title="Поддержка">
      <SettingsListRow
        icon={<TelegramIcon />}
        title="Telegram"
        subtitle={SUPPORT_TELEGRAM}
        action={
          tgUrl ? (
            <SettingsRowButton href={tgUrl} external>
              Написать
            </SettingsRowButton>
          ) : undefined
        }
      />
      <SettingsListRow
        icon={<HiOutlineEnvelope className="h-5 w-5" />}
        title="Email"
        subtitle={SUPPORT_EMAIL}
        action={
          emailReady ? (
            <SettingsRowButton href={`mailto:${SUPPORT_EMAIL}`}>
              Написать
            </SettingsRowButton>
          ) : undefined
        }
      />
    </SettingsListCard>
  );
}

function ClientSettingsDocumentsSection() {
  const first = LEGAL_DOCUMENTS[0];
  if (!first) return null;
  return <Navigate to={getProfileSettingsDocumentPath(first.id)} replace />;
}

function ClientSettingsLegalDocSection() {
  const { docId } = useParams<{ docId: string }>();
  const doc = LEGAL_DOCUMENTS.find((d) => d.id === docId);

  if (!doc) {
    return <Navigate to={PROFILE_SETTINGS_DOCUMENTS_PATH} replace />;
  }

  const blocks = doc.body.split(/\n\n+/).filter(Boolean);

  return (
    <div className={settingsLayoutGridClass}>
      <nav className="flex shrink-0 flex-col gap-0.5 lg:w-[220px] xl:w-[240px]" aria-label="Документы">
        {LEGAL_DOCUMENTS.map((item) => {
          const active = item.id === doc.id;
          return (
            <Link
              key={item.id}
              to={getProfileSettingsDocumentPath(item.id)}
              className={active ? settingsDocSidebarLinkActiveClass : settingsDocSidebarLinkClass}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      <article className={`min-w-0 flex-1 ${settingsCardClass} p-5 lg:p-6`}>
        <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827]">{doc.title}</h2>
        <p className="mt-2 text-[13px] font-medium text-[#9CA3AF]">{doc.updatedLabel}</p>
        <div className="mt-6 space-y-4 text-[15px] leading-[1.65] text-[#374151]">
          {blocks.map((block, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {block}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}

export function ClientSettingsPage() {
  return (
    <Routes>
      <Route element={<ClientSettingsLayout />}>
        <Route index element={<Navigate to="login-methods" replace />} />
        <Route path="login-methods" element={<ClientSettingsLoginMethodsSection />} />
        <Route path="support" element={<ClientSettingsSupportSection />} />
        <Route path="documents" element={<ClientSettingsDocumentsSection />} />
        <Route path="documents/:docId" element={<ClientSettingsLegalDocSection />} />
      </Route>
      <Route path="*" element={<Navigate to={PROFILE_SETTINGS_PATH} replace />} />
    </Routes>
  );
}
