import { z } from 'zod';

export const createContatoSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  cpfCnpj: z.string().optional().default(''),
  telefone: z.string().min(8, 'Telefone deve ter pelo menos 8 dígitos').optional().default(''),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  cep: z.string().optional().default(''),
  logradouro: z.string().optional().default(''),
  numero: z.string().optional().default(''),
  complemento: z.string().optional(),
  bairro: z.string().optional().default(''),
  cidade: z.string().optional().default(''),
  uf: z.string().max(2).optional().default(''),
  status: z.enum(['NOVO', 'EM_QUALIFICACAO', 'VIAVEL', 'INVIAVEL', 'CLIENTE_ATIVO', 'CANCELADO']).optional().default('NOVO'),
  tags: z.array(z.string()).optional().default(['LEAD_MANUAL']),
  origem: z.enum(['WHATSAPP', 'WEBCHAT', 'SITE', 'INDICACAO', 'CAMPANHA']).optional().default('SITE')
});

export const updateContatoSchema = createContatoSchema.partial();
