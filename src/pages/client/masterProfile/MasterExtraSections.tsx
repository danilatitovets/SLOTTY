import { useState, type ReactNode } from 'react';
import { HiChevronDown } from 'react-icons/hi2';
import { resolveFilledContacts } from '../../../features/master-onboarding/model/masterContacts';
import { MasterContactsChips } from '../../master-onboarding/MasterContactsChips';
import { MasterAddressBlock } from './MasterAddressBlock';
import { MasterPaymentMethodsBlock } from './MasterPaymentMethodsBlock';
import type { ExtendedMasterProfile } from './types';
import { catalogDesktopPanel } from './masterProfileTheme';

type Props = { master: ExtendedMasterProfile; layout?: 'stack' | 'desktop' };

function parseRulePreviewLine(line: string): { label: string; value: string } {
  const idx = line.indexOf(':');
  if (idx === -1) return { label: line.trim(), value: '' };
  return {
    label: line.slice(0, idx).trim(),
    value: line.slice(idx + 1).trim(),
  };
}

function MasterRulePreviewLine({ line }: { line: string }) {
  const { label, value } = parseRulePreviewLine(line);

  return (
    <li className="text-[14px] leading-relaxed text-[#4B5563]">
      <span className="font-bold text-[#111827]">{label}</span>
      {value ? (
        <>
          {': '}
          <span>{value}</span>
        </>
      ) : null}
    </li>
  );
}

function RulesSectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-bold text-[#111827]">{children}</p>;
}

function Accordion({
  title,
  children,
  defaultOpen = false,
  desktop = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  desktop?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || desktop);
  return (
    <div
      className={
        desktop
          ? 'overflow-hidden rounded-[16px] bg-white'
          : 'overflow-hidden bg-white'
      }
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-[#FAFAFA]"
      >
        <span className="text-[16px] font-semibold text-[#111827]">{title}</span>
        <HiChevronDown
          className={`h-5 w-5 shrink-0 text-[#9CA3AF] transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-[#F3F4F6] px-4 pb-4 pt-3">{children}</div>
      ) : null}
    </div>
  );
}

export function MasterExtraSections({ master, layout = 'stack' }: Props) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const bio = master.bio?.trim();
  const paymentMethods = master.paymentMethods ?? [];
  const isDesktop = layout === 'desktop';
  const hasRulesContent = Boolean(
    master.clientPreview?.length ||
      master.bookingRules?.trim() ||
      master.cancellationPolicy?.trim() ||
      master.paymentNote?.trim() ||
      master.payment?.methods?.length ||
      paymentMethods.length > 0,
  );
  const clientContacts = resolveFilledContacts({
    contact: master.contact,
    contacts: master.contacts,
  });

  return (
    <section className={`${isDesktop ? '' : 'mt-0'} space-y-2.5 ${isDesktop ? 'divide-y divide-[#EEEEEE] rounded-[16px] bg-white' : `${catalogDesktopPanel} divide-y divide-[#EEEEEE]`}`}>
      {clientContacts.length > 0 ? (
        <Accordion title="Связаться" defaultOpen desktop={isDesktop}>
          <p className="mb-3 text-[13px] leading-relaxed text-[#6B7280]">
            Напишите мастеру в удобном мессенджере
          </p>
          <MasterContactsChips contacts={clientContacts} />
        </Accordion>
      ) : null}

      {bio ? (
        <Accordion title="О мастере" desktop={isDesktop}>
          <p
            className={`text-[14px] leading-relaxed text-[#4B5563] ${
              bioExpanded ? '' : 'line-clamp-4'
            }`}
          >
            {bio}
          </p>
          {bio.length > 160 ? (
            <button
              type="button"
              onClick={() => setBioExpanded((v) => !v)}
              className="mt-2.5 text-[13px] font-semibold text-[#F47C8C]"
            >
              {bioExpanded ? 'Свернуть' : 'Показать полностью'}
            </button>
          ) : null}
        </Accordion>
      ) : null}

      <Accordion title="Адрес и формат" defaultOpen desktop={isDesktop}>
        <MasterAddressBlock location={master.location} />
      </Accordion>

      {hasRulesContent ? (
        <Accordion title="Правила мастера" desktop={isDesktop}>
          <div className="space-y-3">
            {master.clientPreview?.length ? (
              <ul className="space-y-2.5">
                {master.clientPreview
                  .filter((line) => line.trim() && !/^оплата:/i.test(line.trim()))
                  .map((line) => (
                    <MasterRulePreviewLine key={line} line={line} />
                  ))}
              </ul>
            ) : (
              <>
                {master.bookingRules?.trim() ? (
                  <div>
                    <RulesSectionTitle>Запись</RulesSectionTitle>
                    <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[#4B5563]">
                      {master.bookingRules.trim()}
                    </p>
                  </div>
                ) : null}
                {master.cancellationPolicy?.trim() ? (
                  <div>
                    <RulesSectionTitle>Отмена и перенос</RulesSectionTitle>
                    <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[#4B5563]">
                      {master.cancellationPolicy.trim()}
                    </p>
                  </div>
                ) : null}
              </>
            )}
            {paymentMethods.length > 0 || master.paymentNote?.trim() || master.payment?.methods?.length ? (
              <div>
                <RulesSectionTitle>Оплата</RulesSectionTitle>
                <div className="mt-2">
                  <MasterPaymentMethodsBlock
                  methods={paymentMethods}
                  payment={master.payment}
                  note={master.paymentNote}
                  preferredBankIds={master.preferredBankIds}
                  compact
                />
                </div>
              </div>
            ) : null}
          </div>
        </Accordion>
      ) : null}
    </section>
  );
}
