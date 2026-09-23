import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId || crypto.randomUUID();
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  // Log detailed error on server console without leaking to client
  console.error(`[Error][${requestId}] ${err.message}`, err.stack);

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: err.isOperational ? err.message : 'Ocorreu um erro interno no processamento da solicitação.',
      requestId
    }
  });
}
