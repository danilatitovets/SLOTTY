import type { FC } from 'react';
import { SITE_SUPPORT_EMAIL, TERMS_LEGAL_HERO_BG } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';
import { LegalDocSection, legalDocLinkClass, type LegalTocItem } from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'service', label: '1. Сервис' },
  { id: 'account', label: '2. Аккаунт и данные' },
  { id: 'liability', label: '3. Ограничение ответственности' },
  { id: 'contact', label: '4. Связь' },
];

export const UserAgreementPage: FC = () => {
  return (
    <LegalPageShell
      title="Пользовательское соглашение"
      titleHighlight="соглашение"
      heroBg={TERMS_LEGAL_HERO_BG}
      heroBgFit="cover"
      toc={TOC}
      heroLead={
        <>
          Регулирует использование сервиса <strong className="text-[#111827]">SLOTTY</strong>. Дополните разделами
          про оплату, ответственность и споры под вашу модель.
        </>
      }
    >
      <LegalDocSection id="service" title="1. Сервис">
        <p>
          SLOTTY предоставляет технические средства для поиска мастеров, просмотра услуг и онлайн-записи. Договор на
          оказание услуги заключается между клиентом и мастером; SLOTTY выступает как посредническая платформа, если
          иное прямо не указано.
        </p>
      </LegalDocSection>

      <LegalDocSection id="account" title="2. Аккаунт и данные">
        <p>
          Вы обязуетесь предоставлять достоверные данные в разумном объёме. Обработка персональных данных регулируется
          Политикой конфиденциальности и Согласием на обработку ПД.
        </p>
      </LegalDocSection>

      <LegalDocSection id="liability" title="3. Ограничение ответственности">
        <p>
          Сервис предоставляется «как есть». Оператор не отвечает за качество услуг мастера, расписание третьих лиц и
          сбои связи, не зависящие от Оператора, в пределах, допускаемых применимым правом.
        </p>
      </LegalDocSection>

      <LegalDocSection id="contact" title="4. Связь">
        <p>
          Вопросы по соглашению:{' '}
          <a className={legalDocLinkClass} href={`mailto:${SITE_SUPPORT_EMAIL}`}>
            {SITE_SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalDocSection>
    </LegalPageShell>
  );
};
