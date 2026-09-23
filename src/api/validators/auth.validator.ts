import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail em formato inválido'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres')
});
