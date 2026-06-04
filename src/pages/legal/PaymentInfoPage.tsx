import type { FC } from 'react';
import { LEGAL_REFUND_PATH, MASTER_SETTINGS_BILLING_PATH } from '../../app/paths';
import { PaymentLogos } from '../../shared/ui/PaymentLogos';
import { PAYMENT_DISCLAIMER_LEGAL_PAGE } from '../../shared/ui/PaymentLogos/paymentLogosConfig';
import { SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';
import {
  LegalDocIntro,
  LegalDocSection,
  legalDocLinkClass,
  legalDocListClass,
  type LegalTocItem,
} from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'methods', label: 'Способы оплаты' },
  { id: 'current', label: 'Как проходит оплата' },
  { id: 'security', label: 'Безопасность платежей' },
  { id: 'refunds', label: 'Возвраты' },
];

export const PaymentInfoPage: FC = () => {
  return (
    <LegalPageShell
      title="Оплата и безопасность платежей"
      titleHighlight="безопасность платежей"
      toc={TOC}
    >
      <LegalDocIntro>
        Сервис <strong className="text-[#111827]">SLOTTY</strong> принимает онлайн-платежи в Республике Беларусь
        через платёжного провайдера <strong className="text-[#111827]">bePaid</strong>. Данные карты обрабатываются
        на стороне провайдера — SLOTTY не хранит полные реквизиты карты.
      </LegalDocIntro>

      <LegalDocSection id="methods" title="Способы оплаты">
        <p>
          Оплата на сайте выполняется через защищённую платёжную страницу bePaid. В зависимости от сценария доступны
          банковские карты (в том числе Visa, Mastercard, Белкарт) и другие методы, которые поддерживает провайдер в
          вашем заказе.
        </p>
        <PaymentLogos
          variant="legal"
          className="mt-5"
          showDisclaimer
          disclaimerText={PAYMENT_DISCLAIMER_LEGAL_PAGE}
        />
      </LegalDocSection>

      <LegalDocSection id="current" title="Как проходит оплата">
        <ul className={legalDocListClass}>
          <li>
            <strong>Запись к мастеру</strong> — оформление записи в SLOTTY бесплатно. Оплата услуги мастера, как
            правило, производится на месте по договорённости с мастером.
          </li>
          <li>
            <strong>Подписка Pro и платные функции мастера</strong> — оплата в кабинете в разделе{' '}
            <a className={legalDocLinkClass} href={MASTER_SETTINGS_BILLING_PATH}>
              «Биллинг и тариф»
            </a>
            . После выбора тарифа вы переходите на страницу bePaid, вводите данные карты и возвращаетесь в SLOTTY с
            результатом операции.
          </li>
          <li>
            <strong>Результат платежа</strong> — при успешной оплате статус подписки обновляется автоматически. При
            ошибке или отмене можно повторить оплату или обратиться в поддержку.
          </li>
        </ul>
      </LegalDocSection>

      <LegalDocSection id="security" title="Безопасность платежей">
        <ul className={legalDocListClass}>
          <li>
            Платёж обрабатывается на инфраструктуре <strong>bePaid</strong> — сертифицированного платёжного
            провайдера.
          </li>
          <li>SLOTTY не хранит полный номер карты, CVV и срок действия на своих серверах.</li>
          <li>
            Соединение с платёжной страницей защищено (HTTPS). Проверяйте адрес страницы оплаты и не передавайте
            коды из SMS третьим лицам.
          </li>
          <li>
            При ошибке, двойном списании или вопросе по чеку напишите на{' '}
            <a className={legalDocLinkClass} href={`mailto:${SITE_SUPPORT_EMAIL}`}>
              {SITE_SUPPORT_EMAIL}
            </a>{' '}
            — укажите дату, сумму и email аккаунта.
          </li>
        </ul>
      </LegalDocSection>

      <LegalDocSection id="refunds" title="Возвраты">
        <p>
          Условия возврата средств за платные функции SLOTTY описаны на странице{' '}
          <a className={legalDocLinkClass} href={LEGAL_REFUND_PATH}>
            «Возвраты»
          </a>
          . Обращения рассматриваются в сроки, указанные в политике возврата.
        </p>
      </LegalDocSection>
    </LegalPageShell>
  );
};
