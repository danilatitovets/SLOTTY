import { SettingsBillingHelpButton, SettingsBillingWorkspace } from '../billing/SettingsBillingWorkspace';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';

const meta = SETTINGS_PAGE_META.billing;

export function SettingsBillingPage() {
  return (
    <>
      <SettingsHeader
        title={meta.title}
        description={meta.description}
        breadcrumb={meta.breadcrumb}
        actions={<SettingsBillingHelpButton />}
      />
      <SettingsBillingWorkspace />
    </>
  );
}
