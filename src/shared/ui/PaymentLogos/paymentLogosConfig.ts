export type PaymentMethodId = 'bepaid' | 'erip' | 'visa' | 'mastercard' | 'belkart';

export type PaymentMethodConfig = {
  id: PaymentMethodId;
  label: string;
  caption: string;
  /** Public URL under `/images/payment/`. */
  src: string;
  /** When true, replace SVG with official asset from brand kit (see public/images/payment/README.md). */
  isPlaceholderAsset?: boolean;
};

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'bepaid',
    label: 'bePaid',
    caption: 'Платёжный провайдер',
    src: '/images/payment/bepaid.svg',
    isPlaceholderAsset: true,
  },
  {
    id: 'erip',
    label: 'ЕРИП',
    caption: 'Оплата через ЕРИП',
    src: '/images/payment/erip.svg',
    isPlaceholderAsset: true,
  },
  {
    id: 'visa',
    label: 'Visa',
    caption: 'Банковские карты',
    src: '/images/payment/visa.svg',
  },
  {
    id: 'mastercard',
    label: 'Mastercard',
    caption: 'Банковские карты',
    src: '/images/payment/mastercard.svg',
  },
  {
    id: 'belkart',
    label: 'Белкарт',
    caption: 'Карты Беларуси',
    src: '/images/payment/belkart.svg',
    isPlaceholderAsset: true,
  },
];

export const PAYMENT_DISCLAIMER_DEFAULT =
  'Планируемые способы оплаты. Онлайн-оплата на сайте появится после подключения платёжного провайдера. Финальный список будет указан при оформлении.';

export const PAYMENT_DISCLAIMER_SHORT =
  'Планируемые способы оплаты. Доступные методы будут показаны при оформлении после подключения провайдера.';
