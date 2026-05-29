import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requirePlatformAdmin } from '../../middlewares/requirePlatformAdmin.js';
import {
  approveCategoryChangeRequest,
  listCategoryChangeRequestsForAdmin,
  rejectCategoryChangeRequest,
} from '../masters/categoryChangeRequest.service.js';
import {
  listSponsorRequestsForAdmin,
  updateSponsorRequestStatus,
  type SponsorRequestStatus,
} from '../sponsors/sponsorRequest.service.js';
import {
  listMasterProfileReportsForAdmin,
  updateMasterProfileReportStatus,
  type MasterProfileReportStatus,
} from '../masters/masterProfileReport.service.js';
import { getPlatformAdminOverview } from './platformAdmin.overview.service.js';
import { listPlatformAuditLogs } from './platformAdmin.audit.service.js';
import {
  getPlatformBooking,
  listClientBookingStats,
  listPlatformBookings,
} from './platformAdmin.bookings.service.js';
import {
  getPlatformMaster,
  hidePlatformMaster,
  listPlatformMasterPicker,
  listPlatformMasters,
  pausePlatformMaster,
  unhidePlatformMaster,
  unpausePlatformMaster,
  grantComplimentaryProToMaster,
} from './platformAdmin.masters.service.js';
import {
  hidePlatformService,
  listPlatformServices,
  unhidePlatformService,
} from './platformAdmin.services.service.js';
import {
  blockPlatformUser,
  getPlatformUser,
  listPlatformUsers,
  restrictPlatformUser,
  unblockPlatformUser,
  unrestrictPlatformUser,
} from './platformAdmin.users.service.js';
import { platformAdminMutationLimiter } from '../../middlewares/rateLimit.js';
import {
  createPromoCodeForAdmin,
  listPromoCodesForAdmin,
  setPromoCodeActiveForAdmin,
} from './platformAdmin.promo.service.js';
import {
  getPlatformPurchasesSummary,
  listPlatformPurchases,
} from './platformAdmin.purchases.service.js';

export const platformAdminRouter = Router();

platformAdminRouter.use(authMiddleware, requirePlatformAdmin);

platformAdminRouter.use((req, res, next) => {
  if (req.method === 'POST') {
    return platformAdminMutationLimiter(req, res, next);
  }
  next();
});

const reasonBody = z.object({ reason: z.string().min(1).max(2000) });
const restrictBody = z.object({
  reason: z.string().min(1).max(2000),
  until: z.string().datetime().optional().nullable(),
});
const rejectBody = z.object({ adminComment: z.string().min(1).max(2000) });

const createPromoBody = z.object({
  code: z.string().min(3).max(64),
  title: z.string().max(200).optional().nullable(),
  discountPercent: z.coerce.number().int().min(1).max(100),
  billingPeriod: z.enum(['month', 'year']).optional().nullable(),
  maxRedemptions: z.coerce.number().int().min(1).optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
});

platformAdminRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    res.json(await getPlatformAdminOverview());
  }),
);

platformAdminRouter.get(
  '/category-change-requests',
  asyncHandler(async (req, res) => {
    const status = z.enum(['all', 'pending', 'approved', 'rejected']).optional().parse(req.query.status);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listCategoryChangeRequestsForAdmin(status ?? 'all', { limit, offset }));
  }),
);

platformAdminRouter.post(
  '/category-change-requests/:id/approve',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await approveCategoryChangeRequest(id, req.user!.id, null);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/category-change-requests/:id/reject',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = rejectBody.parse(req.body);
    await rejectCategoryChangeRequest(id, req.user!.id, body.adminComment);
    res.json({ ok: true });
  }),
);

const sponsorStatusBody = z.object({
  status: z.enum(['in_review', 'closed', 'rejected']),
  adminComment: z.string().max(2000).optional().nullable(),
});

platformAdminRouter.get(
  '/sponsor-requests',
  asyncHandler(async (req, res) => {
    const status = z
      .enum(['all', 'pending', 'in_review', 'closed', 'rejected'])
      .optional()
      .parse(req.query.status);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listSponsorRequestsForAdmin(status ?? 'pending', { limit, offset }));
  }),
);

platformAdminRouter.patch(
  '/sponsor-requests/:id/status',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = sponsorStatusBody.parse(req.body);
    await updateSponsorRequestStatus(id, req.user!.id, {
      status: body.status as SponsorRequestStatus,
      adminComment: body.adminComment,
    });
    res.json({ ok: true });
  }),
);

const profileReportStatusBody = z.object({
  status: z.enum(['in_review', 'closed', 'rejected']),
  adminComment: z.string().max(2000).optional().nullable(),
});

platformAdminRouter.get(
  '/profile-reports',
  asyncHandler(async (req, res) => {
    const status = z
      .enum(['all', 'pending', 'in_review', 'closed', 'rejected'])
      .optional()
      .parse(req.query.status);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listMasterProfileReportsForAdmin(status ?? 'pending', { limit, offset }));
  }),
);

platformAdminRouter.patch(
  '/profile-reports/:id/status',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = profileReportStatusBody.parse(req.body);
    await updateMasterProfileReportStatus(id, req.user!.id, {
      status: body.status as MasterProfileReportStatus,
      adminComment: body.adminComment,
    });
    res.json({ ok: true });
  }),
);

platformAdminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = z.string().optional().parse(req.query.q as string | undefined);
    const role = z.string().optional().parse(req.query.role as string | undefined);
    const status = z.string().optional().parse(req.query.status as string | undefined);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformUsers({ q, role, status, limit, offset }));
  }),
);

