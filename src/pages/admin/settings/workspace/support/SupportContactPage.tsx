import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { COMPONENT_TO_AFFECTED_SERVICE } from '../../../../../features/systemStatus/systemStatusApi';
import {
  MASTER_SETTINGS_SUPPORT_PATH,
  MASTER_SETTINGS_SUPPORT_TICKETS_PATH,
} from '../../../../../app/paths';
import { SettingsHeader } from '../SettingsHeader';
import {
  SettingsCabinetFeatureCard,
  SettingsCabinetSelect,
  settingsCabinetFieldClass,
  settingsCabinetLabelClass,
  settingsCabinetOutlineBtn,
  settingsCabinetPrimaryBtn,
  settingsCabinetStack,
} from '../settingsCabinetUi';
import { SupportIconContact } from './supportIcons';
import {
  SUPPORT_AFFECTED_SERVICE_OPTIONS,
  SUPPORT_CATEGORY_OPTIONS,
  SUPPORT_DRAFT_STORAGE_KEY,
  SUPPORT_MESSAGE_MAX,
  SUPPORT_SEVERITY_OPTIONS,
} from './supportConstants';
import {
  buildSupportClientMetadata,
  createSupportTicket,
  fetchSupportAccountContext,
  isSupportApiAvailable,
  type SupportAccountContext,
} from './supportApi';

type Draft = {
  category: string;
  severity: string;
  subject: string;
  affectedService: string;
  message: string;
  contactEmail: string;
  consentAccepted: boolean;
};

const emptyDraft = (): Draft => ({
  category: 'other',
  severity: 'medium',
  subject: '',
  affectedService: 'web_cabinet',
  message: '',
  contactEmail: '',
  consentAccepted: false,
});

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(SUPPORT_DRAFT_STORAGE_KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as Partial<Draft> & { affectedServices?: string[] };
    const legacyService =
      Array.isArray(parsed.affectedServices) && parsed.affectedServices[0]
        ? parsed.affectedServices[0]
        : emptyDraft().affectedService;
    return {
      ...emptyDraft(),
      ...parsed,
      affectedService: parsed.affectedService ?? legacyService,
    };
  } catch {
    return emptyDraft();
  }
}

