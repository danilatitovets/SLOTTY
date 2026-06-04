import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { fetchAuthIdentities } from '../../../../../features/auth/api/authApi';
import type { BackendProfile } from '../../../../../features/auth/types';
import {
  fetchMasterAppointments,
  fetchMasterCabinet,
  type MasterCabinetDto,
} from '../../../../../features/admin/api/masterCabinetApi';
import {
  getBillingSubscription,
  listBillingPayments,
  type BillingPaymentDto,
  type BillingSubscriptionResponse,
} from '../../../../../features/billing/api/masterBillingApi';
import { fetchMasterNotificationPreferences } from '../../../../../features/notifications/api/masterNotificationPreferencesApi';
import { fetchSupportTickets } from '../support/supportApi';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

const PUBLICATION_LABELS: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  hidden: 'Скрыт',
};

const APPOINTMENT_STATUS: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждена',
  completed: 'Завершена',
  cancelled_by_client: 'Отменена клиентом',
  cancelled_by_master: 'Отменена мастером',
  cancelled_by_admin: 'Отменена администратором',
  no_show: 'Неявка',
  expired: 'Истекла',
  in_progress: 'В процессе',
  client_arrived: 'Клиент прибыл',
  master_marked_completed: 'Завершена мастером',
  client_confirmed_completed: 'Подтверждена клиентом',
};

function line(label: string, value: string | null | undefined): Paragraph {
  const v = value?.trim() ? value.trim() : '—';
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun(v),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true })],
  });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU');
}

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function visitTypeLabel(v: string | null | undefined): string {
  if (v === 'salon') return 'В салоне';
  if (v === 'home') return 'На дому';
  if (v === 'online') return 'Онлайн';
  return v?.trim() || '—';
}

function buildAccountSection(profile: BackendProfile, identities: Awaited<ReturnType<typeof fetchAuthIdentities>>) {
  const rows: Paragraph[] = [
    sectionHeading('Аккаунт'),
    line('ID профиля', profile.id),
    line('Имя', profile.full_name),
    line('Email', profile.account_email),
    line('Телефон', profile.phone),
    line('Telegram', profile.telegram_username ? `@${profile.telegram_username}` : null),
    line('Роль', profile.role),
    line('Статус аккаунта', profile.account_status ?? 'active'),
  ];
  if (profile.privacy_consent_accepted_at) {
    rows.push(line('Согласие на обработку данных', formatDateTime(profile.privacy_consent_accepted_at)));
  }
  if (profile.terms_accepted_at) {
    rows.push(line('Пользовательское соглашение', formatDateTime(profile.terms_accepted_at)));
  }
  for (const id of identities) {
    const label =
      id.provider === 'telegram' ? 'Telegram' : id.provider === 'google' ? 'Google' : 'Email';
    rows.push(
      line(
        `Вход: ${label}`,
        [id.email, id.linkedAt ? formatDateTime(id.linkedAt) : null].filter(Boolean).join(' · ') || 'привязан',
      ),
    );
  }
  return rows;
}

function buildCabinetSection(cabinet: MasterCabinetDto) {
  const p = cabinet.profile;
  const loc = cabinet.primaryLocation;
  const rows: Paragraph[] = [
    sectionHeading('Кабинет мастера'),
    line('Отображаемое имя', p.displayName),
    line('Ссылка', p.slug ? `slotty.by/m/${p.slug}` : null),
    line('Категория', cabinet.primaryCategory?.name ?? null),
    line('Статус публикации', PUBLICATION_LABELS[p.publicationStatus] ?? p.publicationStatus),
    line('Телефон в профиле', p.phone),
    line('Контакт', p.contact),
    line('Рейтинг', `${p.rating} (${p.reviewsCount} отзывов)`),
    line('Буфер между записями', `${p.globalBufferMinutes} мин`),
  ];
  if (p.bio?.trim()) {
    rows.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: 'О себе: ', bold: true }), new TextRun(p.bio.trim())],
      }),
    );
  }
  if (loc) {
    rows.push(sectionHeading('Адрес и формат работы'));
    rows.push(line('Формат', visitTypeLabel(loc.visitType)));
    rows.push(line('Город', loc.city));
    rows.push(line('Адрес', loc.publicAddress || [loc.street, loc.building].filter(Boolean).join(', ')));
    if (loc.salonName) rows.push(line('Салон', loc.salonName));
    if (loc.directions) rows.push(line('Как добраться', loc.directions));
  }
  if (cabinet.scheduleRules.length > 0) {
    rows.push(sectionHeading('Расписание'));
    for (const r of cabinet.scheduleRules.filter((x) => x.isActive)) {
      rows.push(
        line(
          WEEKDAYS[r.weekday] ?? `День ${r.weekday}`,
          `${r.startTime} — ${r.endTime}`,
        ),
      );
    }
  }
  if (cabinet.bookingRules) {
    rows.push(sectionHeading('Правила записи'));
    if (cabinet.bookingRules.bookingRules) {
      rows.push(line('Правила', cabinet.bookingRules.bookingRules));
    }
    if (cabinet.bookingRules.cancellationPolicy) {
      rows.push(line('Отмена', cabinet.bookingRules.cancellationPolicy));
    }
    if (cabinet.bookingRules.paymentNote) {
      rows.push(line('Оплата', cabinet.bookingRules.paymentNote));
    }
    if (cabinet.bookingRules.paymentMethods?.length) {
      rows.push(line('Способы оплаты', cabinet.bookingRules.paymentMethods.join(', ')));
    }
  }
  return rows;
}