platformAdminRouter.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    res.json({ user: await getPlatformUser(id) });
  }),
);

platformAdminRouter.post(
  '/users/:id/block',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = reasonBody.parse(req.body);
    await blockPlatformUser(id, req.user!.id, body.reason);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/users/:id/unblock',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await unblockPlatformUser(id, req.user!.id);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/users/:id/restrict',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = restrictBody.parse(req.body);
    await restrictPlatformUser(id, req.user!.id, body.reason, body.until ?? null);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/users/:id/unrestrict',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await unrestrictPlatformUser(id, req.user!.id);
    res.json({ ok: true });
  }),
);

platformAdminRouter.get(
  '/masters',
  asyncHandler(async (req, res) => {
    const filter = z.string().optional().parse(req.query.filter as string | undefined);
    const q = z.string().optional().parse(req.query.q as string | undefined);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformMasters({ filter, q, limit, offset }));
  }),
);

platformAdminRouter.get(
  '/masters-picker',
  asyncHandler(async (req, res) => {
    const q = z.string().optional().parse(req.query.q as string | undefined);
    res.json({ masters: await listPlatformMasterPicker(q) });
  }),
);

platformAdminRouter.get(
  '/masters/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    res.json({ master: await getPlatformMaster(id) });
  }),
);

platformAdminRouter.post(
  '/masters/:id/hide',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = reasonBody.parse(req.body);
    await hidePlatformMaster(id, req.user!.id, body.reason);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/masters/:id/unhide',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await unhidePlatformMaster(id, req.user!.id);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/masters/:id/pause',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = reasonBody.parse(req.body);
    await pausePlatformMaster(id, req.user!.id, body.reason);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/masters/:id/unpause',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await unpausePlatformMaster(id, req.user!.id);
    res.json({ ok: true });
  }),
);

const grantProBody = z.object({
  days: z.coerce.number().int().min(1).max(365),
  reason: z.string().min(3).max(2000),
});

platformAdminRouter.post(
  '/masters/:id/grant-pro',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = grantProBody.parse(req.body);
    res.json(await grantComplimentaryProToMaster(id, req.user!.id, body));
  }),
);

platformAdminRouter.get(
  '/services',
  asyncHandler(async (req, res) => {
    const filter = z.string().optional().parse(req.query.filter as string | undefined);
    const categoryId = z.string().uuid().optional().parse(req.query.categoryId as string | undefined);
    const masterId = z.string().uuid().optional().parse(req.query.masterId as string | undefined);
    const q = z.string().optional().parse(req.query.q as string | undefined);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformServices({ filter, categoryId, masterId, q, limit, offset }));
  }),
);

platformAdminRouter.post(
  '/services/:id/hide',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const body = reasonBody.parse(req.body);
    await hidePlatformService(id, req.user!.id, body.reason);
    res.json({ ok: true });
  }),
);

platformAdminRouter.post(
  '/services/:id/unhide',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await unhidePlatformService(id, req.user!.id);
    res.json({ ok: true });
  }),
);

platformAdminRouter.get(
  '/bookings',
  asyncHandler(async (req, res) => {
    const status = z.string().optional().parse(req.query.status as string | undefined);
    const period = z.string().optional().parse(req.query.period as string | undefined);
    const q = z.string().optional().parse(req.query.q as string | undefined);
    const clientId = z.string().uuid().optional().parse(req.query.clientId as string | undefined);
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformBookings({ status, period, q, clientId, limit, offset }));
  }),
);

platformAdminRouter.get(
  '/bookings-clients/stats',
  asyncHandler(async (req, res) => {
    const period = z
      .enum(['all', 'week', 'month'])
      .optional()
      .parse((req.query.period as string | undefined) ?? 'month');
    const minCancellations = z.coerce.number().int().min(1).max(50).optional().parse(req.query.minCancellations);
    const limit = z.coerce.number().int().min(1).max(50).optional().parse(req.query.limit);
    res.json(await listClientBookingStats({ period, minCancellations, limit }));
  }),
);

platformAdminRouter.get(
  '/bookings/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    res.json({ booking: await getPlatformBooking(id) });
  }),
);

platformAdminRouter.get(
  '/promo-codes',
  asyncHandler(async (_req, res) => {
    res.json({ promoCodes: await listPromoCodesForAdmin() });
  }),
);

platformAdminRouter.post(
  '/promo-codes',
  asyncHandler(async (req, res) => {
    const body = createPromoBody.parse(req.body);
    res.status(201).json({ promoCode: await createPromoCodeForAdmin(req.user!.id, body) });
  }),
);

platformAdminRouter.patch(
  '/promo-codes/:id/active',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const isActive = z.object({ isActive: z.boolean() }).parse(req.body).isActive;
    await setPromoCodeActiveForAdmin(req.user!.id, id, isActive);
    res.json({ ok: true });
  }),
);

platformAdminRouter.get(
  '/purchases/summary',
  asyncHandler(async (_req, res) => {
    res.json(await getPlatformPurchasesSummary());
  }),
);

platformAdminRouter.get(
  '/purchases',
  asyncHandler(async (req, res) => {
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformPurchases({ limit, offset }));
  }),
);

platformAdminRouter.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const limit = z.coerce.number().int().min(1).max(100).optional().parse(req.query.limit);
    const offset = z.coerce.number().int().min(0).optional().parse(req.query.offset);
    res.json(await listPlatformAuditLogs({ limit, offset }));
  }),
);
