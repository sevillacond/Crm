import { Router, Request, Response } from 'express';
import { whatsappAdapter } from '../../integrations/whatsapp/whatsapp.adapter.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';
import { cobrancaRepository } from '../../modules/cobranca/cobranca.repository.ts';
import { contatosRepository } from '../../modules/contatos/contatos.repository.ts';
import { auditoriaService } from '../../modules/auditoria/auditoria.service.ts';
import { env } from '../../config/env.ts';

const router = Router();

// GET /api/whatsapp/webhook - Verificação de assinatura do Webhook Meta Cloud API
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  if (!mode || !token) {
    res.status(400).send('Parâmetros de verificação ausentes.');
    return;
  }

  const verifiedChallenge = whatsappAdapter.verificarWebhookToken(mode, token, challenge);
  if (verifiedChallenge) {
    res.status(200).send(verifiedChallenge);
  } else {
    res.status(403).send('Token de verificação inválido.');
  }
});

// POST /api/whatsapp/webhook - Recepção de mensagens e atualizações de status oficiais
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = (req.headers['x-hub-signature-256'] || req.headers['x-hub-signature']) as string | undefined;

  // Processar e validar assinatura criptográfica HMAC-SHA256
  const resultado = await whatsappAdapter.processarWebhook(req.body, signature);
  if (!resultado.processado) {
    res.status(401).json({ error: { code: 'SIGNATURE_INVALID', message: resultado.erro } });
    return;
  }

  const defaultInstanceId = env.INSTANCE_ID || 'inst-enlace-fibra-001';

  // Processar cada mensagem recebida com Idempotência e Resolução de Contato
  for (const msg of resultado.mensagens) {
    // 1. Idempotência por messageId
    const alreadyProcessed = await cobrancaRepository.isWebhookEventProcessed(msg.messageId);
    if (alreadyProcessed) {
      continue;
    }

    await cobrancaRepository.recordWebhookEvent('META_WHATSAPP', msg.messageId, msg.rawPayload);

    // 2. Resolução do contato por telefone
    const { data: contatos } = await contatosRepository.list({ instanceId: defaultInstanceId });
    const cleanPhone = msg.fromPhone.replace(/\D/g, '');
    const matchedContact = contatos.find((c: any) => c.telefone.replace(/\D/g, '').includes(cleanPhone) || cleanPhone.includes(c.telefone.replace(/\D/g, '')));

    // 3. Auditoria do evento de mensagem recebida
    await auditoriaService.logEvent({
      instanceId: defaultInstanceId,
      actorId: 'meta_webhook',
      actorName: 'WhatsApp Cloud API',
      actorRole: 'ATENDENTE',
      action: 'WHATSAPP_MENSAGEM_RECEBIDA',
      entityType: 'CONTATO',
      entityId: matchedContact ? matchedContact.id : 'contato_desconhecido',
      details: `Mensagem WhatsApp recebida de ${msg.fromPhone} (ID: ${msg.messageId}): "${(msg.text || '').slice(0, 80)}"`,
      dadosPosteriores: {
        messageId: msg.messageId,
        fromPhone: msg.fromPhone,
        type: msg.type,
        timestamp: msg.timestamp
      }
    });
  }

  // Responder 200 OK imediatamente para a Meta (exigência da API)
  res.status(200).json({ status: 'EVENT_RECEIVED' });
});

// POST /api/whatsapp/send - Disparo de mensagem oficial WhatsApp
router.post(
  '/send',
  authMiddleware,
  requirePermission('contatos:update'),
  async (req: Request, res: Response) => {
    const { toPhone, text, templateName } = req.body;
    const actor = req.actor!;

    if (!toPhone || !text) {
      res.status(400).json({ error: { code: 'INVALID_PAYLOAD', message: 'toPhone e text são obrigatórios.' } });
      return;
    }

    const resultado = await whatsappAdapter.enviarMensagem({
      toPhone,
      text,
      templateName,
      idempotencyKey: `wa_send_${Date.now()}_${actor.userId}`
    });

    if (!resultado.enviado) {
      res.status(422).json({
        enviado: false,
        statusIntegracao: whatsappAdapter.status,
        erro: resultado.erro
      });
      return;
    }

    // Auditoria de disparo
    await auditoriaService.logEvent({
      instanceId: actor.instanceId,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'WHATSAPP_MENSAGEM_ENVIADA',
      entityType: 'MENSAGEM',
      entityId: resultado.messageId || 'outbound_msg',
      details: `Mensagem enviada para ${toPhone} pelo operador ${actor.name}.`,
      dadosPosteriores: { toPhone, messageId: resultado.messageId }
    });

    res.status(200).json({
      enviado: true,
      messageId: resultado.messageId,
      statusIntegracao: whatsappAdapter.status
    });
  }
);

export const whatsappRoutes = router;
