import { useCallback, useEffect, useState } from 'react';
import { HiCheckCircle, HiChatBubbleLeftRight, HiClock, HiSparkles, HiXCircle } from 'react-icons/hi2';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import {
  fetchSponsorRequestCabinetState,
  postSponsorRequest,
  type SponsorRequestDto,
} from '../../../features/sponsors/api/sponsorRequestApi';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import {
  settingsOutlineBtn,
  settingsPanel,
  settingsPrimaryBtn,
  settingsSectionLabel,
} from './adminSettingsTheme';

const fieldClass =
  'mt-1.5 w-full rounded-[14px] border border-[#EAECEF] bg-white px-3.5 py-3 text-[15px] text-[#111827] outline-none transition focus:border-[#ff5f7a]/50 focus:ring-2 focus:ring-[#ff5f7a]/15';

function labelClass(required?: boolean) {
  return `text-[13px] font-semibold text-[#374151]${required ? '' : ''}`;
}

function sponsorStatusMeta(status: SponsorRequestDto['status']) {
  if (status === 'in_review') {
    return {
      label: 'В работе',
      hint: 'Команда SLOTTY уже рассматривает ваше предложение',
      progress: 2,
    };
  }
  return {
    label: 'На рассмотрении',
    hint: 'Заявка в очереди — ответим по указанным контактам',
    progress: 1,
  };
}

