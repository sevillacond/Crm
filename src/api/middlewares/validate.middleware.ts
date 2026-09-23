import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados de entrada inválidos',
            detalhes: err.issues.map((e) => ({
              campo: e.path.join('.'),
              mensagem: e.message
            }))
          }
        });
        return;
      }
      next(err);
    }
  };
}
