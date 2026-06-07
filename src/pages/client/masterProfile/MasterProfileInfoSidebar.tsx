import type { ReactNode } from 'react';
import { useState } from 'react';
import { resolveFilledContacts } from '../../../features/master-onboarding/model/masterContacts';
import { MasterContactsChips } from '../../master-onboarding/MasterContactsChips';
import { MasterAddressBlock } from './MasterAddressBlock';
import { MasterPaymentMethodsBlock } from './MasterPaymentMethodsBlock';
import type { ExtendedMasterProfile } from './types';
import { computeExperienceYears } from './masterProfileUtils';
import { MASTER_PROFILE_SECTION_IDS } from './masterProfileSectionIds';
import { masterProfileCard } from './masterProfileTheme';

function InfoCard({
  id,
  title,
  children,
  defaultOpen = false,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className={`${masterProfileCard} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <h3 className="text-[15px] font-bold text-[#111827]">{title}</h3>
        <span className="text-[12px] font-semibold text-[#F47C8C]">{open ? 'Свернуть' : 'Открыть'}</span>
      </button>
      {open ? <div className="border-t border-[#F0F0F0] px-5 pb-5 pt-4">{children}</div> : null}
    </section>
  );
}

type Props = { master: ExtendedMasterProfile };

export function MasterProfileInfoSidebar({ master }: Props) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const bio = master.bio?.trim();
  const paymentMethods = master.paymentMethods ?? [];
  const clientContacts = resolveFilledContacts({
    contact: master.contact,
    contacts: master.contacts,
  });
  const experienceYears = computeExperienceYears(master.careerItems);
  const hasRules =
    Boolean(master.clientPreview?.length) ||
    Boolean(master.bookingRules?.trim()) ||
    Boolean(master.cancellationPolicy?.trim()) ||
    Boolean(master.paymentNote?.trim()) ||
    Boolean(master.payment?.methods?.length) ||
    paymentMethods.length > 0;

  return (
    <div className="space-y-4">
      {clientContacts.length > 0 ? (
        <InfoCard title="Связаться с мастером">
          <p className="mb-3 text-[13px] leading-relaxed text-[#6B7280]">
            Напишите мастеру в удобном мессенджере
          </p>
          <MasterContactsChips contacts={clientContacts} />
        </InfoCard>
      ) : null}

      {bio ? (
        <InfoCard id={MASTER_PROFILE_SECTION_IDS.about} title="О мастере">
          <p className={`text-[14px] leading-relaxed text-[#4B5563] ${bioExpanded ? '' : 'line-clamp-5'}`}>
            {bio}
          </p>
          {bio.length > 180 ? (
            <button
              type="button"
              onClick={() => setBioExpanded((v) => !v)}
              className="mt-2.5 text-[13px] font-semibold text-[#F47C8C]"
            >
              {bioExpanded ? 'Свернуть' : 'Показать полностью'}
            </button>
          ) : null}
          {experienceYears != null && experienceYears > 0 ? (
            <p className="mt-3 text-[13px] font-semibold text-[#374151]">
              Опыт: {experienceYears}{' '}
              {experienceYears === 1 ? 'год' : experienceYears < 5 ? 'года' : 'лет'}
            </p>
          ) : null}
          {master.certificates && master.certificates.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {master.certificates.slice(0, 3).map((cert) => (
                <li key={cert.id} className="text-[13px] text-[#374151]">
                  <span className="font-semibold text-[#111827]">{cert.title}</span>
                  {cert.issuer ? ` · ${cert.issuer}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </InfoCard>
      ) : null}

      <InfoCard id={MASTER_PROFILE_SECTION_IDS.address} title="Адрес и формат">
        <MasterAddressBlock location={master.location} />
      </InfoCard>

      {hasRules ? (
        <InfoCard id={MASTER_PROFILE_SECTION_IDS.rules} title="Правила мастера">
          <div className="space-y-3 text-[14px] leading-relaxed text-[#4B5563]">
            {master.clientPreview?.length ? (
              <ul className="space-y-2">
                {master.clientPreview
                  .filter((line) => line.trim() && !/^оплата:/i.test(line.trim()))
                  .map((line) => (
                    <li key={line}>{line}</li>
                  ))}
              </ul>
            ) : (
              <>
                {master.bookingRules?.trim() ? (
                  <div>
                    <p className="font-bold text-[#111827]">Запись</p>
                    <p className="mt-1 whitespace-pre-wrap">{master.bookingRules.trim()}</p>
                  </div>
                ) : null}
                {master.cancellationPolicy?.trim() ? (
                  <div>
                    <p className="font-bold text-[#111827]">Отмена и перенос</p>
                    <p className="mt-1 whitespace-pre-wrap">{master.cancellationPolicy.trim()}</p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </InfoCard>
      ) : null}

      {paymentMethods.length > 0 || master.payment?.methods?.length || master.paymentNote?.trim() ? (
        <InfoCard title="Оплата">
          <MasterPaymentMethodsBlock
            methods={paymentMethods}
            payment={master.payment}
            note={master.paymentNote}
            preferredBankIds={master.preferredBankIds}
          />
        </InfoCard>
      ) : null}
    </div>
  );
}