function buildServicesSection(cabinet: MasterCabinetDto) {
  const rows: Paragraph[] = [sectionHeading(`Услуги (${cabinet.services.length})`)];
  if (cabinet.services.length === 0) {
    rows.push(line('Услуги', 'нет данных'));
    return rows;
  }
  for (const s of cabinet.services) {
    rows.push(
      line(
        s.title,
        `${s.price} BYN · ${s.durationMinutes} мин · ${s.isActive ? 'активна' : 'выключена'}`,
      ),
    );
    if (s.description?.trim()) {
      rows.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 360 },
          children: [new TextRun(s.description.trim())],
        }),
      );
    }
  }
  return rows;
}

function buildPortfolioSection(cabinet: MasterCabinetDto) {
  const rows: Paragraph[] = [];
  if (cabinet.certificates.length > 0) {
    rows.push(sectionHeading(`Сертификаты (${cabinet.certificates.length})`));
    for (const c of cabinet.certificates) {
      rows.push(line(c.title, [c.issuer, c.year].filter(Boolean).join(', ') || '—'));
    }
  }
  if (cabinet.portfolio.length > 0) {
    rows.push(sectionHeading(`Портфолио (${cabinet.portfolio.length})`));
    for (const item of cabinet.portfolio) {
      rows.push(line(item.title || 'Фото', item.imageUrl));
    }
  }
  if (cabinet.career.length > 0) {
    rows.push(sectionHeading(`Опыт (${cabinet.career.length})`));
    for (const c of cabinet.career) {
      const years = [c.startYear, c.endYear].filter((y) => y != null).join('–');
      rows.push(line(c.title, [c.place, years].filter(Boolean).join(' · ') || '—'));
    }
  }
  return rows;
}

function buildAppointmentsSection(
  appointments: Awaited<ReturnType<typeof fetchMasterAppointments>>['appointments'],
) {
  const rows: Paragraph[] = [sectionHeading(`Записи (${appointments.length})`)];
  if (appointments.length === 0) {
    rows.push(line('Записи', 'нет данных'));
    return rows;
  }
  for (const a of appointments.slice(0, 150)) {
    rows.push(
      line(
        `${formatDateTime(a.starts_at)} — ${a.client_name}`,
        `${a.service_title_snapshot} · ${APPOINTMENT_STATUS[a.status] ?? a.status} · ${a.price_snapshot} BYN`,
      ),
    );
    if (a.client_phone) rows.push(line('  Телефон клиента', a.client_phone));
    if (a.client_note?.trim()) rows.push(line('  Комментарий', a.client_note));
  }
  if (appointments.length > 150) {
    rows.push(line('Примечание', `Показаны последние 150 из ${appointments.length} записей`));
  }
  return rows;
}

function buildBillingSection(
  billing: BillingSubscriptionResponse | null,
  payments: BillingPaymentDto[],
) {
  const rows: Paragraph[] = [sectionHeading('Подписка и платежи')];
  if (!billing) {
    rows.push(line('Подписка', 'нет данных'));
  } else {
    const sub = billing.subscription;
    rows.push(line('Тариф', sub.plan.name));
    rows.push(line('Статус', billing.status));
    rows.push(line('Период', billing.billingPeriod === 'year' ? 'год' : 'месяц'));
    rows.push(line('Текущий период', `${formatDate(sub.currentPeriodStart)} — ${formatDate(sub.currentPeriodEnd)}`));
    if (billing.priceAmount > 0) {
      rows.push(line('Стоимость', formatMoney(billing.priceAmount, billing.currency)));
    }
    if (billing.cardLast4) {
      rows.push(line('Карта', `${billing.cardBrand ?? 'Карта'} •••• ${billing.cardLast4}`));
    }
  }
  rows.push(line('Платежей в отчёте', String(payments.length)));
  for (const p of payments.slice(0, 30)) {
    rows.push(
      line(
        formatDateTime(p.paidAt ?? p.createdAt),
        `${formatMoney(p.amount, p.currency)} · ${p.status}${p.invoiceNumber ? ` · ${p.invoiceNumber}` : ''}`,
      ),
    );
  }
  return rows;
}

