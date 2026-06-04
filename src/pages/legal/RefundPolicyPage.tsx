import type { FC } from 'react';
import { PaymentLegalTrustBlock } from '../../shared/ui/PaymentLogos';
import { LEGAL_PAYMENT_PATH } from '../../app/paths';
import { SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';
import { LegalDocIntro, LegalDocSection, legalDocLinkClass, type LegalTocItem } from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'booking', label: '1. Запись к мастеру' },
  { id: 'pro', label: '2. Тариф Pro' },
  { id: 'online', label: '3. Онлайн-оплата' },
  { id: 'contact', label: '4. Контакты' },
];

export const RefundPolicyPage: FC = () => {
  return (
    <LegalPageShell
      title="Возвраты и отмена оплаты"
      titleHighlight="отмена оплаты"
      toc={TOC}
    >
      <LegalDocIntro>
        Действует в отношении сервиса <strong className="text-[#111827]">SLOTTY</strong>. До активации
        онлайн-оплаты возвраты по карте/ЕРИП на сайте не применяются.
      </LegalDocIntro>

      <PaymentLegalTrustBlock className="mt-2" />

      <LegalDocSection id="booking" title="1. Запись к мастеру (клиент)">
        <p>
          Отмена или перенос записи регулируются правилами мастера. Возврат за визит — по договорённости с мастером,
          если была предоплата вне SLOTTY.
        </p>
      </LegalDocSection>

      <LegalDocSection id="pro" title="2. Тариф Pro (мастер)">
        <p>
          При оплате Pro по реквизитам возврат рассматривается по обращению в поддержку с указанием даты платежа.
        </p>
      </LegalDocSection>

      <LegalDocSection id="online" title="3. Онлайн-оплата (после подключения)">
        <p>
          Порядок возврата будет опубликован на этой странице и на{' '}
          <a className={legalDocLinkClass} href={LEGAL_PAYMENT_PATH}>
            «Оплате и безопасности»
          </a>
          .
        </p>
      </LegalDocSection>

      <LegalDocSection id="contact" title="4. Контакты">
        <p>
          По вопросам возврата:{' '}
          <a className={legalDocLinkClass} href={`mailto:${SITE_SUPPORT_EMAIL}`}>
            {SITE_SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalDocSection>
    </LegalPageShell>
  );
};
