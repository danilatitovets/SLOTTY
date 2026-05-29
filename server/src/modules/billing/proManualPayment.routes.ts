import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireMasterDbAccess } from '../../middlewares/requireMasterAccess.js';
import { requireMasterPlatformWrite } from '../../middlewares/profileAccountAccess.js';
import { masterProPaymentRequestLimiter } from '../../middlewares/rateLimit.js';
import {
  createProManualPaymentRequest,
  getManualPaymentConfigForMaster,
  getProManualPaymentCabinetState,
  listProManualPaymentRequestsForMaster,
} from './proManualPayment.service.js';
import { uploadProPaymentReceipt } from './proManualPayment.storage.js';

export const proManualPaymentRouter = Router();

const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const createBody = z
  .object({
    payerFullName: z.string().min(2).max(200),
    declaredPaidAmount: z.coerce.number().positive().max(999_999.99),
    billingPeriod: z.enum(['month', 'year']).optional().default('month'),
    paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    paymentComment: z.string().min(5).max(4000),
    receiptUrl: z.string().url().max(2000).optional().nullable(),
    receiptFilePath: z.string().max(500).optional().nullable(),
    confirmationChecked: z.literal(true),
  })
  .strict();

const stateQuery = z.object({
  billingPeriod: z.enum(['month', 'year']).optional(),
});

proManualPaymentRouter.get(
  '/me/billing/manual-payment-config',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    res.json({ config: await getManualPaymentConfigForMaster(req.user!.id) });
  }),
);

proManualPaymentRouter.get(
  '/me/billing/manual-payment-requests',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    res.json(await listProManualPaymentRequestsForMaster(req.user!.id));
  }),
);

proManualPaymentRouter.post(
  '/me/billing/manual-payment-requests',
  authMiddleware,
  requireMasterDbAccess,
  requireMasterPlatformWrite,
  masterProPaymentRequestLimiter,
  asyncHandler(async (req, res) => {
    const body = createBody.parse(req.body);
    const request = await createProManualPaymentRequest(req.user!.id, body);
    res.status(201).json({ request });
  }),
);

proManualPaymentRouter.post(
  '/me/billing/manual-payment-requests/receipt',
  authMiddleware,
  requireMasterDbAccess,
  requireMasterPlatformWrite,
  receiptUpload.single('receipt'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Файл не получен' });
      return;
    }
    const receipt = await uploadProPaymentReceipt(req.user!.id, file.buffer, file.mimetype);
    res.status(201).json({ receipt });
  }),
);

proManualPaymentRouter.get(
  '/me/pro-payment/state',
  authMiddleware,
  requireMasterDbAccess,
  asyncHandler(async (req, res) => {
    const q = stateQuery.parse(req.query);
    res.json(await getProManualPaymentCabinetState(req.user!.id, q.billingPeriod ?? 'month'));
  }),
);

proManualPaymentRouter.post(
  '/me/pro-payment/request',
  authMiddleware,
  requireMasterDbAccess,
  requireMasterPlatformWrite,
  masterProPaymentRequestLimiter,
  asyncHandler(async (req, res) => {
    const body = createBody.parse(req.body);
    const request = await createProManualPaymentRequest(req.user!.id, body);
    res.status(201).json({ request });
  }),
);
