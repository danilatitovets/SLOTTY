export type PaymentMethodId = 'bepaid' | 'erip' | 'visa' | 'mastercard' | 'belkart';

/** Логотипы платёжных систем в `public/photos/pay/`. */
export const PAYMENT_PHOTO_ASSETS = {
  bepaid: '/photos/pay/BePaid_idGp8jSDbK_0.webp',
  erip: '/photos/pay/ерип.svg',
  visa: '/photos/pay/Visa-Logo-PNG-Pic.webp',
  mastercard: '/photos/pay/ma_symbol.svg',
  belkart: '/photos/pay/belcart.webp',
} as const;

export type PaymentMethodConfig = {
  id: PaymentMethodId;
  label: string;
  caption: string;
  src: string;
};

/** Доп. классы: у Visa в файле лишний прозрачный низ — подтягиваем визуально. */
export function paymentLogoImageClass(id: PaymentMethodId): string {
  const base = 'block max-w-full object-contain';
  if (id === 'visa') return `${base} object-center -mb-2 sm:-mb-2.5`;
  return `${base} object-center`;
}

/** Компактная строка (футер, блоки доверия). */
export function paymentLogoCompactHeightClass(id: PaymentMethodId): string {
  switch (id) {
    case 'visa':
      return 'h-8 w-auto max-w-[5.25rem] sm:h-9 sm:max-w-[6rem]';
    case 'mastercard':
      return 'h-7 w-auto max-w-[3.25rem] sm:h-8';
    case 'bepaid':
      return 'h-7 w-auto max-w-[5.75rem] sm:h-8 sm:max-w-[6.5rem]';
    case 'belkart':
      return 'h-7 w-auto max-w-[6.5rem] sm:h-8';
    case 'erip':
      return 'h-7 w-auto max-w-[5rem] sm:h-8';
    default:
      return 'h-7 w-auto max-w-[5rem] sm:h-8';
  }
}

/** Высота логотипа в карточке / ленте (`object-contain`). */
export function paymentLogoHeightClass(id: PaymentMethodId): string {
  switch (id) {
    case 'visa':
      return 'h-12 w-auto max-w-[11rem] sm:h-14 sm:max-w-[13rem]';
    case 'mastercard':
      return 'h-12 w-auto max-w-[5.5rem] sm:h-14 sm:max-w-[6.5rem]';
    case 'bepaid':
      return 'h-10 w-auto max-w-[9.5rem] sm:h-11 sm:max-w-[10.5rem]';
    case 'belkart':
      return 'h-10 w-auto max-w-[9rem] sm:h-11 sm:max-w-[10rem]';
    case 'erip':
      return 'h-9 w-auto max-w-[8.5rem] sm:h-10 sm:max-w-[9.5rem]';
    default:
      return 'h-10 w-auto max-w-[9.5rem] sm:h-12 sm:max-w-[11rem]';
  }
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'bepaid',
    label: 'bePaid',
    caption: 'Платёжный провайдер',
    src: PAYMENT_PHOTO_ASSETS.bepaid,
  },
  {
    id: 'erip',
    label: 'ЕРИП',
    caption: 'Оплата через ЕРИП',
    src: PAYMENT_PHOTO_ASSETS.erip,
  },
  {
    id: 'visa',
    label: 'Visa',
    caption: 'Банковские карты',
    src: PAYMENT_PHOTO_ASSETS.visa,
  },
  {
    id: 'mastercard',
    label: 'Mastercard',
    caption: 'Банковские карты',
    src: PAYMENT_PHOTO_ASSETS.mastercard,
  },
  {
    id: 'belkart',
    label: 'Белкарт',
    caption: 'Карты Беларуси',
    src: PAYMENT_PHOTO_ASSETS.belkart,
  },
];

export const PAYMENT_DISCLAIMER_DEFAULT =
  'Планируемые способы оплаты. Онлайн-оплата на сайте появится после подключения платёжного провайдера. Финальный список будет указан при оформлении.';

/** Страница `/legal/payment` — bePaid подключён. */
export const PAYMENT_DISCLAIMER_LEGAL_PAGE =
  'Оплата проходит через bePaid. Точный список способов оплаты отображается при оформлении заказа или подписки.';

export const PAYMENT_DISCLAIMER_SHORT =
  'Планируемые способы оплаты. Доступные методы будут показаны при оформлении после подключения провайдера.';
