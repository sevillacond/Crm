import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';
import { paymentsAdapter } from '../../integrations/payments/payments.adapter.ts';
import { cobrancaRepository } from '../../modules/cobranca/cobranca.repository.ts';
import { contatosRepository } from '../../modules/contatos/contatos.repository.ts';
import { dealsRepository } from '../../modules/deals/deals.repository.ts';
import { auditoriaService } from '../../modules/auditoria/auditoria.service.ts';

const router = Router();

// GET /api/cobranca (Requires cobranca:read permission)
router.get(
  '/',
  authMiddleware,
  requirePermission('cobranca:read'),
  async (req: Request, res: Response) => {
    const instanceId = req.actor!.instanceId;
    const faturas = await cobrancaRepository.getAllByInstance(instanceId);

    res.json({
      instanceId,
      gatewayConfigurado: paymentsAdapter.isConfigurado(),
      gatewayStatus: paymentsAdapter.status,
      faturas
    });
  }
);

// POST /api/cobranca/pix (Requires cobranca:read permission)
// FASE 7: Proíbe clientes/CPFs falsos. Resolve contato e negócio persistidos via instanceId do ActorContext
router.post(
  '/pix',
  authMiddleware,
  requirePermission('cobranca:read'),
  async (req: Request, res: Response, next) => {
    try {
      const actor = req.actor!;
      const { valor, dealId, contatoId, faturaId, descricao } = req.body;

      if (!valor || typeof valor !== 'number' || valor <= 0) {
        res.status(400).json({ error: { code: 'INVALID_AMOUNT', message: 'Valor deve ser um número positivo.' } });
        return;
      }

      let nomeCliente = req.body.nomeCliente;
      let cpfCnpj = req.body.cpfCnpj;
      let resolvedContatoId = contatoId;

      // 1. Se dealId fornecido, buscar e validar no escopo da instância
      if (dealId) {
        const deal = await dealsRepository.getById(dealId, actor.instanceId);
        if (!deal) {
          res.status(404).json({ error: { code: 'DEAL_NOT_FOUND', message: `Negócio ${dealId} não encontrado na sua instância.` } });
          return;
        }
        resolvedContatoId = deal.contatoId;
      }

      // 2. Se contatoId fornecido ou resolvido pelo deal, extrair dados cadastrais reais
      if (resolvedContatoId) {
        const contato = await contatosRepository.getById(resolvedContatoId, actor.instanceId);
        if (!contato) {
          res.status(404).json({ error: { code: 'CONTATO_NOT_FOUND', message: `Contato ${resolvedContatoId} não encontrado na sua instância.` } });
          return;
        }
        nomeCliente = contato.nome;
        cpfCnpj = contato.cpfCnpj;
      }

      // 3. P0 Zero Fake Success: Rejeitar cliente ou documento fictício genérico
      if (!cpfCnpj || cpfCnpj.trim() === '' || cpfCnpj === '000.000.000-00') {
        res.status(400).json({
          error: {
            code: 'INVALID_CUSTOMER_DOCUMENT',
            message: 'CPF ou CNPJ válido do cliente é obrigatório para emissão de cobrança Pix.'
          }
        });
        return;
      }

      if (!nomeCliente || nomeCliente.trim() === '' || nomeCliente.toLowerCase() === 'cliente') {
        res.status(400).json({
          error: {
            code: 'INVALID_CUSTOMER_NAME',
            message: 'Nome do cliente pagador é obrigatório para emissão de cobrança Pix.'
          }
        });
        return;
      }

      const generatedFaturaId = faturaId || `fat_${Date.now()}`;
      const desc = descricao || (dealId ? `Cobrança Deal ${dealId}` : `Fatura ${generatedFaturaId}`);

      // 4. Gerar cobrança no adapter bancário
      const cobrancaResult = await paymentsAdapter.gerarPixCobranca({
        valor,
        cpfCnpj: cpfCnpj.trim(),
        nomeCliente: nomeCliente.trim(),
        descricao: desc,
        faturaId: generatedFaturaId,
        contatoId: resolvedContatoId,
        dealId,
        instanceId: actor.instanceId
      });

      // 5. Persistir entidade de cobrança com txid e isolamento de instância
      const entity = await cobrancaRepository.create({
        instanceId: actor.instanceId,
        txid: cobrancaResult.txId,
        contatoId: resolvedContatoId,
        dealId,
        faturaId: generatedFaturaId,
        valor,
        status: cobrancaResult.status,
        pixCopiaECola: cobrancaResult.copiaECola,
        chavePix: cobrancaResult.chavePix,
        provider: cobrancaResult.modoExecucao
      });

      // 6. Auditoria de geração de cobrança
      await auditoriaService.logEvent({
        instanceId: actor.instanceId,
        actorId: actor.userId,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'COBRANCA_CRIADA',
        entityType: 'COBRANCA',
        entityId: entity.id,
        details: `Cobrança Pix de R$ ${valor.toFixed(2)} gerada para ${nomeCliente} (TxID: ${cobrancaResult.txId}).`,
        dadosPosteriores: { txId: cobrancaResult.txId, valor, faturaId: generatedFaturaId }
      });

      res.status(201).json({
        ...cobrancaResult,
        cobrancaId: entity.id
      });
    } catch (err: any) {
      next(err);
    }
  }
);

