import { Link } from 'react-router-dom';
import {
  MASTER_SETTINGS_SUPPORT_CONTACT_PATH,
  MASTER_SETTINGS_SUPPORT_PATH,
} from '../../../../../app/paths';
import { legalReturnState } from '../../../../legal/useLegalPageBack';
import { SettingsHeader } from '../SettingsHeader';
import {
  SettingsCabinetList,
  SettingsCabinetListRow,
  SettingsCabinetSectionTitle,
  settingsCabinetOutlineBtn,
  settingsCabinetStack,
} from '../settingsCabinetUi';
import { SUPPORT_DOCS_RETURN_PATH, SUPPORT_GUIDE_LINKS, SUPPORT_LEGAL_LINKS } from './supportDocsConstants';
import { SupportIconDocs } from './supportIcons';

export function SupportDocsPage() {
  return (
    <>
      <SettingsHeader
        title="Документация"
        description="Гайды по кабинету мастера и юридические документы SLOTTY."
        breadcrumb="Поддержка / Документация"
        actions={
          <Link to={MASTER_SETTINGS_SUPPORT_PATH} className={settingsCabinetOutlineBtn}>
            Назад
          </Link>
        }
      />

      <div className={settingsCabinetStack}>
        <section>
          <SettingsCabinetSectionTitle
            title="Гайды по кабинету"
            description="Перейдите в нужный раздел, чтобы настроить профиль, услуги и записи."
          />
          <SettingsCabinetList>
            {SUPPORT_GUIDE_LINKS.map((item) => (
              <SettingsCabinetListRow
                key={item.id}
                icon={<SupportIconDocs />}
                title={item.title}
                subtitle={item.description}
                to={item.to}
                actionLabel={item.actionLabel ?? 'Читать'}
              />
            ))}
          </SettingsCabinetList>
        </section>

        <section>
          <SettingsCabinetSectionTitle
            title="Юридические документы"
            description="Актуальные версии правил и политик сервиса."
          />
          <SettingsCabinetList>
            {SUPPORT_LEGAL_LINKS.map((item) => (
              <SettingsCabinetListRow
                key={item.to}
                icon={<SupportIconDocs />}
                title={item.title}
                subtitle={item.description}
                to={item.to}
                linkState={legalReturnState(SUPPORT_DOCS_RETURN_PATH)}
                actionLabel="Читать"
              />
            ))}
          </SettingsCabinetList>
        </section>

        <p className="text-[13px] leading-relaxed text-[#6B7280]">
          Не нашли ответ?{' '}
          <Link to={MASTER_SETTINGS_SUPPORT_CONTACT_PATH} className="font-semibold text-[#ff5f7a] no-underline hover:underline">
            Создайте обращение в поддержку
          </Link>
          .
        </p>
      </div>
    </>
  );
}
