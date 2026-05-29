import type { MasterPortfolioItem } from '../../profile/lib/demoMasterStorage';

export const MASTER_PROFILE_COVER_TITLE = 'Обложка профиля';

/** ID обложки из БД или по заголовку служебного элемента портфолио (старые загрузки). */
export function resolvePortfolioCoverId(
  portfolio: MasterPortfolioItem[] | undefined,
  serverCoverItemId?: string | null,
): string | undefined {
  const items = portfolio ?? [];
  const fromServer = serverCoverItemId?.trim();
  if (fromServer && items.some((p) => p.id === fromServer)) return fromServer;
  const byTitle = items.find((p) => p.title?.trim() === MASTER_PROFILE_COVER_TITLE);
  return byTitle?.id;
}