// POST /api/cobranca/webhook
// FASE 6: Webhook financeiro de alta criticidade com validação de HMAC, timestamp, schema, txid e idempotência
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = (req.headers['x-signature'] || req.headers['x-hub-signature-256'] || req.headers['x-signature-sha256']) as string | undefined;
  const timestamp = (req.headers['x-timestamp'] || req.headers['x-webhook-timestamp']) as string | undefined;

  // 1. Processar webhook no adapter
  const result = await paymentsAdapter.processWebhook(req.body, signature, timestamp);
  if (!result.liquidado || !result.txId) {
    res.status(400).json({
      status: 'REJECTED',
      error: {
        code: 'WEBHOOK_VALIDATION_FAILED',
        message: result.erro || 'Falha de validação da assinatura ou do payload do webhook.'
      }
    });
    return;
  }

  const { txId, valorPago, idempotencyKey } = result;

  // 2. Proteção contra duplicidade / Idempotência
  const eventKey = idempotencyKey || txId;
  const alreadyProcessed = await cobrancaRepository.isWebhookEventProcessed(eventKey);
  if (alreadyProcessed) {
    res.status(200).json({
      status: 'ALREADY_PROCESSED',
      message: `Evento de liquidação ${eventKey} já processado anteriormente (Idempotência garantida).`
    });
    return;
  }

  // 3. Localizar a cobrança pelo txId
  // Nota: Webhook externo não possui contexto de ator, pesquisa global de txId garantindo isolamento pelo registro encontrado
  const allInstances = ['inst-enlace-fibra-001', process.env.INSTANCE_ID || ''];
  let foundCharge = null;
  for (const inst of allInstances) {
    if (inst) {
      foundCharge = await cobrancaRepository.getByTxId(txId, inst);
      if (foundCharge) break;
    }
  }

  if (!foundCharge) {
    res.status(404).json({
      status: 'CHARGE_NOT_FOUND',
      error: { code: 'CHARGE_NOT_FOUND', message: `Cobrança com txId ${txId} não localizada no sistema.` }
    });
    return;
  }

  // 4. Validação de valor (tolerância máxima de 1 centavo)
  if (valorPago && Math.abs(foundCharge.valor - valorPago) > 0.01) {
    res.status(422).json({
      status: 'AMOUNT_MISMATCH',
      error: {
        code: 'AMOUNT_MISMATCH',
        message: `Divergência de valor: Cobrança registrada R$ ${foundCharge.valor.toFixed(2)}, recebido R$ ${valorPago.toFixed(2)}.`
      }
    });
    return;
  }

  // 5. Validação de estado atual e transição permitida
  if (foundCharge.status === 'PAGO') {
    res.status(200).json({ status: 'ALREADY_PAID', message: `Cobrança ${txId} já estava liquidada.` });
    return;
  }

  if (foundCharge.status === 'CANCELADO' || foundCharge.status === 'ESTORNADO') {
    res.status(409).json({
      status: 'INVALID_STATE_TRANSITION',
      error: {
        code: 'INVALID_STATE_TRANSITION',
        message: `Não é permitido liquidar cobrança em estado ${foundCharge.status}.`
      }
    });
    return;
  }

  // 6. Atualização transacional para PAGO
  await cobrancaRepository.markAsPaid(txId, foundCharge.instanceId, {
    providerEventId: req.body?.eventId || req.body?.id,
    e2eId: req.body?.pix?.[0]?.endToEndId || req.body?.pix?.[0]?.e2eId
  });

  // 7. Gravação de evento para idempotência
  await cobrancaRepository.recordWebhookEvent('ENLACE_PAY', eventKey, req.body);

  // 8. Trilha de auditoria obrigatória
  await auditoriaService.logEvent({
    instanceId: foundCharge.instanceId,
    actorId: 'system_webhook',
    actorName: 'Webhook Financeiro Enlace-Pay',
    actorRole: 'ADMIN',
    action: 'COBRANCA_LIQUIDADA_WEBHOOK',
    entityType: 'COBRANCA',
    entityId: foundCharge.id,
    details: `Cobrança ${foundCharge.id} (TxId: ${txId}) liquidada via webhook no valor de R$ ${(valorPago || foundCharge.valor).toFixed(2)}.`,
    dadosPosteriores: { txId, valorPago: valorPago || foundCharge.valor, status: 'PAGO' }
  });

  res.status(200).json({
    status: 'PROCESSED',
    message: 'Cobrança liquidada com sucesso.',
    txId
  });
});

export const cobrancaRoutes = router;
