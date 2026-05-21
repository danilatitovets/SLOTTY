import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middlewares/auth.js';
import {
  linkEmail,
  linkGoogle,
  linkTelegram,
  loginWithEmail,
  loginWithGoogle,
  loginWithTelegram,
} from './auth.service.js';
import { listAuthIdentitiesForProfile } from './authIdentities.service.js';
import {
  requestPasswordReset,
  resetPasswordWithToken,
  sendVerificationEmailByAddress,
  sendVerificationEmailForProfile,
  verifyEmailWithToken,
} from './email/emailAuth.service.js';

export const authRouter = Router();

const telegramBody = z.object({
  initDataRaw: z.string().min(1, 'initDataRaw is required'),
});

const googleBody = z.object({
  idToken: z.string().min(1, 'idToken is required'),
});

const emailLoginBody = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль минимум 8 символов'),
});

const emailLinkBody = emailLoginBody;

const tokenBody = z.object({
  token: z.string().min(1, 'token is required'),
});

const resetPasswordBody = z.object({
  token: z.string().min(1, 'token is required'),
  password: z.string().min(8, 'Пароль минимум 8 символов'),
});

const sendVerificationBody = z.object({
  email: z.string().email('Введите корректный email').optional(),
});

const forgotPasswordBody = z.object({
  email: z.string().email('Введите корректный email'),
});

authRouter.post(
  '/telegram',
  asyncHandler(async (req, res) => {
    const body = telegramBody.parse(req.body);
    const out = await loginWithTelegram(body.initDataRaw);
    res.json(out);
  }),
);

authRouter.post(
  '/google',
  asyncHandler(async (req, res) => {
    const body = googleBody.parse(req.body);
    const out = await loginWithGoogle(body.idToken);
    res.json(out);
  }),
);

authRouter.post(
  '/email/login',
  asyncHandler(async (req, res) => {
    const body = emailLoginBody.parse(req.body);
    const out = await loginWithEmail(body.email, body.password);
    res.json(out);
  }),
);

authRouter.post(
  '/email/register',
  asyncHandler(async (req, res) => {
    const body = emailLoginBody.parse(req.body);
    const out = await loginWithEmail(body.email, body.password);
    res.json(out);
  }),
);

authRouter.get(
  '/identities',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const identities = await listAuthIdentitiesForProfile(req.user!.id);
    res.json({ identities });
  }),
);

authRouter.post(
  '/link/telegram',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body = telegramBody.parse(req.body);
    const out = await linkTelegram(body.initDataRaw, req.user!.id);
    res.json(out);
  }),
);

authRouter.post(
  '/link/google',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body = googleBody.parse(req.body);
    const out = await linkGoogle(body.idToken, req.user!.id);
    res.json(out);
  }),
);

authRouter.post(
  '/link/email',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body = emailLinkBody.parse(req.body);
    const out = await linkEmail(body.email, body.password, req.user!.id);
    res.json(out);
  }),
);

authRouter.post(
  '/email/send-verification',
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const body = sendVerificationBody.parse(req.body ?? {});
    if (req.user?.id) {
      const out = await sendVerificationEmailForProfile(req.user.id);
      res.json({ ok: true, sent: out.sent });
      return;
    }
    if (!body.email) {
      throw ApiError.badRequest('Укажите email или войдите в аккаунт', 'EMAIL_REQUIRED');
    }
    const out = await sendVerificationEmailByAddress(body.email);
    res.json({ ok: true, sent: out.sent });
  }),
);

authRouter.post(
  '/email/verify',
  asyncHandler(async (req, res) => {
    const body = tokenBody.parse(req.body);
    await verifyEmailWithToken(body.token);
    res.json({ ok: true, verified: true });
  }),
);

authRouter.post(
  '/email/forgot-password',
  asyncHandler(async (req, res) => {
    const body = forgotPasswordBody.parse(req.body);
    await requestPasswordReset(body.email);
    res.json({
      ok: true,
      message: 'Если аккаунт с этим email существует, мы отправили ссылку для сброса пароля.',
    });
  }),
);

authRouter.post(
  '/email/reset-password',
  asyncHandler(async (req, res) => {
    const body = resetPasswordBody.parse(req.body);
    await resetPasswordWithToken(body.token, body.password);
    res.json({ ok: true });
  }),
);
