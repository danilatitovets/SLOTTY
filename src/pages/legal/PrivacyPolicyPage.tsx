import type { FC } from 'react';
import {
  PD_POLICY_PDF_HREF,
  SITE_OPERATOR_LEGAL,
  SITE_SUPPORT_EMAIL,
} from './legalSiteInfo';
import { PrivacyLegalPageShell } from './PrivacyLegalPageShell';
import {
  LegalDocDarkIntro,
  LegalDocDarkSection,
  legalDocDarkLinkClass,
  legalDocDarkListClass,
  type LegalTocItem,
} from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'general', label: '1. Общие положения' },
  { id: 'data', label: '2. Какие данные обрабатываются' },
  { id: 'purposes', label: '3. Цели обработки' },
  { id: 'newsletter', label: '4. Email-рассылка' },
  { id: 'legal-basis', label: '5. Правовые основания' },
  { id: 'transfer', label: '6. Передача и хранение' },
  { id: 'rights', label: '7. Права субъекта ПД' },
  { id: 'pdf', label: '8. PDF-версия' },
];

export const PrivacyPolicyPage: FC = () => {
  return (
    <PrivacyLegalPageShell
      title="Политика в отношении обработки персональных данных"
      titleHighlight="персональных данных"
      toc={TOC}
    >
      <LegalDocDarkIntro>
        Настоящая политика действует в отношении сервиса <strong>SLOTTY</strong> (онлайн-запись к мастерам). Текст
        на сайте — рабочая версия под продукт; юридически значимый архив можно вести в PDF.
      </LegalDocDarkIntro>

      <LegalDocDarkSection id="general" title="1. Общие положения">
        <p>
          {SITE_OPERATOR_LEGAL} Обработка персональных данных осуществляется в соответствии с законодательством о
          персональных данных (в т.ч. Закон РБ от 07.05.2021 № 99-З «О защите персональных данных») и настоящей
          Политикой.
        </p>
      </LegalDocDarkSection>

      <LegalDocDarkSection id="data" title="2. Какие данные могут обрабатываться">
        <ul className={legalDocDarkListClass}>
          <li>идентификатор и данные учётной записи в Telegram при входе через Telegram Mini App;</li>
          <li>имя (или отображаемое имя), контактные данные, указанные вами в профиле;</li>
          <li>адрес электронной почты при добровольной подписке на новости SLOTTY через форму в футере сайта;</li>
          <li>сведения о записях на услуги, избранных мастерах, уведомлениях;</li>
          <li>
            технические данные (IP, cookie, сведения об устройстве и браузере) — в объёме, необходимом для работы и
            защиты сервиса.
          </li>
        </ul>
      </LegalDocDarkSection>

      <LegalDocDarkSection id="purposes" title="3. Цели обработки">
        <p>
          Обработка направлена на: предоставление функций записи и личного кабинета; исполнение договоров с
          пользователем; информирование о статусе записи; улучшение качества сервиса и безопасности; соблюдение
          требований закона.
        </p>
        <p>
          Отдельно — при вашей добровольной подписке на новости: информирование о новостях платформы, акциях и
          полезных материалах SLOTTY (маркетинговая email-рассылка). Подписка не является обязательной для
          использования сервиса.
        </p>
      </LegalDocDarkSection>

      <LegalDocDarkSection id="newsletter" title="4. Email-рассылка новостей">
        <ul className={legalDocDarkListClass}>
          <li>
            Подписаться можно через форму «Подписаться на новости» в футере сайта; для этого требуется указать email
            и согласие с настоящей Политикой.
          </li>
          <li>
            Оператор хранит адрес email, факт согласия, источник подписки, даты подписки и отписки, а также технические
            метаданные (IP, user-agent) в объёме, необходимом для учёта согласия и безопасности.
          </li>
          <li>
            Маркетинговые письма отправляются через email-сервис Resend (или иной аналогичный провайдер). Адрес после
            отписки не получает marketing/newsletter-кампании.
          </li>
          <li>
            В каждом marketing-письме есть ссылка для отписки. Отписка не влияет на сервисные письма, связанные с
            аккаунтом.
          </li>
        </ul>
      </LegalDocDarkSection>

      <LegalDocDarkSection id="legal-basis" title="5. Правовые основания">
        <p>
          Согласие субъекта персональных данных, договор (оферта / пользовательское соглашение), иные основания,
          предусмотренные законом. Для marketing-рассылки — отдельное согласие при подписке в футере.
        </p>
      </LegalDocDarkSection>

      <LegalDocDarkSection id="transfer" title="6. Передача и хранение">
        <p>
          Данные обрабатываются на серверах и в инфраструктуре, выбранных Оператором. Передача третьим лицам
          осуществляется только при наличии законных оснований. Для отправки email может использоваться Resend;
          трансграничная передача — в соответствии с{' '}
          <a className={legalDocDarkLinkClass} href="/legal/cross-border">
            согласием на трансграничную передачу
          </a>
          , если оно требуется.
        </p>
        <p>
          Оператор не продаёт и не передаёт персональные данные третьим лицам в маркетинговых целях без вашего
          согласия.
        </p>
      </LegalDocDarkSection>

      <LegalDocDarkSection id="rights" title="7. Права субъекта ПД">
        <p>
          Вы вправе запросить уточнение, блокирование или удаление персональных данных, отозвать согласие — через{' '}
          <a className={legalDocDarkLinkClass} href={`mailto:${SITE_SUPPORT_EMAIL}`}>
            {SITE_SUPPORT_EMAIL}
          </a>
          . Для marketing-рассылки вы также можете отписаться по ссылке в письме.
        </p>
      </LegalDocDarkSection>

      <LegalDocDarkSection id="pdf" title="8. PDF-версия">
        <p>
          Скачать политику:{' '}
          <a
            className={legalDocDarkLinkClass}
            href={PD_POLICY_PDF_HREF}
            target="_blank"
            rel="noopener noreferrer"
          >
            Политика обработки ПД (PDF)
          </a>
          .
        </p>
      </LegalDocDarkSection>
    </PrivacyLegalPageShell>
  );
};
