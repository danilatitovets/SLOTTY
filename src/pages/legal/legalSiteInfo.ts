import { SUPPORT_EMAIL } from '../../constants/support';

/**
 * Юридические контакты SLOTTY.
 * TODO: заменить на полные реквизиты ИП/юрлица (наименование, УНП, адрес, банк).
 * TODO: финальная юридическая проверка текстов документов.
 */
export const SITE_OPERATOR_LEGAL =
  'Владелец интернет-сервиса онлайн-записи SLOTTY (далее — Оператор персональных данных). TODO: указать наименование и реквизиты.';

/** Почта для обращений по вопросам ПД и сервиса (тот же адрес, что в кабинете и настройках). */
export const SITE_SUPPORT_EMAIL = SUPPORT_EMAIL;

export const PD_POLICY_PDF_HREF = '/doc/SLOTTY_politika_pd.pdf';
export const PD_CONSENT_PDF_HREF = '/doc/SLOTTY_soglasie_pd.pdf';

export const TIVONIX_SITE_URL = 'https://tivonix.tech';

/** Фон блока «Оплата и возвраты» на юридических страницах. */
export const PAYMENT_LEGAL_TRUST_BLOCK_BG =
  `/photos/${encodeURIComponent('возрат')}/${encodeURIComponent('1.png')}`;

/** Hero страницы политики конфиденциальности. */
export const PRIVACY_LEGAL_HERO_BG =
  `/photos/${encodeURIComponent('конфиденицальность')}/${encodeURIComponent('1.png')}`;

/** Hero страницы пользовательского соглашения. */
export const TERMS_LEGAL_HERO_BG =
  `/photos/${encodeURIComponent('контракт')}/${encodeURIComponent('1.png')}`;
