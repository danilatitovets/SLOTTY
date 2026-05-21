import jwt from 'jsonwebtoken';
import type { JwtUserRole } from '../../middlewares/auth.js';
import { env } from '../../config/env.js';

export function signAccessToken(profileId: string, role: JwtUserRole): string {
  return jwt.sign({ sub: profileId, role }, env.JWT_SECRET, { expiresIn: '7d' });
}
