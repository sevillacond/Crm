import { Router, Request, Response } from 'express';
import { viabilidadeService } from '../../modules/viabilidade/viabilidade.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { validateBody } from '../middlewares/validate.middleware.ts';
import { consultarViabilidadeSchema } from '../validators/viabilidade.validator.ts';

const router = Router();

// POST /api/viabilidade and /api/viabilidade/consultar
const handler = async (req: Request, res: Response, next: any) => {
  try {
    const { cep, numero, logradouro, bairro, cidade, uf, contatoId } = req.body;
    const actor = req.user!;

    const result = await viabilidadeService.consultar(
      { cep, numero, logradouro, bairro, cidade, uf },
      contatoId,
      actor
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

router.post('/', authMiddleware, validateBody(consultarViabilidadeSchema), handler);
router.post('/consultar', authMiddleware, validateBody(consultarViabilidadeSchema), handler);

export const viabilidadeRoutes = router;
