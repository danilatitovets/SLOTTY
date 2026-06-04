import { z } from 'zod';
import {
  SYSTEM_COMPONENT_STATUSES,
  SYSTEM_INCIDENT_SEVERITIES,
  SYSTEM_INCIDENT_STATUSES,
  SYSTEM_MAINTENANCE_STATUSES,
} from './systemStatus.types.js';

export const patchComponentBodySchema = z.object({
  status: z.enum(SYSTEM_COMPONENT_STATUSES).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createIncidentBodySchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  severity: z.enum(SYSTEM_INCIDENT_SEVERITIES),
  affectedComponents: z.array(z.string().min(1).max(64)).min(1),
  status: z.enum(SYSTEM_INCIDENT_STATUSES).optional(),
  message: z.string().trim().max(5000).optional(),
});

export const patchIncidentBodySchema = z.object({
  status: z.enum(SYSTEM_INCIDENT_STATUSES).optional(),
  resolved: z.boolean().optional(),
});

export const incidentUpdateBodySchema = z.object({
  status: z.enum(SYSTEM_INCIDENT_STATUSES),
  message: z.string().trim().min(1).max(5000),
});

export const createMaintenanceBodySchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  affectedComponents: z.array(z.string().min(1).max(64)).min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z.enum(SYSTEM_MAINTENANCE_STATUSES).optional(),
});

export const patchMaintenanceBodySchema = z.object({
  status: z.enum(SYSTEM_MAINTENANCE_STATUSES),
});