function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(SUPPORT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(SUPPORT_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function preferredChannel(account: SupportAccountContext | null): 'email' | 'telegram' | 'in_app' {
  if (account?.telegramLinked) return 'telegram';
  return 'email';
}

export function SupportContactPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apiReady = isSupportApiAvailable();
  const componentKey = searchParams.get('component')?.trim() ?? '';

  const initialDraft = (): Draft => {
    const base = loadDraft();
    if (!componentKey) return base;
    const svc = COMPONENT_TO_AFFECTED_SERVICE[componentKey];
    return {
      ...base,
      category: 'ui_bug',
      subject: base.subject || `Проблема: ${componentKey}`,
      affectedService: svc ?? base.affectedService,
    };
  };

  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [account, setAccount] = useState<SupportAccountContext | null>(null);
  const [loading, setLoading] = useState(apiReady);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<{ ticketCode: string; channel: string } | null>(null);

  const dirty = useMemo(() => {
    const e = emptyDraft();
    return JSON.stringify(draft) !== JSON.stringify(e);
  }, [draft]);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  useEffect(() => {
    if (!apiReady) {
      setLoading(false);
      return;
    }
    fetchSupportAccountContext()
      .then((ctx) => {
        setAccount(ctx);
        setDraft((d) => ({
          ...d,
          contactEmail: d.contactEmail || ctx.email || '',
        }));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [apiReady]);

  useEffect(() => {
    if (!dirty || success || submitting) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, success, submitting]);

  const update = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setFieldErrors((e) => {
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!draft.subject.trim() || draft.subject.trim().length < 3) errs.subject = 'Укажите тему (минимум 3 символа)';
    if (!draft.message.trim() || draft.message.trim().length < 10) errs.message = 'Сообщение — минимум 10 символов';
    if (draft.message.length > SUPPORT_MESSAGE_MAX) errs.message = `Не более ${SUPPORT_MESSAGE_MAX} символов`;
    if (!draft.affectedService) errs.affectedService = 'Выберите сервис';
    if (!draft.consentAccepted) errs.consentAccepted = 'Необходимо согласие';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiReady) return;
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    const channel = preferredChannel(account);
    try {
      const ticket = await createSupportTicket({
        category: draft.category,
        severity: draft.severity,
        subject: draft.subject.trim(),
        affectedServices: [draft.affectedService],
        relatedBookingCode: null,
        relatedPaymentId: null,
        message: draft.message.trim(),
        preferredContactChannel: channel,
        contactEmail: draft.contactEmail.trim() || null,
        consentAccepted: true,
        clientMetadata: buildSupportClientMetadata(),
      });
      clearDraft();
      setSuccess({
        ticketCode: ticket.ticketCode,
        channel: channel === 'telegram' ? 'Telegram' : channel === 'in_app' ? 'в кабинете' : 'email',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить');
    } finally {
      setSubmitting(false);
    }
  };

  const accountHint =
    account && !loading
      ? `Ответ на ${account.email || 'email'} · ${account.masterProfileName} · ${account.plan}`
      : 'Данные аккаунта подставятся автоматически';

  if (success) {
    return (
      <>
        <SettingsHeader
          title="Обращение отправлено"
          description="Мы получили ваш запрос и свяжемся с вами."
          breadcrumb="Поддержка / Обращение"
        />
        <SettingsCabinetFeatureCard
          icon={<SupportIconContact />}
          title="Обращение создано"
          subtitle={`Ответ придёт на ${success.channel}`}
          accent
        >
          <p className="font-mono text-[20px] font-bold text-[#ff5f7a]">{success.ticketCode}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link to={MASTER_SETTINGS_SUPPORT_TICKETS_PATH} className={settingsCabinetPrimaryBtn}>
              Открыть мои обращения
            </Link>
            <Link to={MASTER_SETTINGS_SUPPORT_PATH} className={settingsCabinetOutlineBtn}>
              Вернуться в поддержку
            </Link>
          </div>
        </SettingsCabinetFeatureCard>
      </>
    );
  }

  if (!apiReady) {
    return (
      <>
        <SettingsHeader
          title="Связаться с поддержкой"
          description="Отправка обращений доступна при подключённом backend."
          breadcrumb="Поддержка / Обращение"
        />
        <SettingsCabinetFeatureCard
          icon={<SupportIconContact />}
          title="Backend не подключён"
          subtitle="Настройте VITE_API_URL для отправки обращений"
        >
          <Link to={MASTER_SETTINGS_SUPPORT_PATH} className={settingsCabinetOutlineBtn}>
            Назад
          </Link>
        </SettingsCabinetFeatureCard>
      </>
    );
  }

  return (
    <>
      <SettingsHeader
        title="Связаться с поддержкой"
        description="Опишите проблему — мы приложим данные аккаунта без паролей и токенов."
        breadcrumb="Поддержка / Обращение"
        actions={
          <button type="button" className={settingsCabinetOutlineBtn} onClick={() => navigate(MASTER_SETTINGS_SUPPORT_PATH)}>
            Назад
          </button>
        }
      />

      <form onSubmit={onSubmit} className={`${settingsCabinetStack} pb-24 lg:pb-8`}>
        <SettingsCabinetFeatureCard
          icon={<SupportIconContact />}
          title="Новое обращение"
          subtitle={loading ? 'Загрузка…' : accountHint}
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <SettingsCabinetSelect
                label="В чём проблема?"
                value={draft.category}
                onChange={(v) => update('category', v)}
                options={SUPPORT_CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
              <SettingsCabinetSelect
                label="Срочность"
                value={draft.severity}
                onChange={(v) => update('severity', v)}
                options={SUPPORT_SEVERITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </div>

            <label className="block">
              <span className={settingsCabinetLabelClass}>Тема</span>
              <input
                className={settingsCabinetFieldClass}
                value={draft.subject}
                onChange={(e) => update('subject', e.target.value)}
                placeholder="Кратко, в чём суть"
                maxLength={200}
              />
              {fieldErrors.subject ? <p className="mt-1 text-[12px] text-[#DC2626]">{fieldErrors.subject}</p> : null}
            </label>

            <SettingsCabinetSelect
              label="Какой сервис затронут?"
              value={draft.affectedService}
              onChange={(v) => update('affectedService', v)}
              options={SUPPORT_AFFECTED_SERVICE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            {fieldErrors.affectedService ? (
              <p className="-mt-2 text-[12px] text-[#DC2626]">{fieldErrors.affectedService}</p>
            ) : null}

            <label className="block">
              <span className={settingsCabinetLabelClass}>Сообщение</span>
              <textarea
                className={`${settingsCabinetFieldClass} min-h-[160px] resize-y`}
                value={draft.message}
                onChange={(e) => update('message', e.target.value)}
                placeholder="Что произошло, что вы делали и что ожидали увидеть."
                maxLength={SUPPORT_MESSAGE_MAX}
              />
              <p className="mt-1 text-[12px] text-[#9CA3AF]">
                {draft.message.length} / {SUPPORT_MESSAGE_MAX}
              </p>
              {fieldErrors.message ? <p className="mt-1 text-[12px] text-[#DC2626]">{fieldErrors.message}</p> : null}
            </label>

            <label className="block">
              <span className={settingsCabinetLabelClass}>Email для ответа</span>
              <input
                className={settingsCabinetFieldClass}
                type="email"
                value={draft.contactEmail}
                onChange={(e) => update('contactEmail', e.target.value)}
                placeholder="email@example.com"
                autoComplete="email"
              />
            </label>
          </div>
        </SettingsCabinetFeatureCard>

        <p className="rounded-[12px] bg-[#F6F7FB] px-4 py-3 text-[13px] leading-relaxed text-[#6B7280]">
          Вложения скоро будут доступны. Пока приложите скриншот в ответном письме или опишите проблему подробно в
          тексте обращения.
        </p>

        <label className="flex items-start gap-3 rounded-[16px] bg-white p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-[#D1D5DB] text-[#ff5f7a] focus:ring-[#ff5f7a]/30"
            checked={draft.consentAccepted}
            onChange={(e) => update('consentAccepted', e.target.checked)}
          />
          <span className="text-[13px] leading-snug text-[#6B7280]">
            Я понимаю, что поддержка может использовать данные моего аккаунта и обращения для решения проблемы.
          </span>
        </label>
        {fieldErrors.consentAccepted ? (
          <p className="-mt-3 text-[12px] text-[#DC2626]">{fieldErrors.consentAccepted}</p>
        ) : null}

        {error ? (
          <div className="rounded-[12px] bg-[#FEF2F2] px-4 py-3 text-[14px] text-[#DC2626]" role="alert">
            {error}
            <button type="button" className="ml-3 font-semibold underline" onClick={() => setError(null)}>
              Закрыть
            </button>
          </div>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 z-20 bg-white/95 p-4 shadow-[0_-8px_24px_rgba(17,24,39,0.06)] backdrop-blur-sm lg:static lg:bg-transparent lg:p-0 lg:shadow-none">
          <button type="submit" className={`${settingsCabinetPrimaryBtn} w-full sm:w-auto`} disabled={submitting || loading}>
            {submitting ? 'Отправка…' : 'Отправить обращение'}
          </button>
        </div>
      </form>
    </>
  );
}
