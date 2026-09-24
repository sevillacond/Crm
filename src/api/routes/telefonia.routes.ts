import { Router, Request, Response } from 'express';
import { telefoniaService } from '../../modules/telefonia/telefonia.service.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';

const router = Router();

// Listar chamadas da instância
router.get('/chamadas', authMiddleware, async (req: Request, res: Response) => {
  try {
    const actor = req.actor!;
    const chamadas = await telefoniaService.getChamadas(actor.instanceId);
    return res.json({ chamadas });
  } catch (err: any) {
    return res.status(400).json({ error: { message: err.message } });
  }
});

// Registrar chamada telefônica finalizada
router.post('/chamadas', authMiddleware, async (req: Request, res: Response) => {
  try {
    const actor = req.actor!;
    const { ramalOrigem, numeroDestino, nomeContato, contatoId, direcao, status, duracaoSegundos, notasOperador } = req.body;
    
    if (!numeroDestino) {
      return res.status(400).json({ error: { message: 'numeroDestino é obrigatório.' } });
    }

    const chamada = await telefoniaService.registrarChamada({
      ramalOrigem: ramalOrigem || 'Ramal SIP WebRTC',
      numeroDestino,
      nomeContato,
      contatoId,
      direcao: direcao || 'SAINTE',
      status: status || 'ATENDIDA',
      duracaoSegundos: duracaoSegundos || 0,
      iniciadaEm: new Date(Date.now() - (duracaoSegundos || 0) * 1000).toISOString(),
      finalizadaEm: new Date().toISOString(),
      notasOperador,
      gravacaoUrl: 'https://telecom.enlace.local/recordings/call-simulada.mp3'
    }, actor);

    return res.status(201).json({ chamada });
  } catch (err: any) {
    return res.status(400).json({ error: { message: err.message } });
  }
});

export const telefoniaRoutes = router;
