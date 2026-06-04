import type { FC } from 'react';
import { PaymentLegalTrustBlock } from '../../shared/ui/PaymentLogos';
import { LEGAL_REFUND_PATH, LEGAL_PAYMENT_PATH } from '../../app/paths';
import { SITE_OPERATOR_LEGAL, SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';
import { LegalDocIntro, LegalDocSection, legalDocLinkClass, type LegalTocItem } from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'subject', label: '1. Предмет' },
  { id: 'accept', label: '2. Акцепт' },
  { id: 'payment', label: '3. Стоимость и оплата' },
  { id: 'refunds', label: '4. Возвраты' },
  { id: 'contact', label: '5. Контакты' },
];

export const PublicOfferPage: FC = () => {
  return (
    <LegalPageShell title="Публичная оферта" toc={TOC}>
      <LegalDocIntro>
        Настоящий документ — проект публичной оферты сервиса <strong className="text-[#111827]">SLOTTY</strong>.
        TODO: финальная юридическая проверка и полные реквизиты оператора.
      </LegalDocIntro>

      <PaymentLegalTrustBlock showLogos />

      <LegalDocSection id="subject" title="1. Предмет">
        <p>
          Оператор предоставляет доступ к платформе онлайн-записи к мастерам. Услуги beauty оказываются мастерами;
          SLOTTY выступает как информационный и технический посредник, если иное не указано при оплате.
        </p>
      </LegalDocSection>

      <LegalDocSection id="accept" title="2. Акцепт">
        <p>
          Акцептом считается регистрация, оформление записи, оплата платных функций или иное использование сервиса с
          принятием пользовательского соглашения и политики персональных данных.
        </p>
      </LegalDocSection>

      <LegalDocSection id="payment" title="3. Стоимость и оплата">
        <p>
          Стоимость платных функций указывается в интерфейсе до оплаты. Онлайн-оплата будет доступна после подключения
          провайдера.
        </p>
        <p>
          Подробности:{' '}
          <a className={legalDocLinkClass} href={LEGAL_PAYMENT_PATH}>
            Оплата и безопасность
          </a>
          .
        </p>
      </LegalDocSection>

      <LegalDocSection id="refunds" title="4. Возвраты">
        <p>
          Порядок возврата описан на странице{' '}
          <a className={legalDocLinkClass} href={LEGAL_REFUND_PATH}>
            «Возвраты»
          </a>
          .
        </p>
      </LegalDocSection>

      <LegalDocSection id="contact" title="5. Контакты">
        <p>
          {SITE_OPERATOR_LEGAL.includes('TODO') ? '' : `${SITE_OPERATOR_LEGAL} `}
          <a className={legalDocLinkClass} href={`mailto:${SITE_SUPPORT_EMAIL}`}>
            {SITE_SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalDocSection>
    </LegalPageShell>
  );
};
