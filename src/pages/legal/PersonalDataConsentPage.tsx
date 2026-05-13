import type { FC } from 'react';
import { PD_CONSENT_PDF_HREF, SITE_OPERATOR_LEGAL, SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';

export const PersonalDataConsentPage: FC = () => {
  return (
    <LegalPageShell title="Согласие на обработку персональных данных">
      <p className="text-[13px] font-medium text-neutral-500">
        Ниже — типовая формулировка согласия для пользователей сервиса <strong className="text-neutral-800">SLOTTY</strong>.
        При публикации убедитесь, что перечень целей и данных соответствует фактической обработке.
      </p>

      <section>
        <p>
          Я, заполняя формы / регистрируясь / продолжая пользоваться сервисом SLOTTY, даю согласие {SITE_OPERATOR_LEGAL}{' '}
          на обработку моих персональных данных, в том числе: фамилии, имени, отчества (при наличии), контактных данных,
          идентификатора в Telegram, сведений о записях и взаимодействии с сервисом — способами, предусмотренными
          законодательством, включая сбор, запись, систематизацию, накопление, хранение, уточнение (обновление,
          изменение), извлечение, использование, передачу (предоставление, доступ), обезличивание, блокирование,
          удаление, уничтожение персональных данных.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">Цели согласия</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>регистрация и авторизация в сервисе;</li>
          <li>организация онлайн-записи к мастерам, уведомления о статусе записи;</li>
          <li>поддержка пользователей, защита прав и законных интересов Оператора;</li>
          <li>улучшение работы сервиса в обезличенном виде — в пределах, допускаемых законом.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">Срок действия</h2>
        <p>
          Согласие действует до достижения целей обработки, отзыва субъектом персональных данных или иного основания
          прекращения обработки в соответствии с законом. Отзыв возможен письмом на{' '}
          <a className="font-semibold text-[#E29595] underline underline-offset-2" href={`mailto:${SITE_SUPPORT_EMAIL}`}>
            {SITE_SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">PDF-версия</h2>
        <p>
          Скачать согласие (файл на основе шаблона Tivonix, адаптируйте под свои реквизиты):{' '}
          <a
            className="font-semibold text-[#E29595] underline underline-offset-2"
            href={PD_CONSENT_PDF_HREF}
            target="_blank"
            rel="noopener noreferrer"
          >
            Согласие на обработку ПД (PDF)
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
};