function SponsorRequestStatusCard({ request }: { request: SponsorRequestDto }) {
  const meta = sponsorStatusMeta(request.status);
  const progress = meta.progress;
  const sentAt = new Date(request.createdAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const steps = [
    { id: 1, title: 'Заявка получена' },
    { id: 2, title: 'На рассмотрении' },
    { id: 3, title: 'Свяжемся с вами' },
  ];

  return (
    <article className="relative overflow-hidden rounded-[22px] bg-white p-5 shadow-[0_14px_40px_rgba(255,95,122,0.12)] ring-1 ring-[#FFE1E8] sm:p-6">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ff5f7a]/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 left-4 h-24 w-24 rounded-full bg-[#ff9aad]/15 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff5f7a] to-[#ff8aa0] text-white shadow-[0_10px_24px_rgba(255,95,122,0.35)]">
          {progress >= 2 ? (
            <HiSparkles className="h-6 w-6" aria-hidden />
          ) : (
            <HiClock className="h-6 w-6" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F4] px-3 py-1 text-[12px] font-bold text-[#F47C8C] ring-1 ring-[#FDE8ED]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5f7a]" aria-hidden />
              {meta.label}
            </span>
          </div>
          <h3 className="mt-2 text-[18px] font-bold tracking-[-0.03em] text-[#111827]">
            Заявка уже у команды SLOTTY
          </h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#6B7280]">{meta.hint}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#9CA3AF]">
            Повторную заявку можно отправить после ответа — мы напишем или позвоним по контактам ниже.
          </p>
        </div>
      </div>

      <ol className="relative mt-5 grid gap-2 sm:grid-cols-3" aria-label="Этапы обработки">
        {steps.map((step) => {
          const done = step.id <= progress;
          const current = step.id === progress + 1;
          return (
            <li
              key={step.id}
              className={`rounded-[14px] px-3 py-2.5 text-center text-[12px] font-semibold leading-snug transition ${
                current
                  ? 'bg-gradient-to-r from-[#FFF1F4] to-[#FFE8EE] text-[#F47C8C] ring-1 ring-[#FDE8ED]'
                  : done
                    ? 'bg-[#f6f7fb] text-[#6B7280]'
                    : 'bg-[#FAFAFA] text-[#9CA3AF]'
              }`}
            >
              <span className="mr-1 tabular-nums">{step.id}.</span>
              {step.id === 2 && request.status === 'in_review' ? 'В работе' : step.title}
            </li>
          );
        })}
      </ol>

      <div className="relative mt-4 overflow-hidden rounded-[16px] bg-[#f6f7fb] p-4 ring-1 ring-[#EAECEF]/80">
        <p className={settingsSectionLabel}>Ваши контакты в заявке</p>
        <dl className="mt-3 space-y-2.5 text-[14px]">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt className="font-semibold text-[#6B7280]">Имя</dt>
            <dd className="font-semibold text-[#111827]">{request.contactName}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <dt className="font-semibold text-[#6B7280]">Телефон</dt>
            <dd className="font-semibold text-[#111827]">{request.phone}</dd>
          </div>
          {request.email ? (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              <dt className="font-semibold text-[#6B7280]">Email</dt>
              <dd className="break-all font-semibold text-[#111827]">{request.email}</dd>
            </div>
          ) : null}
          {request.companyName ? (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              <dt className="font-semibold text-[#6B7280]">Компания</dt>
              <dd className="font-semibold text-[#111827]">{request.companyName}</dd>
            </div>
          ) : null}
          {request.city ? (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              <dt className="font-semibold text-[#6B7280]">Город</dt>
              <dd className="font-semibold text-[#111827]">{request.city}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-[#6B7280]">{request.message}</p>
      </div>

      <p className="relative mt-4 text-[12px] font-medium text-[#9CA3AF]">
        Отправлено {sentAt}
      </p>
    </article>
  );
}

function SponsorRequestResolvedCard({
  request,
  onNewRequest,
}: {
  request: SponsorRequestDto;
  onNewRequest: () => void;
}) {
  const isClosed = request.status === 'closed';
  const reviewedAt = request.reviewedAt
    ? new Date(request.reviewedAt).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <article className="relative overflow-hidden rounded-[22px] bg-white p-5 shadow-[0_14px_40px_rgba(255,95,122,0.1)] ring-1 ring-[#FFE1E8] sm:p-6">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ff5f7a]/8 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_rgba(255,95,122,0.25)] ${
            isClosed
              ? 'bg-gradient-to-br from-[#ff5f7a] to-[#ff8aa0]'
              : 'bg-gradient-to-br from-[#94a3b8] to-[#64748b]'
          }`}
        >
          {isClosed ? (
            <HiChatBubbleLeftRight className="h-6 w-6" aria-hidden />
          ) : (
            <HiXCircle className="h-6 w-6" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[12px] font-bold ring-1 ${
              isClosed
                ? 'bg-[#FFF1F4] text-[#F47C8C] ring-[#FDE8ED]'
                : 'bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]'
            }`}
          >
            {isClosed ? 'Заявка обработана' : 'Заявка отклонена'}
          </span>
          <h3 className="mt-2 text-[18px] font-bold tracking-[-0.03em] text-[#111827]">
            {isClosed ? 'Ответ команды SLOTTY' : 'Решение по вашей заявке'}
          </h3>
          {reviewedAt ? (
            <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">Обновлено {reviewedAt}</p>
          ) : null}
        </div>
      </div>

      <div className="relative mt-5 rounded-[16px] bg-gradient-to-br from-[#FFF8F9] to-[#FFF1F4] p-4 ring-1 ring-[#FDE8ED]">
        <p className={settingsSectionLabel}>Сообщение от команды</p>
        <p className="mt-2 whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-[#374151]">
          {request.adminComment?.trim() ||
            (isClosed
              ? 'Заявка закрыта. Если остались вопросы — напишите в поддержку или отправьте новую заявку.'
              : 'К сожалению, сейчас мы не можем рассмотреть это предложение.')}
        </p>
      </div>

      <p className="relative mt-4 text-[14px] leading-relaxed text-[#6B7280]">
        {isClosed
          ? 'Если хотите предложить другое сотрудничество — отправьте новую заявку.'
          : 'Можете уточнить предложение и отправить заявку снова.'}
      </p>

      <button type="button" className={`${settingsPrimaryBtn} relative mt-5`} onClick={onNewRequest}>
        Отправить новую заявку
      </button>
    </article>
  );
}

function SponsorRequestJustSentCard() {
  return (
    <article className="relative overflow-hidden rounded-[22px] bg-white p-5 shadow-[0_14px_40px_rgba(255,95,122,0.12)] ring-1 ring-[#FFE1E8] sm:p-6">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#ff5f7a]/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#34d399] to-[#10b981] text-white shadow-[0_10px_24px_rgba(16,185,129,0.3)]">
          <HiCheckCircle className="h-7 w-7" aria-hidden />
        </div>
        <div>
          <h3 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827]">Заявка отправлена</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#6B7280]">
            Спасибо! Команда SLOTTY получила ваши контакты и скоро ответит.
          </p>
        </div>
      </div>
    </article>
  );
}

export function SettingsSponsorSection() {
  const { profile } = useAuth();
  const { draft } = useAdminMasterCabinet();
  const hasApi = Boolean(getApiBaseUrl());

  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeRequest, setActiveRequest] = useState<SponsorRequestDto | null>(null);
  const [resolvedRequest, setResolvedRequest] = useState<SponsorRequestDto | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [loadingActive, setLoadingActive] = useState(hasApi);

  useEffect(() => {
    const name = draft.name?.trim() || profile?.full_name?.trim() || '';
    setContactName(name);
    setPhone(draft.phone?.trim() || '');
    setEmail(profile?.account_email?.trim() || '');
  }, [draft.name, draft.phone, profile?.account_email, profile?.full_name]);

  const loadState = useCallback(async () => {
    if (!hasApi) {
      setLoadingActive(false);
      return;
    }
    setLoadingActive(true);
    try {
      const res = await fetchSponsorRequestCabinetState();
      setActiveRequest(res.activeRequest);
      setResolvedRequest(res.lastResolvedRequest);
      if (res.activeRequest) setShowNewForm(false);
    } catch {
      setActiveRequest(null);
      setResolvedRequest(null);
    } finally {
      setLoadingActive(false);
    }
  }, [hasApi]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!contactName.trim()) errs.contactName = 'Укажите имя или название';
    if (!phone.trim()) errs.phone = 'Укажите телефон';
    if (!message.trim() || message.trim().length < 10) {
      errs.message = 'Расскажите о сотрудничестве — не короче 10 символов';
    }
    if (email.trim() && !email.includes('@')) errs.email = 'Некорректный email';
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    if (!hasApi) {
      setFieldErrors({ submit: 'Сервер недоступен. Попробуйте позже.' });
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    try {
      const request = await postSponsorRequest({
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        companyName: companyName.trim() || null,
        city: city.trim() || null,
        message: message.trim(),
      });
      setActiveRequest(request);
      setResolvedRequest(null);
      setShowNewForm(false);
      setSuccess(true);
    } catch (e) {
      setFieldErrors({
        submit: e instanceof Error ? e.message : 'Не удалось отправить заявку',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={settingsPanel}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#F47C8C] shadow-[0_6px_20px_rgba(244,124,140,0.16)]">
          <HiSparkles className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111827]">Стать спонсором SLOTTY</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-[#6B7280]">
            Предложите партнёрство, спонсорство или совместный проект. Заявка уйдёт команде платформы —
            мы свяжемся с вами.
          </p>
        </div>
      </div>

      {loadingActive ? (
        <div
          className="animate-pulse space-y-3 rounded-[22px] bg-[#FAFAFA] p-5 ring-1 ring-[#EAECEF]"
          aria-busy
          aria-label="Загрузка статуса заявки"
        >
          <div className="h-12 w-12 rounded-2xl bg-[#FFE8EE]" />
          <div className="h-5 w-2/3 max-w-xs rounded-lg bg-[#EEEEEE]" />
          <div className="h-4 w-full rounded-lg bg-[#F3F4F6]" />
          <div className="h-20 rounded-[16px] bg-[#F3F4F6]" />
        </div>
      ) : activeRequest ? (
        <SponsorRequestStatusCard request={activeRequest} />
      ) : resolvedRequest && !showNewForm ? (
        <SponsorRequestResolvedCard
          request={resolvedRequest}
          onNewRequest={() => {
            setShowNewForm(true);
            setSuccess(false);
          }}
        />
      ) : success ? (
        <SponsorRequestJustSentCard />
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <p className={settingsSectionLabel}>Контакты</p>

          <div>
            <label className={labelClass(true)} htmlFor="sponsor-contact-name">
              Имя или название <span className="text-[#F47C8C]">*</span>
            </label>
            <input
              id="sponsor-contact-name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className={fieldClass}
              autoComplete="name"
              maxLength={120}
            />
            {fieldErrors.contactName ? (
              <p className="mt-1 text-[12px] font-medium text-[#DC2626]">{fieldErrors.contactName}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass(true)} htmlFor="sponsor-phone">
              Телефон <span className="text-[#F47C8C]">*</span>
            </label>
            <input
              id="sponsor-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
              placeholder="+375 29 123 45 67"
              autoComplete="tel"
              maxLength={40}
            />
            {fieldErrors.phone ? (
              <p className="mt-1 text-[12px] font-medium text-[#DC2626]">{fieldErrors.phone}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass()} htmlFor="sponsor-email">
              Email
            </label>
            <input
              id="sponsor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              autoComplete="email"
              maxLength={200}
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-[12px] font-medium text-[#DC2626]">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass()} htmlFor="sponsor-company">
                Компания / бренд
              </label>
              <input
                id="sponsor-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={fieldClass}
                maxLength={200}
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="sponsor-city">
                Город
              </label>
              <input
                id="sponsor-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={fieldClass}
                maxLength={120}
              />
            </div>
          </div>

          <div>
            <label className={labelClass(true)} htmlFor="sponsor-message">
              О сотрудничестве <span className="text-[#F47C8C]">*</span>
            </label>
            <textarea
              id="sponsor-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`${fieldClass} min-h-[120px] resize-y`}
              placeholder="Кратко: формат партнёрства, аудитория, что вы предлагаете SLOTTY…"
              maxLength={4000}
            />
            {fieldErrors.message ? (
              <p className="mt-1 text-[12px] font-medium text-[#DC2626]">{fieldErrors.message}</p>
            ) : null}
          </div>

          {fieldErrors.submit ? (
            <p className="text-[13px] font-medium text-[#DC2626]">{fieldErrors.submit}</p>
          ) : null}

          <button type="submit" disabled={submitting} className={settingsPrimaryBtn}>
            {submitting ? 'Отправка…' : 'Отправить заявку'}
          </button>
        </form>
      )}

      {!activeRequest && !loadingActive && (showNewForm || !resolvedRequest) ? (
        <button type="button" className={settingsOutlineBtn} onClick={() => void loadState()}>
          Обновить статус заявки
        </button>
      ) : null}
    </section>
  );
}
