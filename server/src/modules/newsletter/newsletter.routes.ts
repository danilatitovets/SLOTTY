import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { newsletterSubscribeLimiter } from '../../middlewares/rateLimit.js';
import { subscribeToNewsletter, unsubscribeFromNewsletter } from './newsletter.service.js';

export const newsletterRouter = Router();

const subscribeBody = z.object({
  email: z.string().min(3).max(320),
  consentAccepted: z.literal(true),
});

newsletterRouter.post(
  '/subscribe',
  newsletterSubscribeLimiter,
  asyncHandler(async (req, res) => {
    const body = subscribeBody.parse(req.body);
    const result = await subscribeToNewsletter({
      emailRaw: body.email,
      consentAccepted: body.consentAccepted,
      source: 'footer',
      req,
    });
    res.json(result);
  }),
);

const unsubscribeBody = z.object({
  token: z.string().min(16).max(128),
});

newsletterRouter.post(
  '/unsubscribe',
  asyncHandler(async (req, res) => {
    const body = unsubscribeBody.parse(req.body);
    const result = await unsubscribeFromNewsletter(body.token);
    res.json(result);
  }),
);
