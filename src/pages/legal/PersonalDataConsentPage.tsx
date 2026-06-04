import type { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { LEGAL_CONSENT_PATH } from '../../app/paths';
import { LEGAL_EFFECTIVE_FROM } from '../../shared/legal/legalConfig';
import { PD_CONSENT_PDF_HREF, SITE_OPERATOR_LEGAL, SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';
import {
  LegalDocIntro,
  LegalDocSection,
  legalDocLinkClass,
  legalDocListClass,
  type LegalTocItem,
} from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'parties', label: '1. Субъект и оператор' },
  { id: 'scope', label: '2. Состав данных' },
  { id: 'purposes', label: '3. Цели' },
  { id: 'term', label: '4. Срок и отзыв' },
];

export const PersonalDataConsentPage: FC = () => {
  return (
    <LegalPageShell
      title="Согласие на обработку персональных данных"
      toc={TOC}
      meta={`Версия 1 · действует с ${LEGAL_EFFECTIVE_FROM}`}
    >
      <LegalDocIntro>
        Архивная PDF-копия:{' '}
        <a href={PD_CONSENT_PDF_HREF} className={legalDocLinkClass} target="_blank" rel="noopener noreferrer">
          скачать PDF
        </a>
        . TODO: финальная юридическая проверка.
      </LegalDocIntro>

      <LegalDocSection id="parties" title="1. Субъект и оператор">
        <p>
          Я, пользователь сервиса SLOTTY, даю {SITE_OPERATOR_LEGAL} согласие на обработку моих персональных данных в
          соответствии с Законом РБ «О защите персональных данных» и Политикой обработки персональных данных SLOTTY.
        </p>
      </LegalDocSection>

      <LegalDocSection id="scope" title="2. Состав данных">
        <ul className={legalDocListClass}>
          <li>идентификаторы Telegram / Google / email;</li>
          <li>имя, телефон, адрес (если указаны);</li>
          <li>данные записей, избранного, уведомлений;</li>
          <li>фото профиля, reference-фото к записи (если загружены);</li>
          <li>технические данные (IP, cookie, устройство).</li>
        </ul>
      </LegalDocSection>

      <LegalDocSection id="purposes" title="3. Цели">
        <p>
          Регистрация и вход, запись к мастерам, личный кабинет, уведомления, безопасность сервиса, исполнение
          пользовательского соглашения. Добровольная подписка на email-новости — только при отдельном действии в
          футере сайта.
        </p>
      </LegalDocSection>

      <LegalDocSection id="term" title="4. Срок и отзыв">
        <p>
          До достижения целей или отзыва согласия. Отзыв — на {SITE_SUPPORT_EMAIL}.
        </p>
      </LegalDocSection>
    </LegalPageShell>
  );
};

export const PersonalDataConsentLegacyRedirect: FC = () => (
  <Navigate to={LEGAL_CONSENT_PATH} replace />
);
