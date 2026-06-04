import type { FC } from 'react';
import { LEGAL_EFFECTIVE_FROM } from '../../shared/legal/legalConfig';
import { SITE_OPERATOR_LEGAL, SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { MasterTermsAvatarOrb } from './MasterTermsAvatarOrb';
import { LegalPageShell } from './LegalPageShell';
import { LegalDocIntro, LegalDocSection, legalDocLinkClass, type LegalTocItem } from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'status', label: '1. Статус мастера' },
  { id: 'content', label: '2. Данные и контент' },
  { id: 'bookings', label: '3. Записи и уведомления' },
  { id: 'plans', label: '4. Тарифы' },
  { id: 'contact', label: '5. Контакты' },
];

export const MasterTermsPage: FC = () => {
  return (
    <LegalPageShell
      title="Условия для мастеров SLOTTY"
      titleHighlight="мастеров SLOTTY"
      headerCenter={<MasterTermsAvatarOrb />}
      toc={TOC}
      meta={`Версия 1 · действует с ${LEGAL_EFFECTIVE_FROM}`}
    >
      <LegalDocIntro>TODO: финальная юридическая проверка и реквизиты оператора.</LegalDocIntro>

      <LegalDocSection id="status" title="1. Статус мастера">
        <p>
          Мастер размещает в SLOTTY сведения об услугах, расписании и контактах и самостоятельно оказывает услуги
          клиентам. {SITE_OPERATOR_LEGAL} предоставляет платформу онлайн-записи и инструменты кабинета.
        </p>
      </LegalDocSection>

      <LegalDocSection id="content" title="2. Данные и контент">
        <p>
          Мастер отвечает за достоверность сведений, фото портфолио, сертификатов и цен. Загружая материалы,
          мастер подтверждает право их публикации.
        </p>
      </LegalDocSection>

      <LegalDocSection id="bookings" title="3. Записи и уведомления">
        <p>
          Мастер обязан своевременно подтверждать или отменять записи, поддерживать актуальное расписание.
          Уведомления клиентам могут отправляться через Telegram и in-app.
        </p>
      </LegalDocSection>

      <LegalDocSection id="plans" title="4. Тарифы">
        <p>
          Условия тарифных планов (Free / Pro) публикуются в сервисе. TODO: ссылка на оферту для мастеров при
          подключении платных функций.
        </p>
      </LegalDocSection>

      <LegalDocSection id="contact" title="5. Контакты">
        <p>
          По вопросам работы кабинета:{' '}
          <a className={legalDocLinkClass} href={`mailto:${SITE_SUPPORT_EMAIL}`}>
            {SITE_SUPPORT_EMAIL}
          </a>
          . TODO: указать юридический адрес и реквизиты оператора.
        </p>
      </LegalDocSection>
    </LegalPageShell>
  );
};
