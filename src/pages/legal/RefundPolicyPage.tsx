import type { FC } from 'react';
import { PaymentLegalTrustBlock } from '../../shared/ui/PaymentLogos';
import { LEGAL_PAYMENT_PATH } from '../../app/paths';
import { SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';

export const RefundPolicyPage: FC = () => {
  return (
    <LegalPageShell title="Возвраты и отмена оплаты">
      <p className="text-[13px] font-medium text-neutral-500">
        Действует в отношении сервиса <strong className="text-neutral-800">SLOTTY</strong>. Онлайн-оплата через
        платёжного провайдера подключается отдельно; до активации возвраты по карте/ЕРИП на сайте не применяются.
      </p>

      <PaymentLegalTrustBlock className="mt-2" />

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">1. Запись к мастеру (клиент)</h2>
        <p>
          Отмена или перенос записи регулируются правилами конкретного мастера и общими правилами сервиса. SLOTTY не
          принимает оплату за услугу мастера на сайте до подключения соответствующей функции — возврат денег за визит
          к мастеру осуществляется по договорённости с мастером, если была предоплата вне SLOTTY.
        </p>
        <p className="mt-3">
          Если клиент отменил запись в приложении, мастер отменил визит или услуга не состоялась — статус записи
          обновляется в системе; денежный возврат через SLOTTY возможен только при фактической онлайн-оплате через
          платформу (после подключения).
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">2. Тариф Pro (мастер)</h2>
        <p>
          При оплате Pro по банковским реквизитам с ручной проверкой возврат рассматривается по обращению в поддержку
          с указанием даты платежа и назначения. После подключения онлайн-оплаты правила возврата подписки будут
          дополнены сроками и порядком через платёжного провайдера.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">3. Онлайн-оплата (после подключения)</h2>
        <p>
          Порядок возврата при оплате картой или через ЕРИП будет опубликован на этой странице и на странице{' '}
          <a className="font-semibold text-[#E29595] underline underline-offset-2" href={LEGAL_PAYMENT_PATH}>
            «Оплата и безопасность»
          </a>
          . Ориентир: возврат на ту же платёжную карту или счёт в сроки, установленные законодательством РБ и
          правилами банка/провайдера.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">4. Контакты</h2>
        <p>
          По вопросам возврата:{' '}
          <a className="font-semibold text-[#E29595] underline underline-offset-2" href={`mailto:${SITE_SUPPORT_EMAIL}`}>
            {SITE_SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
};
