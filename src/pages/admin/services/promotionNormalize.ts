import { buildDiscountLabel, getPromotionTemplate, isPromotionTemplateId, parseDiscountLabel } from './promotionTemplates';
import type { ServicePromotion, ServicePromotionDiscountType, ServicePromotionTemplate } from './servicesTypes';

function defaultTemplate(): ServicePromotionTemplate {
  return 'first_visit';
}

export function normalizePromotion(raw: Partial<ServicePromotion> & { id: string }): ServicePromotion {
  const template: ServicePromotionTemplate = isPromotionTemplateId(String(raw.template ?? ''))
    ? (raw.template as ServicePromotionTemplate)
    : defaultTemplate();

  const tpl = getPromotionTemplate(template)!;
  const parsed = raw.discountLabel
    ? parseDiscountLabel(raw.discountLabel)
    : {
        type: (raw.discountType ?? tpl.defaultDiscountType) as ServicePromotionDiscountType,
        value: Number.isFinite(raw.discountValue) ? Number(raw.discountValue) : tpl.defaultDiscountValue,
      };

  const discountType = parsed.type;
  const discountValue = parsed.value;
  const discountLabel =
    raw.discountLabel?.trim() || buildDiscountLabel(discountType, discountValue);

  return {
    id: raw.id,
    template,
    title: raw.title?.trim() || tpl.title,
    description: raw.description?.trim() || tpl.description,
    serviceId: raw.serviceId ?? '',
    serviceTitle: raw.serviceTitle?.trim() ?? '',
    discountType,
    discountValue,
    discountLabel,
    startsAt: raw.startsAt ?? '',
    endsAt: raw.endsAt ?? '',
    status: raw.status ?? 'draft',
    backgroundImage: raw.backgroundImage?.trim() || raw.imageUrl?.trim() || tpl.backgroundImage,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    bundleId: raw.bundleId,
    imageUrl: raw.imageUrl,
    imageSource: raw.imageSource,
  };
}
