import type { FC } from 'react';
import { LEGAL_REFUND_PATH } from '../../app/paths';
import { PaymentLogos } from '../../shared/ui/PaymentLogos';
import { SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';

export const PaymentInfoPage: FC = () => {
  return (
    <LegalPageShell title="Оплата и безопасность платежей">
      <p className="text-[13px] font-medium text-neutral-500">
        Сервис <strong className="text-neutral-800">SLOTTY</strong> подключает приём онлайн-платежей в Республике
        Беларусь через платёжного провайдера <strong className="text-neutral-800">bePaid</strong> (магазин в CRM:
        домен <strong className="text-neutral-800">slotty.of.by</strong>, ID <strong>35495</strong>, валюта{' '}
        <strong>BYN</strong>, 3-D Secure). Пока интеграция не включена в production (
        <code className="text-[12px]">BEPAID_ENABLED=false</code>), оплата на сайте недоступна — только подготовка и
        тесты.
      </p>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">Планируемые способы оплаты</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
          После подключения платёжного провайдера SLOTTY сможет принимать оплату банковскими картами и через доступные
          платёжные методы (в том числе через инфраструктуру bePaid и ЕРИП — в составе, который будет согласован при
          подключении).
        </p>
        <PaymentLogos
          variant="legal"
          className="mt-5"
          title="Планируемые способы оплаты"
          showDisclaimer
        />
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">Как сейчас проходит оплата</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Запись к мастеру</strong> — бесплатна в SLOTTY. Оплата услуги мастера, как правило, производится
            на месте по правилам мастера (наличные, перевод, карта у мастера и т.д.).
          </li>
          <li>
            <strong>Тариф Pro для мастеров</strong> — до подключения онлайн-эквайринга может оформляться по
            банковским реквизитам с ручной проверкой оплаты администратором (если эта опция включена в кабинете).
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">Безопасность платежей</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Оплата будет проходить на защищённой стороне платёжного провайдера (платёжная страница или виджет
            провайдера).
          </li>
          <li>
            SLOTTY не хранит полные данные банковских карт (номер, CVV/CVC, срок действия) на своих серверах.
          </li>
          <li>
            Доступные способы оплаты будут показаны при оформлении платной услуги на сайте или в кабинете — финальный
            список зависит от договора с провайдером и банком-эквайером.
          </li>
          <li>
            При ошибке или двойном списании после подключения оплаты обратитесь в поддержку:{' '}
            <a
              className="font-semibold text-[#E29595] underline underline-offset-2"
              href={`mailto:${SITE_SUPPORT_EMAIL}`}
            >
              {SITE_SUPPORT_EMAIL}
            </a>
            .
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">Возвраты</h2>
        <p>
          Условия возврата денежных средств при онлайн-оплате описаны на странице{' '}
          <a className="font-semibold text-[#E29595] underline underline-offset-2" href={LEGAL_REFUND_PATH}>
            «Возвраты»
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
};
