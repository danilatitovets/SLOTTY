import type { FC } from 'react';
import { SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';

/** Краткое пользовательское соглашение; при необходимости замените на полноценную оферту с юристом. */
export const UserAgreementPage: FC = () => {
  return (
    <LegalPageShell title="Пользовательское соглашение">
      <p className="text-[13px] font-medium text-neutral-500">
        Регулирует использование сервиса <strong className="text-neutral-800">SLOTTY</strong>. Дополните разделами про оплату, ответственность и споры под вашу модель.
      </p>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">1. Сервис</h2>
        <p>
          SLOTTY предоставляет технические средства для поиска мастеров, просмотра услуг и онлайн-записи. Договор на
          оказание услуги (маникюр, стрижка и т.д.) заключается между клиентом и мастером / салоном; SLOTTY выступает как
          посредническая платформа, если иное прямо не указано в интерфейсе или отдельном договоре.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">2. Аккаунт и данные</h2>
        <p>
          Вы обязуетесь предоставлять достоверные данные в разумном объёме. Обработка персональных данных регулируется
          Политикой конфиденциальности и Согласием на обработку ПД.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">3. Ограничение ответственности</h2>
        <p>
          Сервис предоставляется «как есть». Оператор не отвечает за качество услуг мастера, расписание третьих лиц и
          сбои связи, не зависящие от Оператора, в пределах, допускаемых применимым правом.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">4. Связь</h2>
        <p>
          Вопросы по соглашению:{' '}
          <a className="font-semibold text-[#E29595] underline underline-offset-2" href={`mailto:${SITE_SUPPORT_EMAIL}`}>
            {SITE_SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
};
