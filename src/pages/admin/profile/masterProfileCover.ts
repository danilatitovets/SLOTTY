import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import {
  createPortfolioItem,
  updatePortfolioItem,
} from '../../../features/admin/api/adminProfileApi';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { uploadMasterPortfolioImageFile } from '../../../features/admin/api/masterCabinetApi';
import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import { masterListingPortraitUrl } from '../../../features/masters/lib/masterListingPortrait';
import {
  MASTER_PROFILE_COVER_TITLE,
} from '../../../features/admin/lib/masterPortfolioCover';
import { patchMasterMe } from '../../../features/admin/api/masterCabinetApi';
import type { MasterDraft, MasterPortfolioItem } from '../../../features/profile/lib/demoMasterStorage';

export { MASTER_PROFILE_COVER_TITLE };

async function persistPortfolioCoverIdToServer(coverItemId: string | undefined): Promise<void> {
  if (!coverItemId?.trim()) return;
  await patchMasterMe({ portfolioCoverItemId: coverItemId.trim() });
}

export function resolveCoverUrl(draft: MasterDraft): string | null {
  const coverId = draft.portfolioCoverId?.trim();
  if (coverId) {
    const item = draft.portfolio?.find((p) => p.id === coverId);
    const url = item?.imageUrl?.trim();
    if (url) return url;
  }
  const photo = masterListingPortraitUrl(draft.photoUrl);
  return photo || null;
}

function localCoverItemId(): string {
  return `cover_${Date.now()}`;
}

export async function applyMasterCoverFromFile(
  draft: MasterDraft,
  file: File,
  useCabinetApi: boolean,
): Promise<MasterDraft> {
  const portfolio = [...(draft.portfolio ?? [])];
  const coverId = draft.portfolioCoverId?.trim();
  const existingIndex = coverId ? portfolio.findIndex((p) => p.id === coverId) : -1;

  if (useCabinetApi) {
    const imageUrl = await uploadMasterPortfolioImageFile(file);

    if (existingIndex >= 0 && isUuid(portfolio[existingIndex].id)) {
      await updatePortfolioItem(portfolio[existingIndex].id, { imageUrl });
      const updated: MasterPortfolioItem = {
        ...portfolio[existingIndex],
        imageUrl,
        title: portfolio[existingIndex].title ?? MASTER_PROFILE_COVER_TITLE,
      };
      portfolio[existingIndex] = updated;
      return { ...draft, portfolio, portfolioCoverId: updated.id };
    }

    const created = await createPortfolioItem({
      imageUrl,
      title: MASTER_PROFILE_COVER_TITLE,
      sortOrder: 0,
    });
    const item: MasterPortfolioItem = {
      id: created.id,
      imageUrl: created.imageUrl,
      title: created.title ?? MASTER_PROFILE_COVER_TITLE,
    };
    const withoutDup = portfolio.filter((p) => p.id !== item.id);
    return {
      ...draft,
      portfolio: [item, ...withoutDup],
      portfolioCoverId: item.id,
    };
  }

  const imageUrl = URL.createObjectURL(file);
  const id = existingIndex >= 0 ? portfolio[existingIndex].id : localCoverItemId();
  const item: MasterPortfolioItem = {
    id,
    imageUrl,
    title: MASTER_PROFILE_COVER_TITLE,
  };
  if (existingIndex >= 0) {
    portfolio[existingIndex] = item;
  } else {
    portfolio.unshift(item);
  }
  return { ...draft, portfolio, portfolioCoverId: id };
}

export function useMasterCoverUpload() {
  const { draft, persistDraft, commitDraftBaseline, refreshDraft, useCabinetApi } =
    useAdminMasterCabinet();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const onCoverFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file || !file.type.startsWith('image/')) return;
      setCoverBusy(true);
      setCoverError(null);
      try {
        const next = await applyMasterCoverFromFile(draft, file, useCabinetApi);
        if (useCabinetApi) {
          await persistPortfolioCoverIdToServer(next.portfolioCoverId);
          commitDraftBaseline(next);
          persistDraft(next);
          await refreshDraft();
        } else {
          persistDraft(next);
        }
      } catch (e) {
        setCoverError(e instanceof Error ? e.message : 'Не удалось загрузить обложку');
      } finally {
        setCoverBusy(false);
      }
    },
    [commitDraftBaseline, draft, persistDraft, refreshDraft, useCabinetApi],
  );

  const pickCover = useCallback(() => {
    coverInputRef.current?.click();
  }, []);

  return { coverInputRef, coverBusy, coverError, onCoverFileChange, pickCover };
}
