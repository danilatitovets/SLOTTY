import { Resend } from 'resend';
import { resolveResendFrom } from '../../email/emailConfig.js';
import { env } from '../../../config/env.js';

export type SendMailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendMailResult = {
  messageId: string | null;
  devLogged: boolean;
};

export async function sendSlottyEmail(params: SendMailParams): Promise<SendMailResult> {
  return sendSlottyEmailDetailed(params);
}

export async function sendSlottyEmailDetailed(params: SendMailParams): Promise<SendMailResult> {
  const from = resolveResendFrom();
  const apiKey = env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.info('[SLOTTY email:dev]', {
      to: params.to,
      subject: params.subject,
      preview: params.html.replace(/\s+/g, ' ').slice(0, 120) + '…',
      links: extractLinks(params.html),
    });
    return { messageId: null, devLogged: true };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    console.error('[SLOTTY email] Resend error:', error);
    throw new Error(error.message || 'Failed to send email');
  }

  return { messageId: data?.id ?? null, devLogged: false };
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
