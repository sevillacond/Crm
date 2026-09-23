import { z } from 'zod';

export const consultarViabilidadeSchema = z.object({
  cep: z.string().min(5, 'CEP deve conter pelo menos 5 caracteres'),
  numero: z.string().optional().default('1'),
  logradouro: z.string().optional(),
  bairro: z.string().optional().default('Centro'),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  contatoId: z.string().optional()
});
