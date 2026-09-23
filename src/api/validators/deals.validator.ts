import { z } from 'zod';

export const createDealSchema = z.object({
  titulo: z.string().min(2, 'O título do negócio é obrigatório'),
  contatoId: z.string().min(1, 'O ID do contato é obrigatório'),
  planoId: z.string().min(1, 'O ID do plano é obrigatório'),
  etapa: z.enum(['NOVO_LEAD', 'VIABILIDADE', 'PROPOSTA', 'NEGOCIACAO', 'INSTALACAO', 'GANHO', 'PERDIDO']).optional().default('NOVO_LEAD'),
  valorMensal: z.number().nonnegative('O valor mensal deve ser positivo ou zero'),
  taxaAdesao: z.number().nonnegative().optional().default(0),
  probabilidade: z.number().min(0).max(100).optional(),
  dataPrevisao: z.string().optional(),
  responsavelId: z.string().optional(),
  statusViabilidade: z.enum(['PENDENTE', 'VIAVEL_CTO', 'INVIAVEL', 'EXPANSAO_NECESSARIA']).optional().default('PENDENTE'),
  nota: z.string().optional()
});

export const updateDealStageSchema = z.object({
  etapa: z.enum(['NOVO_LEAD', 'VIABILIDADE', 'PROPOSTA', 'NEGOCIACAO', 'INSTALACAO', 'GANHO', 'PERDIDO']),
  motivo: z.string().optional()
});
