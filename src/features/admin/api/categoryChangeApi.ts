import { apiFetch } from '../../../shared/api/backendClient';
import type { CategoryChangePolicyDto, CategoryChangeRequestDto } from '../lib/categoryChangePolicy';

const CATEGORY_CHANGE_MESSAGES: Record<string, string> = {
  active_request_exists: 'У вас уже есть заявка на смену категории.',
  same_category: 'Выберите категорию, отличную от текущей.',
  category_change_requires_request:
    'Для активного профиля смена категории проходит через заявку.',
  category_change_not_required: 'Категорию можно изменить сразу в профиле.',
};

export async function readCategoryChangeApiError(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
  const code = j?.error?.code;
  if (code && CATEGORY_CHANGE_MESSAGES[code]) return CATEGORY_CHANGE_MESSAGES[code];
  if (j?.error?.message) return j.error.message;
  return `Ошибка ${res.status}`;
}

export async function postCategoryChangeRequest(body: {
  requestedCategoryId: string;
  reason: string;
}): Promise<CategoryChangeRequestDto> {
  const res = await apiFetch('/api/masters/me/category-change-request', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readCategoryChangeApiError(res));
  const j = (await res.json()) as { request: CategoryChangeRequestDto };
  return j.request;
}

export async function fetchActiveCategoryChangeRequest(): Promise<{
  hasActiveRequest: boolean;
  request: CategoryChangeRequestDto | null;
}> {
  const res = await apiFetch('/api/masters/me/category-change-request/active');
  if (!res.ok) throw new Error(await readCategoryChangeApiError(res));
  return (await res.json()) as { hasActiveRequest: boolean; request: CategoryChangeRequestDto | null };
}

export type { CategoryChangePolicyDto };
