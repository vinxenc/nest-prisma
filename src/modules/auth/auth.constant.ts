import { env } from '@common';

export const saltRounds = 12;
export const expiresIn = 60 * 1000 * 30;
export const jwtSecretKey = env.JWT_SECRET_KEY;
