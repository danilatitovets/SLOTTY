import { useQuery } from '@tanstack/react-query';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import {
  fetchPublishedMasters,
  publishedMasterToListingRecord,
} from '../../services/api/publishedMastersApi';
import type { ServiceListingRecord } from '../../services/model/demoMasters';

export function useMastersFeed() {
  return useQuery({
    queryKey: ['masters-feed', 'published'],
    queryFn: async (): Promise<ServiceListingRecord[]> => {
      if (!getApiBaseUrl()) return [];
      const masters = await fetchPublishedMasters({ limit: 24 });
      return masters.map(publishedMasterToListingRecord);
    },
  });
}
