import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { geoRateLimit } from '../../middlewares/rateLimit.js';
import { geoReverse, geoSearch } from './geo.service.js';

export const geoRouter = Router();

geoRouter.use(geoRateLimit);

const searchQuery = z.object({
  q: z.string().trim().min(3).max(200),
  city: z.string().trim().max(120).optional(),
});

const reverseQuery = z.object({
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
});

geoRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q, city } = searchQuery.parse(req.query);
    const results = await geoSearch(city ?? 'Минск', q);
    res.json(results);
  }),
);

geoRouter.get(
  '/reverse',
  asyncHandler(async (req, res) => {
    const { lat, lng } = reverseQuery.parse(req.query);
    const result = await geoReverse(lat, lng);
    if (!result) {
      res.status(404).json({
        error: { message: 'Адрес по координатам не найден', code: 'GEO_NOT_FOUND' },
      });
      return;
    }
    res.json(result);
  }),
);
