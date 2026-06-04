import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { requireMasterDbAccess } from '../../middlewares/requireMasterAccess.js';
import { requireMasterPlatformWrite } from '../../middlewares/profileAccountAccess.js';
import {
  getDataExportJobStoragePath,
  isDataExportFeatureEnabled,
  listDataExportJobs,
  requestDataExport,
  retryDataExport,
} from './dataExport.service.js';
import { downloadDataExportArchive } from './dataExport.storage.js';

export const dataExportRouter = Router();

const masterAuth = [
  authMiddleware,
  requireMasterDbAccess,
  requireMasterPlatformWrite,
] as const;

dataExportRouter.get(
  '/capabilities',
  ...masterAuth,
  asyncHandler(async (_req, res) => {
    res.json({ available: isDataExportFeatureEnabled() });
  }),
);

dataExportRouter.post(
  '/request',
  ...masterAuth,
  asyncHandler(async (req, res) => {
    const job = await requestDataExport(req.user!.id);
    res.status(201).json({ job });
  }),
);

dataExportRouter.get(
  '/jobs',
  ...masterAuth,
  asyncHandler(async (req, res) => {
    const jobs = await listDataExportJobs(req.user!.id);
    res.json({ jobs });
  }),
);

dataExportRouter.post(
  '/jobs/:id/retry',
  ...masterAuth,
  asyncHandler(async (req, res) => {
    const job = await retryDataExport(req.user!.id, req.params.id);
    res.json({ job });
  }),
);

dataExportRouter.get(
  '/jobs/:id/download',
  ...masterAuth,
  asyncHandler(async (req, res) => {
    const { storagePath, filename } = await getDataExportJobStoragePath(req.user!.id, req.params.id);
    const buffer = await downloadDataExportArchive(storagePath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.send(buffer);
  }),
);
