import { Resend } from 'resend';
import { env } from '../../../config/env.js';

const DEFAULT_FROM = 'SLOTTY <onboarding@resend.dev>';

export type SendMailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendSlottyEmail(params: SendMailParams): Promise<void> {
  const from = env.RESEND_FROM?.trim() || DEFAULT_FROM;
  const apiKey = env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.info('[SLOTTY email:dev]', {
      to: params.to,
      subject: params.subject,
      preview: params.html.replace(/\s+/g, ' ').slice(0, 120) + '…',
      links: extractLinks(params.html),
    });
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    console.error('[SLOTTY email] Resend error:', error);
    throw new Error(error.message || 'Failed to send email');
  }
}

function extractLinks(html: string): string[] {
  const links: string[] = [];
  const re = /href="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1].startsWith('http')) links.push(m[1]);
  }
  return links;
}
