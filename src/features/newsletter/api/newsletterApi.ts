import { apiFetch } from '../../../shared/api/backendClient';
import { readSlottyApiErrorMessage } from '../../../shared/api/slottyApiErrorMessage';

export type NewsletterSubscribeStatus = 'subscribed' | 'already_subscribed' | 'resubscribed';

export type NewsletterSubscribeResponse = {
  ok: true;
  status: NewsletterSubscribeStatus;
  message: string;
};

export async function subscribeToNewsletter(email: string): Promise<NewsletterSubscribeResponse> {
  const res = await apiFetch('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email, consentAccepted: true }),
  });
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
  return (await res.json()) as NewsletterSubscribeResponse;
}

export async function unsubscribeFromNewsletter(token: string): Promise<{ ok: true; already: boolean }> {
  const res = await apiFetch('/api/newsletter/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    throw new Error(await readSlottyApiErrorMessage(res));
  }
  return (await res.json()) as { ok: true; already: boolean };
}
