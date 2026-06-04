import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MASTER_SETTINGS_SUPPORT_CONTACT_PATH,
  MASTER_SETTINGS_SUPPORT_TICKETS_PATH,
} from '../../../../../app/paths';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';
import {
  SettingsCabinetHero,
  SettingsCabinetList,
  SettingsCabinetRingBadge,
  SettingsCabinetListRow,
  SettingsCabinetSectionTitle,
  settingsCabinetStack,
} from '../settingsCabinetUi';
import { SUPPORT_OPTIONS, SUPPORT_URGENT_HELP_BG, type SupportOptionId } from './supportConstants';
import { SUPPORT_OPTION_ICONS } from './supportIcons';
import { isSupportApiAvailable } from './supportApi';

const meta = SETTINGS_PAGE_META.support;

const urgentHelpPrimaryBtn =
  'inline-flex min-h-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-r from-[#ff6f88] to-[#ff5f7a] px-4 text-[14px] font-bold text-white no-underline transition hover:opacity-95 active:scale-[0.98]';

const urgentHelpOutlineBtn =
  'inline-flex min-h-11 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] px-4 text-[14px] font-semibold text-[#ff5f7a] no-underline transition hover:bg-[#FFE8EE] active:scale-[0.98]';

const ACTION_LABELS: Record<SupportOptionId, string> = {
  assistant: 'Открыть',
  docs: 'Открыть',
  contact: 'Создать',
  community: 'Открыть',
};

export function SupportMainPage() {
  const apiReady = isSupportApiAvailable();

  const availableCount = useMemo(
    () => SUPPORT_OPTIONS.filter((o) => !o.disabled).length,
    [],
  );

  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />

      <div className={settingsCabinetStack}>
        <SettingsCabinetHero
          badge={
            <SettingsCabinetRingBadge
              current={availableCount}
              total={SUPPORT_OPTIONS.length}
              label="способов"
            />
          }
          title="Центр поддержки"
          description="Документация и обращения — всё в одном разделе"
        />

        <section>
          <SettingsCabinetSectionTitle title="Способы помощи" />
          <SettingsCabinetList>
            {SUPPORT_OPTIONS.map((opt) => {
              const Icon = SUPPORT_OPTION_ICONS[opt.id];
              return (
                <SettingsCabinetListRow
                  key={opt.id}
                  icon={<Icon />}
                  title={opt.title}
                  subtitle={opt.description}
                  badge={opt.badge}
                  disabled={opt.disabled}
                  to={opt.to}
                  externalHref={opt.externalHref}
                  actionLabel={ACTION_LABELS[opt.id]}
                />
              );
            })}
          </SettingsCabinetList>
        </section>

        <section
          className="relative min-h-[180px] overflow-hidden rounded-[16px] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${SUPPORT_URGENT_HELP_BG})` }}
          aria-label="Срочная помощь"
        >
          <div className="relative z-10 p-5 sm:p-6">
            <p className="text-[15px] font-bold text-[#111827]">Нужна срочная помощь?</p>
            <p className="mt-1 text-[13px] leading-snug text-[#6B7280]">
              Проблема с оплатой, входом или доступом — создайте обращение с высоким приоритетом
            </p>
            <div className="mt-4 flex flex-row flex-wrap items-center gap-2">
              <Link to={MASTER_SETTINGS_SUPPORT_CONTACT_PATH} className={urgentHelpPrimaryBtn}>
                Создать обращение
              </Link>
              {apiReady ? (
                <Link to={MASTER_SETTINGS_SUPPORT_TICKETS_PATH} className={urgentHelpOutlineBtn}>
                  Мои запросы
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
