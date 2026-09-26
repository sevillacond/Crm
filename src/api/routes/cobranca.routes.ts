import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { requirePermission } from '../middlewares/rbac.middleware.ts';
import { paymentsAdapter } from '../../integrations/payments/payments.adapter.ts';
import { cobrancaRepository } from '../../modules/cobranca/cobranca.repository.ts';
import { contatosRepository } from '../../modules/contatos/contatos.repository.ts';
import { dealsRepository } from '../../modules/deals/deals.repository.ts';
import { auditoriaService } from '../../modules/auditoria/auditoria.service.ts';
import { env } from '../../config/env.ts';

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
      gatewayConfigurado: paymentsAdapter.isGatewayConectado(),
      gatewayStatus: paymentsAdapter.status,
      faturas
    });
  }
);

// POST /api/cobranca/pix (Requires cobranca:read permission)
// FASE 12 & FASE 13: Entidades persistidas, isolamento por instanceId e Idempotência prévia
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

      // FASE 13: Extrair e validar chave de idempotência para evitar emissão duplicada
      const idempotencyKey =
        (req.headers['idempotency-key'] as string) ||
        req.body.idempotencyKey ||
        (faturaId ? `pix_fat_${faturaId}` : undefined);

      if (idempotencyKey) {
        const existingCharge = await cobrancaRepository.getByIdempotencyKey(idempotencyKey, actor.instanceId);
        if (existingCharge && ['PENDENTE', 'PAGO'].includes(existingCharge.status)) {
          res.status(200).json({
            modoExecucao: existingCharge.provider,
            statusIntegracao: paymentsAdapter.status,
            copiaECola: existingCharge.pixCopiaECola,
            txId: existingCharge.txid,
            valor: existingCharge.valor,
            expiracaoMinutos: 60,
            chavePix: existingCharge.chavePix || '',
            status: existingCharge.status,
            cobrancaId: existingCharge.id,
            isIdempotentReplay: true
          });
          return;
        }
      }

      let nomeCliente = req.body.nomeCliente;
      let cpfCnpj = req.body.cpfCnpj;
      let resolvedContatoId = contatoId;

      // 1. Se dealId fornecido, buscar e validar no escopo exclusivo da instância
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

      // 3. FASE 12 Zero Fake Success: Rejeitar cliente ou documento fictício genérico
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
        instanceId: actor.instanceId,
        idempotencyKey
      });

      // 5. Persistir entidade de cobrança com txid, idempotencyKey e isolamento de instância
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
        provider: cobrancaResult.modoExecucao,
        idempotencyKey
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
// FASE 5 a 11: Webhook financeiro de alta criticidade com validação HMAC timing-safe, replay, isolamento dedicado e transação atômica
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = (req.headers['x-signature'] || req.headers['x-hub-signature-256'] || req.headers['x-signature-sha256']) as string | undefined;
  const timestamp = (req.headers['x-timestamp'] || req.headers['x-webhook-timestamp']) as string | undefined;
  const rawBody = (req as any).rawBody as Buffer | undefined;

  // 1. Processar e validar assinatura HMAC e timestamp no adapter
  const result = await paymentsAdapter.processWebhook(req.body, signature, timestamp, rawBody);
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

  // FASE 8: Webhook sem descoberta global de instâncias (instalação dedicada única)
  const localInstanceId = env.INSTANCE_ID || 'inst-dev-local-001';

  // FASE 10: Execução atomicamente transacional (Idempotência, Localização, Validação de Valor e Atualização)
  const txResult = await cobrancaRepository.executeTransactionalPayment({
    txId,
    instanceId: localInstanceId,
    valorPago: valorPago || 0,
    eventKey: idempotencyKey || txId,
    provider: 'ENLACE_PAY',
    rawPayload: req.body,
    providerEventId: req.body?.eventId || req.body?.id,
    e2eId: req.body?.pix?.[0]?.endToEndId || req.body?.pix?.[0]?.e2eId
  });

  if (txResult.status === 'ALREADY_PROCESSED') {
    res.status(200).json({
      status: 'ALREADY_PROCESSED',
      message: txResult.message
    });
    return;
  }

  if (txResult.status === 'CHARGE_NOT_FOUND') {
    res.status(404).json({
      status: 'CHARGE_NOT_FOUND',
      error: { code: 'CHARGE_NOT_FOUND', message: txResult.error }
    });
    return;
  }

  if (txResult.status === 'AMOUNT_MISMATCH') {
    res.status(422).json({
      status: 'AMOUNT_MISMATCH',
      error: { code: 'AMOUNT_MISMATCH', message: txResult.error }
    });
    return;
  }

  if (txResult.status === 'INVALID_STATE_TRANSITION') {
    res.status(409).json({
      status: 'INVALID_STATE_TRANSITION',
      error: { code: 'INVALID_STATE_TRANSITION', message: txResult.error }
    });
    return;
  }

  if (txResult.status !== 'PROCESSED' || !txResult.charge) {
    res.status(500).json({
      status: 'ERROR',
      error: { code: 'PAYMENT_PROCESSING_ERROR', message: (txResult as any).error || 'Falha ao processar liquidação.' }
    });
    return;
  }

  // FASE 10: Registro na trilha imutável de auditoria
  await auditoriaService.logEvent({
    instanceId: localInstanceId,
    actorId: 'system_webhook',
    actorName: 'Webhook Financeiro Enlace-Pay',
    actorRole: 'ADMIN',
    action: 'COBRANCA_LIQUIDADA_WEBHOOK',
    entityType: 'COBRANCA',
    entityId: txResult.charge.id,
    details: `Cobrança ${txResult.charge.id} (TxId: ${txId}) liquidada via webhook no valor de R$ ${(valorPago || txResult.charge.valor).toFixed(2)}.`,
    dadosPosteriores: { txId, valorPago: valorPago || txResult.charge.valor, status: 'PAGO' }
  });

  res.status(200).json({
    status: 'PROCESSED',
    message: 'Cobrança liquidada com sucesso.',
    txId
  });
});

export const cobrancaRoutes = router;
