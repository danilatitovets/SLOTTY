import {
  getMasterSettingsSupportGuidePath,
  LEGAL_MASTER_TERMS_PATH,
  LEGAL_PAYMENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_REFUND_PATH,
  LEGAL_TERMS_PATH,
  MASTER_SETTINGS_SUPPORT_DOCS_PATH,
} from '../../../../../app/paths';
import { SUPPORT_GUIDES } from './supportGuideContent';

export type SupportGuideLink = {
  id: string;
  title: string;
  description: string;
  to: string;
  actionLabel?: string;
};

export type SupportLegalLink = {
  title: string;
  description: string;
  to: string;
};

export const SUPPORT_GUIDE_LINKS: SupportGuideLink[] = SUPPORT_GUIDES.map((g) => ({
  id: g.id,
  title: g.title,
  description: g.description,
  to: g.docsLinkPath ?? getMasterSettingsSupportGuidePath(g.id),
  actionLabel: g.docsLinkPath ? 'Открыть' : 'Читать',
}));

export const SUPPORT_LEGAL_LINKS: SupportLegalLink[] = [
  {
    title: 'Условия для мастеров',
    description: 'Правила использования кабинета мастера.',
    to: LEGAL_MASTER_TERMS_PATH,
  },
  {
    title: 'Условия пользования',
    description: 'Общие правила сервиса SLOTTY.',
    to: LEGAL_TERMS_PATH,
  },
  {
    title: 'Политика конфиденциальности',
    description: 'Обработка и защита персональных данных.',
    to: LEGAL_PRIVACY_PATH,
  },
  {
    title: 'Оплата',
    description: 'Способы оплаты и информация о платежах.',
    to: LEGAL_PAYMENT_PATH,
  },
  {
    title: 'Возвраты',
    description: 'Политика возврата средств.',
    to: LEGAL_REFUND_PATH,
  },
];

export const SUPPORT_DOCS_RETURN_PATH = MASTER_SETTINGS_SUPPORT_DOCS_PATH;
