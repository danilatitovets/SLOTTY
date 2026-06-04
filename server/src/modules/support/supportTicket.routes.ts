import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireMasterDbAccess } from '../../middlewares/requireMasterAccess.js';
import { requireMasterPlatformWrite } from '../../middlewares/profileAccountAccess.js';
import {
  createSupportTicketBodySchema,
  replySupportTicketBodySchema,
} from './supportTicket.validation.js';
import {
  createSupportTicket,
  getSupportAccountContextForUser,
  getSupportSystemStatus,
  getSupportTicketForUser,
  listSupportTicketsForUser,
  replyToSupportTicketAsUser,
} from './supportTicket.service.js';

export const supportRouter = Router();

supportRouter.get(
  '/status',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (_req, res) => {
    res.json(await getSupportSystemStatus());
  }),
);

supportRouter.get(
  '/account-context',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    res.json(await getSupportAccountContextForUser(req.user!.id));
  }),
);

supportRouter.get(
  '/tickets',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const limit = z.coerce.number().int().min(1).max(50).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listSupportTicketsForUser(req.user!.id, { limit, offset }));
  }),
);

supportRouter.get(
  '/tickets/:ticketCode',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const ticketCode = z.string().min(5).max(32).parse(req.params.ticketCode);
    res.json({ ticket: await getSupportTicketForUser(req.user!.id, ticketCode) });
  }),
);

supportRouter.post(
  '/tickets',
  authMiddleware,
  requireMasterDbAccess,
  requireMasterPlatformWrite,
  asyncHandler(async (req, res) => {
    const body = createSupportTicketBodySchema.parse(req.body);
    const ticket = await createSupportTicket(req.user!.id, body);
    res.status(201).json({ ticket });
  }),
);

supportRouter.post(
  '/tickets/:ticketCode/reply',
  authMiddleware,
  requireMasterDbAccess,
  requireMasterPlatformWrite,
  asyncHandler(async (req, res) => {
    const ticketCode = z.string().min(5).max(32).parse(req.params.ticketCode);
    const body = replySupportTicketBodySchema.parse(req.body);
    const ticket = await replyToSupportTicketAsUser(req.user!.id, ticketCode, body.message);
    res.json({ ticket });
  }),
);
