import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { RequestContextService } from './request-context.service';

export function createRequestContextMiddleware(
  requestContextService: RequestContextService,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = randomUUID();
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    requestContextService.run({ requestId }, next);
  };
}
