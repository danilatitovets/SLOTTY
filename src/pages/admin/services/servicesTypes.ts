export type ServicesTabId = 'catalog' | 'price' | 'bundles' | 'promotions';

export type ServicePromotionTemplate =
  | 'first_visit'
  | 'weekly_combo'
  | 'seasonal'
  | 'happy_hours'
  /** @deprecated legacy stored promos */
  | 'percent'
  | 'bundle'
  | 'gift';

export type ServicePromotionStatus = 'active' | 'scheduled' | 'finished' | 'draft';

export type ServicePromotionDiscountType = 'percent' | 'money' | 'gift';

/** @deprecated legacy */
export type ServicePromotionImageSource = 'service' | 'portfolio' | 'upload' | 'template';

export type ServicePromotion = {
  id: string;
  template: ServicePromotionTemplate;
  title: string;
  description: string;
  serviceId: string;
  serviceTitle: string;
  discountType: ServicePromotionDiscountType;
  discountValue: number;
  discountLabel: string;
  startsAt: string;
  endsAt: string;
  status: ServicePromotionStatus;
  backgroundImage: string;
  createdAt: string;
  /** @deprecated */
  bundleId?: string;
  imageUrl?: string;
  imageSource?: ServicePromotionImageSource;
};

export type ServiceBundle = {
  id: string;
  title: string;
  serviceIds: string[];
  priceByn: number;
  oldPriceByn: number;
  imageUrl?: string;
  isActive: boolean;
};

export const SERVICES_TAB_SUBTITLES: Record<ServicesTabId, string> = {
  catalog: 'Каталог ваших услуг и управление',
  price: 'Цена и длительность услуг',
  bundles: 'Пакеты услуг и выгодные предложения',
  promotions: 'Создавайте специальные предложения для клиентов',
};
