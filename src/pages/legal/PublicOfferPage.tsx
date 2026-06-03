import type { FC } from 'react';
import { PaymentLegalTrustBlock } from '../../shared/ui/PaymentLogos';
import { LEGAL_REFUND_PATH, LEGAL_PAYMENT_PATH } from '../../app/paths';
import { SITE_OPERATOR_LEGAL, SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';

/** Публичная оферта — рабочая версия; требует юридической проверки и реквизитов оператора. */
export const PublicOfferPage: FC = () => {
  return (
    <LegalPageShell title="Публичная оферта">
      <p className="text-[13px] font-medium text-neutral-500">
        Настоящий документ — проект публичной оферты сервиса <strong className="text-neutral-800">SLOTTY</strong>.
        TODO: финальная юридическая проверка и полные реквизиты {SITE_OPERATOR_LEGAL.includes('TODO') ? 'оператора' : ''}.
      </p>

      <PaymentLegalTrustBlock showLogos />

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">1. Предмет</h2>
        <p>
          Оператор предоставляет пользователям доступ к платформе онлайн-записи к мастерам (каталог, профили, запись,
          уведомления). Услуги beauty/бытового характера оказываются мастерами; SLOTTY выступает как информационный и
          технический посредник, если иное не указано при оплате конкретной услуги через платформу.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">2. Акцепт</h2>
        <p>
          Акцептом оферты считается регистрация, оформление записи, оплата платных функций (после подключения) или
          иное использование сервиса с принятием пользовательского соглашения и политики персональных данных.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">3. Стоимость и оплата</h2>
        <p>
          Стоимость платных функций SLOTTY (например, тариф Pro для мастеров) указывается в интерфейсе до оплаты.
          Онлайн-оплата банковской картой и через ЕРИП будет доступна после подключения платёжного провайдера; до этого
          момента применяются способы, указанные в кабинете (в т.ч. оплата по реквизитам с ручной проверкой, если
          включена).
        </p>
        <p className="mt-3">
          Подробности:{' '}
          <a className="font-semibold text-[#E29595] underline underline-offset-2" href={LEGAL_PAYMENT_PATH}>
            Оплата и безопасность
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">4. Возвраты</h2>
        <p>
          Порядок возврата описан на странице{' '}
          <a className="font-semibold text-[#E29595] underline underline-offset-2" href={LEGAL_REFUND_PATH}>
            «Возвраты»
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">5. Контакты</h2>
        <p>
          {SITE_SUPPORT_EMAIL} —{' '}
          <a className="font-semibold text-[#E29595] underline underline-offset-2" href={`mailto:${SITE_SUPPORT_EMAIL}`}>
            написать в поддержку
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
};
