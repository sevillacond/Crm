import { Router } from 'express';
import { authRoutes } from './auth.routes.ts';
import { instanceRoutes } from './instance.routes.ts';
import { usersRoutes } from './users.routes.ts';
import { planosRoutes } from './planos.routes.ts';
import { contatosRoutes } from './contatos.routes.ts';
import { dealsRoutes } from './deals.routes.ts';
import { ordensRoutes } from './ordens.routes.ts';
import { auditoriaRoutes } from './auditoria.routes.ts';
import { viabilidadeRoutes } from './viabilidade.routes.ts';
import { maiaRoutes } from './maia.routes.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/instance', instanceRoutes);
router.use('/users', usersRoutes);
router.use('/planos', planosRoutes);
router.use('/contatos', contatosRoutes);
router.use('/deals', dealsRoutes);
router.use('/ordens-servico', ordensRoutes);
router.use('/audit', auditoriaRoutes);
router.use('/viabilidade', viabilidadeRoutes);
router.use('/maia', maiaRoutes);

export const apiRoutes = router;
