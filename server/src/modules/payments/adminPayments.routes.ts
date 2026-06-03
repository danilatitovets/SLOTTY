import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requirePlatformAdmin } from '../../middlewares/requirePlatformAdmin.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  getPaymentById,
  listPaymentStatusEvents,
  listPaymentsForAdmin,
  paymentProviderPayloadForAdmin,
} from './payments.service.js';
import type { PaymentStatus, PaymentType } from './payment.types.js';

export const adminPaymentsRouter = Router();

adminPaymentsRouter.use(authMiddleware, requirePlatformAdmin);

const listQuery = z.object({
  status: z
    .enum(['pending', 'success', 'failed', 'expired', 'cancelled', 'refunded'])
    .optional(),
  type: z.enum(['master_pro_plan', 'appointment_prepayment']).optional(),
  profileId: z.string().uuid().optional(),
  provider: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

adminPaymentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = listQuery.parse(req.query);
    const result = await listPaymentsForAdmin({
      status: q.status as PaymentStatus | undefined,
      type: q.type as PaymentType | undefined,
      profileId: q.profileId,
      provider: q.provider,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      amountMin: q.amountMin,
      amountMax: q.amountMax,
      page: q.page,
      pageSize: q.pageSize,
    });
    res.json(result);
  }),
);

adminPaymentsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const payment = await getPaymentById(id);
    if (!payment) {
      throw ApiError.notFound('Платёж не найден', 'PAYMENT_NOT_FOUND');
    }
    const events = await listPaymentStatusEvents(id);
    res.json({
      payment: {
        ...payment,
        providerPayload: paymentProviderPayloadForAdmin(payment.providerPayload ?? null),
      },
      events,
    });
  }),
);
