import type { ServicePromotionDiscountType, ServicePromotionTemplate } from './servicesTypes';

export type PromotionTemplateId = Extract<
  ServicePromotionTemplate,
  'first_visit' | 'weekly_combo' | 'seasonal' | 'happy_hours'
>;

export type PromotionTemplateDef = {
  id: PromotionTemplateId;
  title: string;
  description: string;
  defaultDiscountLabel: string;
  defaultDiscountType: ServicePromotionDiscountType;
  defaultDiscountValue: number;
  backgroundImage: string;
};

export const PROMOTION_TEMPLATES: PromotionTemplateDef[] = [
  {
    id: 'first_visit',
    title: 'Скидка на первый визит',
    description: 'Для новых клиентов',
    defaultDiscountLabel: '-15%',
    defaultDiscountType: 'percent',
    defaultDiscountValue: 15,
    backgroundImage: '/photos/sale/11.webp',
  },
  {
    id: 'weekly_combo',
    title: 'Комплекс недели',
    description: 'Выгодное предложение на услугу',
    defaultDiscountLabel: '-20%',
    defaultDiscountType: 'percent',
    defaultDiscountValue: 20,
    backgroundImage: '/photos/sale/22.webp',
  },
  {
    id: 'seasonal',
    title: 'Сезонная акция',
    description: 'Спецпредложение на выбранный период',
    defaultDiscountLabel: '-30%',
    defaultDiscountType: 'percent',
    defaultDiscountValue: 30,
    backgroundImage: '/photos/sale/33.webp',
  },
  {
    id: 'happy_hours',
    title: 'Счастливые часы',
    description: 'Скидка в свободные часы',
    defaultDiscountLabel: '-10%',
    defaultDiscountType: 'percent',
    defaultDiscountValue: 10,
    backgroundImage: '/photos/sale/44.webp',
  },
];

const TEMPLATE_BY_ID = new Map(PROMOTION_TEMPLATES.map((t) => [t.id, t]));

export function getPromotionTemplate(id: string): PromotionTemplateDef | undefined {
  if (TEMPLATE_BY_ID.has(id as PromotionTemplateId)) {
    return TEMPLATE_BY_ID.get(id as PromotionTemplateId);
  }
  return PROMOTION_TEMPLATES[0];
}

export function isPromotionTemplateId(id: string): id is PromotionTemplateId {
  return TEMPLATE_BY_ID.has(id as PromotionTemplateId);
}

export function buildDiscountLabel(
  type: ServicePromotionDiscountType,
  value: number,
): string {
  if (type === 'gift') return 'Подарок';
  if (type === 'money') return `-${Math.max(0, value)} BYN`;
  const pct = Math.min(99, Math.max(0, Math.round(value)));
  return `-${pct}%`;
}

export function parseDiscountLabel(label: string): {
  type: ServicePromotionDiscountType;
  value: number;
} {
  const trimmed = label.trim();
  if (/подарок/i.test(trimmed)) return { type: 'gift', value: 0 };
  const byn = trimmed.match(/-?\s*(\d+(?:[.,]\d+)?)\s*byn/i);
  if (byn) return { type: 'money', value: Number.parseFloat(byn[1].replace(',', '.')) };
  const pct = trimmed.match(/-?\s*(\d+)\s*%/);
  if (pct) return { type: 'percent', value: Number.parseInt(pct[1], 10) };
  return { type: 'percent', value: 15 };
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
