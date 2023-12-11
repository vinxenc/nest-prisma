import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { env } from '@common';

export const saltRounds = 12;
export const expiresIn = 60 * 1000 * 30;
export const jwtSecretKey = env.JWT_SECRET_KEY;

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): CustomDecorator<string> => SetMetadata(IS_PUBLIC_KEY, true);
