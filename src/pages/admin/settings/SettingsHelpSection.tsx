import { useState } from 'react';
import { LEGAL_DOCUMENTS, type LegalDocId } from '../../../constants/legalDocuments';
import {
  SUPPORT_EMAIL,
  SUPPORT_TELEGRAM,
  isPlaceholderContact,
  supportTelegramUrl,
} from '../../../constants/support';
import {
  settingsListDivide,
  settingsListTray,
  settingsPanel,
  settingsSectionLabel,
} from './adminSettingsTheme';
import {
  EmailSupportIcon,
  SettingsBackButton,
  SettingsContactCard,
  SettingsDocCard,
  SettingsLegalReader,
  TelegramSupportIcon,
} from './SettingsHelpUi';

export function SettingsHelpSection() {
  const [legalId, setLegalId] = useState<LegalDocId | null>(null);
  const tgUrl = supportTelegramUrl(SUPPORT_TELEGRAM);
  const emailReady = !isPlaceholderContact(SUPPORT_EMAIL) && SUPPORT_EMAIL.includes('@');

  const doc = legalId ? LEGAL_DOCUMENTS.find((d) => d.id === legalId) : null;

  if (doc) {
    return (
      <section className={settingsPanel}>
        <SettingsBackButton onClick={() => setLegalId(null)} label="К справке" />
        <SettingsLegalReader title={doc.title} updatedLabel={doc.updatedLabel} body={doc.body} />
      </section>
    );
  }

  return (
    <section className={settingsPanel}>
      <div className="space-y-3">
        <p className={settingsSectionLabel}>Поддержка</p>
        <div className={`${settingsListTray} ${settingsListDivide}`}>
          <SettingsContactCard
            tone="telegram"
            icon={<TelegramSupportIcon />}
            title="Telegram"
            value={SUPPORT_TELEGRAM}
            href={tgUrl}
            external
          />
          <SettingsContactCard
            tone="email"
            icon={<EmailSupportIcon />}
            title="Email"
            value={SUPPORT_EMAIL}
            href={emailReady ? `mailto:${SUPPORT_EMAIL}` : null}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className={settingsSectionLabel}>Документы</p>
        <div className={`${settingsListTray} ${settingsListDivide}`}>
          {LEGAL_DOCUMENTS.map((d) => (
            <SettingsDocCard
              key={d.id}
              id={d.id}
              title={d.title}
              updatedLabel={d.updatedLabel}
              onOpen={() => setLegalId(d.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
