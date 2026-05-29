import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

export type SponsorRequestDto = {
  id: string;
  status: 'pending' | 'in_review' | 'closed' | 'rejected';
  contactName: string;
  phone: string;
  email: string | null;
  companyName: string | null;
  city: string | null;
  message: string;
  adminComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type CreateSponsorRequestBody = {
  contactName: string;
  phone: string;
  email?: string | null;
  companyName?: string | null;
  city?: string | null;
  message: string;
};

export async function postSponsorRequest(body: CreateSponsorRequestBody): Promise<SponsorRequestDto> {
  const res = await apiFetch('/api/masters/me/sponsor-request', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readSlottyApiErrorMessage(res));
  const data = (await res.json()) as { request: SponsorRequestDto };
  return data.request;
}

export async function fetchActiveSponsorRequest(): Promise<{
  hasActiveRequest: boolean;
  request: SponsorRequestDto | null;
}> {
  const res = await apiFetch('/api/masters/me/sponsor-request/active');
  if (!res.ok) throw new Error(await readSlottyApiErrorMessage(res));
  return (await res.json()) as { hasActiveRequest: boolean; request: SponsorRequestDto | null };
}

export type SponsorRequestCabinetState = {
  activeRequest: SponsorRequestDto | null;
  lastResolvedRequest: SponsorRequestDto | null;
  canSubmitNew: boolean;
};

export async function fetchSponsorRequestCabinetState(): Promise<SponsorRequestCabinetState> {
  const res = await apiFetch('/api/masters/me/sponsor-request/state');
  if (!res.ok) throw new Error(await readSlottyApiErrorMessage(res));
  return (await res.json()) as SponsorRequestCabinetState;
}