function buildNotificationsSection(
  prefs: Awaited<ReturnType<typeof fetchMasterNotificationPreferences>> | null,
) {
  const rows: Paragraph[] = [sectionHeading('Уведомления')];
  if (!prefs) {
    rows.push(line('Настройки', 'нет данных'));
    return rows;
  }
  rows.push(
    line(
      'Каналы',
      [
        prefs.channels.telegram ? 'Telegram' : null,
        prefs.channels.email ? 'Email' : null,
        prefs.channels.in_app ? 'Кабинет' : null,
      ]
        .filter(Boolean)
        .join(', ') || '—',
    ),
  );
  const eventLabels: Record<string, string> = {
    new_booking: 'Новая запись',
    cancel: 'Отмена',
    reminder_1h: 'Напоминание за 1 ч',
    late: 'Опоздание',
    arrived: 'Клиент на месте',
    reviews: 'Отзывы',
    disputes: 'Споры',
    billing: 'Тариф и оплата',
    news: 'Новости SLOTTY',
  };
  for (const [key, label] of Object.entries(eventLabels)) {
    const ev = prefs.events[key as keyof typeof prefs.events];
    if (!ev) continue;
    const on = [ev.telegram && 'TG', ev.email && 'Email', ev.inApp && 'Кабинет'].filter(Boolean).join(', ');
    rows.push(line(label, on || 'выкл'));
  }
  return rows;
}

function buildSupportSection(tickets: Awaited<ReturnType<typeof fetchSupportTickets>>['tickets']) {
  const rows: Paragraph[] = [sectionHeading(`Обращения в поддержку (${tickets.length})`)];
  if (tickets.length === 0) {
    rows.push(line('Обращения', 'нет'));
    return rows;
  }
  for (const t of tickets.slice(0, 20)) {
    rows.push(
      line(
        t.ticketCode,
        `${t.subject} · ${t.status} · ${formatDateTime(t.createdAt)}`,
      ),
    );
  }
  return rows;
}

export async function downloadPersonalDataWordReport(profile: BackendProfile): Promise<void> {
  const [
    cabinet,
    identities,
    appointmentsResult,
    billingResult,
    paymentsResult,
    prefsResult,
    ticketsResult,
  ] = await Promise.all([
    fetchMasterCabinet().catch(() => null),
    fetchAuthIdentities().catch(() => []),
    fetchMasterAppointments({ tab: 'all', limit: 200, offset: 0 }).catch(() => ({
      appointments: [],
      total: 0,
      limit: 0,
      offset: 0,
      hasMore: false,
    })),
    getBillingSubscription().catch(() => null),
    listBillingPayments(50).catch(() => []),
    fetchMasterNotificationPreferences().catch(() => null),
    fetchSupportTickets({ limit: 50 }).catch(() => ({ tickets: [], total: 0, limit: 0, offset: 0 })),
  ]);

  const masterName = cabinet?.profile.displayName?.trim() || profile.full_name?.trim() || 'Мастер';
  const exportDate = new Date().toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'SLOTTY — мои данные', bold: true, size: 32 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Отчёт по кабинету мастера', size: 24, color: '666666' })],
    }),
    line('Мастер', masterName),
    line('Дата формирования', exportDate),
    line('Сервис', 'slotty.by'),
    ...buildAccountSection(profile, identities),
  ];

  if (cabinet) {
    children.push(...buildCabinetSection(cabinet));
    children.push(...buildServicesSection(cabinet));
    children.push(...buildPortfolioSection(cabinet));
  }

  children.push(...buildAppointmentsSection(appointmentsResult.appointments));
  children.push(...buildBillingSection(billingResult, paymentsResult));
  children.push(...buildNotificationsSection(prefsResult));
  children.push(...buildSupportSection(ticketsResult.tickets));

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Документ сформирован в кабинете SLOTTY. Не передавайте файл третьим лицам без необходимости.',
          italics: true,
          size: 20,
          color: '888888',
        }),
      ],
    }),
  );

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const stamp = new Date().toISOString().slice(0, 10);
  const safeName = masterName.replace(/[^\p{L}\p{N}\-_]+/gu, '_').slice(0, 40) || 'master';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `slotty-moi-dannye-${safeName}-${stamp}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
