import { HttpStatus, NestMiddleware } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

export class BasicAuthMiddleware implements NestMiddleware {
  private readonly username = 'user';

  private readonly password = 'password';

  private readonly encodedCreds = Buffer.from(`${this.username}:${this.password}`).toString(
    'base64',
  );

  use(req: FastifyRequest, res: FastifyReply, next: () => void): void {
    const reqCreds = req.headers.authorization?.split('Basic ')?.[1] ?? null;

    if (!reqCreds || reqCreds !== this.encodedCreds) {
      res.status(HttpStatus.UNAUTHORIZED).send();
    }

    next();
  }
}
