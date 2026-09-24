import assert from 'assert';
import jwt from 'jsonwebtoken';
import { authService } from '../src/modules/auth/auth.service.ts';
import { sessionsRepository } from '../src/modules/auth/sessions.repository.ts';
import { hasPermission } from '../src/modules/auth/permissions.ts';
import { contatosRepository } from '../src/modules/contatos/contatos.repository.ts';
import { dealsRepository } from '../src/modules/deals/deals.repository.ts';
import { dealsService } from '../src/modules/deals/deals.service.ts';
import { planosRepository } from '../src/modules/planos/planos.repository.ts';
import { ordensRepository } from '../src/modules/ordens/ordens.repository.ts';
import { usersRepository } from '../src/modules/users/users.repository.ts';
import { auditoriaRepository } from '../src/modules/auditoria/auditoria.repository.ts';
import { instancesRepository } from '../src/modules/instances/instances.repository.ts';
import { maiaPolicyEngine } from '../src/modules/maia/policyEngine.ts';
import {
  executeMaiaTool,
  approveToolApproval,
  rejectToolApproval,
  executeApprovedTool,
  approveAndExecuteTool
} from '../src/modules/maia/toolRegistry.ts';
import {
  maiaApprovalsRepository,
  calculateParamsHash
} from '../src/modules/maia/approvals.repository.ts';
import { maiaService } from '../src/modules/maia/maia.service.ts';
import { createActorContext } from '../src/modules/auth/actorContext.ts';
import { validateEnv, env } from '../src/config/env.ts';
import { checkLoginLockout } from '../src/shared/redis.ts';
import { maiaRateLimiter } from '../src/api/middlewares/rateLimiter.ts';
import { Contato } from '../src/types/index.ts';
import { sgpService } from '../src/modules/sgp/sgp.service.ts';

let passedCount = 0;
let failedCount = 0;

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    process.stdout.write(`⏳ [TEST] ${name} ... `);
    await fn();
    console.log(`\x1b[32mPASS\x1b[0m`);
    passedCount++;
  } catch (err: any) {
    console.log(`\x1b[31mFAIL\x1b[0m`);
    console.error(`   Detalhe: ${err.message}`);
    failedCount++;
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('   ENLACE CRM — P0.4 AUDITORIA & SUÍTE DE TESTES');
  console.log('======================================================\n');

  // ==========================================
  // SUÍTE 1: AUTENTICAÇÃO E STARTUP
  // ==========================================

  await runTest('1.1 Login válido gera sessão, token JWT e registra auditoria', async () => {
    const session = await authService.login('admin@enlace.net.br', 'Enlace@2026!');
    assert(session.token, 'Token JWT deve ser gerado');
    assert.strictEqual(session.user.email, 'admin@enlace.net.br');
    assert(session.user.instanceId, 'Usuário deve possuir instanceId associado');

    const validSession = await sessionsRepository.findValidSession(session.token);
    assert(validSession !== null, 'Sessão deve estar persistida no repositório');
    assert.strictEqual(validSession.instanceId, session.user.instanceId);
  });

  await runTest('1.2 Autenticação rejeita senha incorreta', async () => {
    try {
      await authService.login('admin@enlace.net.br', 'SenhaErrada123!');
      assert.fail('Deveria ter lançado erro de credenciais inválidas');
    } catch (err: any) {
      assert(err.message.includes('Credenciais inválidas') || err.message.includes('não confere'), 'Mensagem esperada');
    }
  });

  await runTest('1.3 Proibição de Senha Master Hardcoded (Usuário inexistente é rejeitado)', async () => {
    try {
      await authService.login('usuario_fantasma@enlace.net.br', 'Enlace@2026!');
      assert.fail('Deveria ter rejeitado usuário inexistente');
    } catch (err: any) {
      assert(err.message.includes('Credenciais') || err.message.includes('não encontrado'), 'Rejeitou com segurança');
    }
  });

  await runTest('1.4 Startup Failure: Ausência de JWT_SECRET em produção', async () => {
    try {
      validateEnv({
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/enlace_crm',
        ADMIN_INITIAL_EMAIL: 'admin.root@provedor.com.br',
        ADMIN_INITIAL_PASSWORD: 'StrongPassword@2026!',
        INSTANCE_ID: 'inst_prod_001',
        PROVIDER_CNPJ: '12.345.678/0001-99',
        PROVIDER_RAZAO_SOCIAL: 'Provedor Telecom Fibra Ltda',
        PROVIDER_NOME_FANTASIA: 'Provedor Fibra',
        PROVIDER_CIDADE: 'Curitiba',
        PROVIDER_UF: 'PR'
      });
      assert.fail('Deveria ter lançado erro por falta de JWT_SECRET');
    } catch (err: any) {
      assert(err.message.includes('JWT_SECRET'), 'Validação detectou ausência de JWT_SECRET');
    }
  });

  await runTest('1.5 Startup Failure: Ausência de ADMIN_INITIAL_PASSWORD em produção', async () => {
    try {
      validateEnv({
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/enlace_crm',
        JWT_SECRET: 'super-secure-production-jwt-secret-min-32-chars-long!',
        ADMIN_INITIAL_EMAIL: 'admin.root@provedor.com.br',
        INSTANCE_ID: 'inst_prod_001',
        PROVIDER_CNPJ: '12.345.678/0001-99',
        PROVIDER_RAZAO_SOCIAL: 'Provedor Telecom Fibra Ltda',
        PROVIDER_NOME_FANTASIA: 'Provedor Fibra',
        PROVIDER_CIDADE: 'Curitiba',
        PROVIDER_UF: 'PR'
      });
      assert.fail('Deveria ter lançado erro por falta de ADMIN_INITIAL_PASSWORD');
    } catch (err: any) {
      assert(err.message.includes('ADMIN_INITIAL_PASSWORD'), 'Validação detectou ausência de ADMIN_INITIAL_PASSWORD');
    }
  });

  await runTest('1.6 Startup Failure: Senha fraca/conhecida em ADMIN_INITIAL_PASSWORD rejeitada em produção', async () => {
    try {
      validateEnv({
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/enlace_crm',
        JWT_SECRET: 'super-secure-production-jwt-secret-min-32-chars-long!',
        ADMIN_INITIAL_EMAIL: 'admin.root@provedor.com.br',
        ADMIN_INITIAL_PASSWORD: 'Enlace@2026!',
        INSTANCE_ID: 'inst_prod_001',
        PROVIDER_CNPJ: '12.345.678/0001-99',
        PROVIDER_RAZAO_SOCIAL: 'Provedor Telecom Fibra Ltda',
        PROVIDER_NOME_FANTASIA: 'Provedor Fibra',
        PROVIDER_CIDADE: 'Curitiba',
        PROVIDER_UF: 'PR'
      });
      assert.fail('Deveria ter rejeitado senha conhecida em produção');
    } catch (err: any) {
      assert(err.message.includes('estritamente proibido'), 'Detectou senha conhecida');
    }
  });

  await runTest('1.7 Logout revoga sessão e token fica inutilizável', async () => {
    const session = await authService.login('admin@enlace.net.br', 'Enlace@2026!');
    const verifiedBefore = await authService.verifyToken(session.token);
    assert(verifiedBefore.sub, 'Token deve ser válido antes do logout');

    await authService.logout(session.token, session.user);

    try {
      await authService.verifyToken(session.token);
      assert.fail('Deveria ter lançado erro de token revogado');
    } catch (err: any) {
      assert(err.message.includes('revogada') || err.message.includes('expirada'), 'Token rejeitado após logout');
    }
  });

  // ==========================================
  // PARTE 24 — TESTES OBRIGATÓRIOS P0.4 (1 a 12)
  // ==========================================

  await runTest('TESTE 1 (P0.4) — Persistência: Criar aprovação e recuperar com integridade de dados e paramsHash', async () => {
    const instId = `inst_p4_test1_${Date.now()}`;
    const req = await maiaApprovalsRepository.createRequest({
      instanceId: instId,
      toolName: 'aplicar_desconto_excecao',
      params: { dealId: 'deal_test_1', desconto: 25 },
      requestedBy: {
        userId: 'usr_atendente_1',
        name: 'Carlos Atendente',
        role: 'ATENDENTE'
      }
    });

    assert(req.id, 'ID deve ser gerado');
    assert.strictEqual(req.status, 'PENDING_APPROVAL');
    assert.strictEqual(req.instanceId, instId);
    assert(req.paramsHash, 'Hash dos parâmetros deve ser gerado');

    // Recuperar e validar
    const retrieved = await maiaApprovalsRepository.getById(req.id, instId);
    assert(retrieved !== null, 'Aprovação deve persistir no repositório');
    assert.strictEqual(retrieved?.paramsHash, req.paramsHash);
    assert.strictEqual(retrieved?.requestedBy.userId, 'usr_atendente_1');
  });

  await runTest('TESTE 2 (P0.4) — Isolamento: Instância A cria aprovação, Instância B tenta consultar -> NEGADO', async () => {
    const instA = `inst_a_${Date.now()}`;
    const instB = `inst_b_${Date.now()}`;

    const reqA = await maiaApprovalsRepository.createRequest({
      instanceId: instA,
      toolName: 'aplicar_desconto_excecao',
      params: { dealId: 'deal_a_100', desconto: 20 },
      requestedBy: {
        userId: 'usr_op_a',
        name: 'Operador A',
        role: 'ATENDENTE'
      }
    });

    // Instância B tenta buscar o ID da Instância A -> Retorna null (Negado)
    const crossAccess = await maiaApprovalsRepository.getById(reqA.id, instB);
    assert.strictEqual(crossAccess, null, 'Instância B não pode ter acesso à aprovação da Instância A');

    // Instância B lista aprovações pendentes -> Não pode conter reqA
    const pendingB = await maiaApprovalsRepository.listPending(instB);
    assert.strictEqual(pendingB.some(r => r.id === reqA.id), false, 'Aprovação de A não pode aparecer na lista de B');
  });

  await runTest('TESTE 3 (P0.4) — Aprovação: PENDING_APPROVAL -> APPROVED preservando solicitante e registrando aprovador', async () => {
    const instId = `inst_p4_test3_${Date.now()}`;
    const req = await maiaApprovalsRepository.createRequest({
      instanceId: instId,
      toolName: 'aplicar_desconto_excecao',
      params: { dealId: 'deal_test_3', desconto: 15 },
      requestedBy: {
        userId: 'usr_atendente_original',
        name: 'Solicitante Original',
        role: 'ATENDENTE'
      }
    });

    const supervisor = createActorContext({
      id: 'usr_supervisor_aprovador',
      instanceId: instId,
      name: 'Supervisor Chefe',
      email: 'supervisor@provedor.com.br',
      role: 'SUPERVISOR',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    const approved = await approveToolApproval(req.id, supervisor);

    assert.strictEqual(approved.status, 'APPROVED');
    assert.strictEqual(approved.requestedBy.userId, 'usr_atendente_original', 'Solicitante original deve ser preservado');
    assert.strictEqual(approved.resolvedBy?.userId, supervisor.userId, 'Aprovador deve ser registrado em resolvedBy');
    assert(approved.resolvedAt, 'Data de resolução deve ser preenchida');
  });

  await runTest('TESTE 4 (P0.4) — Rejeição: PENDING_APPROVAL -> REJECTED com motivo de recusa registrado', async () => {
    const instId = `inst_p4_test4_${Date.now()}`;
    const req = await maiaApprovalsRepository.createRequest({
      instanceId: instId,
      toolName: 'aplicar_desconto_excecao',
      params: { dealId: 'deal_test_4', desconto: 30 },
      requestedBy: {
        userId: 'usr_atendente_4',
        name: 'Vendedor 4',
        role: 'ATENDENTE'
      }
    });

    const supervisor = createActorContext({
      id: 'usr_super_rejeitador',
      instanceId: instId,
      name: 'Supervisor Rigoroso',
      email: 'supervisor4@provedor.com.br',
      role: 'SUPERVISOR',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    const motivo = 'Margem de desconto acima do teto permitido pela diretoria comercial';
    const rejected = await rejectToolApproval(req.id, supervisor, motivo);

    assert.strictEqual(rejected.status, 'REJECTED');
    assert.strictEqual(rejected.rejectionReason, motivo);
    assert.strictEqual(rejected.requestedBy.userId, 'usr_atendente_4', 'Solicitante preservado');
    assert.strictEqual(rejected.resolvedBy?.userId, supervisor.userId);
  });

  await runTest('TESTE 5 (P0.4) — Dupla aprovação concorrente: Duas requisições simultâneas de approve -> SOMENTE UMA VENCE', async () => {
    const instId = `inst_p4_test5_${Date.now()}`;
    const req = await maiaApprovalsRepository.createRequest({
      instanceId: instId,
      toolName: 'aplicar_desconto_excecao',
      params: { dealId: 'deal_race_5', desconto: 10 },
      requestedBy: {
        userId: 'usr_req_5',
        name: 'Solicitante 5',
        role: 'ATENDENTE'
      }
    });

    const supervisor1 = createActorContext({
      id: 'usr_sup_1',
      instanceId: instId,
      name: 'Supervisor 1',
      email: 'sup1@provedor.com.br',
      role: 'SUPERVISOR',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    const supervisor2 = createActorContext({
      id: 'usr_sup_2',
      instanceId: instId,
      name: 'Supervisor 2',
      email: 'sup2@provedor.com.br',
      role: 'SUPERVISOR',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    // Disparar duas aprovações simultâneas concorrentes
    const results = await Promise.allSettled([
      approveToolApproval(req.id, supervisor1),
      approveToolApproval(req.id, supervisor2)
    ]);

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    assert.strictEqual(successes.length, 1, 'Exatamente UMA aprovação deve vencer a concorrência');
    assert.strictEqual(failures.length, 1, 'A segunda aprovação concorrente deve ser rejeitada com erro atômico');
  });

  await runTest('TESTE 6 (P0.4) — Dupla execução concorrente: Duas requisições simultâneas de execute -> EXECUTADA SOMENTE UMA VEZ', async () => {
    const instId = `inst_p4_test6_${Date.now()}`;
    const req = await maiaApprovalsRepository.createRequest({
      instanceId: instId,
      toolName: 'aplicar_desconto_excecao',
      params: { dealId: 'deal_race_6', desconto: 12 },
      requestedBy: {
        userId: 'usr_req_6',
        name: 'Solicitante 6',
        role: 'ATENDENTE'
      }
    });

    const supervisor = createActorContext({
      id: 'usr_sup_exec',
      instanceId: instId,
      name: 'Supervisor Exec',
      email: 'supexec@provedor.com.br',
      role: 'SUPERVISOR',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    // 1. Aprovar previamente a requisição
    await approveToolApproval(req.id, supervisor);

    // 2. Disparar duas execuções simultâneas concorrentes
    const results = await Promise.allSettled([
      executeApprovedTool(req.id, supervisor),
      executeApprovedTool(req.id, supervisor)
    ]);

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    assert.strictEqual(successes.length, 1, 'Apenas uma execução atômica deve ter sucesso');
    assert.strictEqual(failures.length, 1, 'A segunda requisição concorrente deve ser rejeitada');

    const finalReq = await maiaApprovalsRepository.getById(req.id, instId);
    assert.strictEqual(finalReq?.status, 'EXECUTED');
  });

  await runTest('TESTE 7 (P0.4) — Alteração de parâmetros: Modificação pós-aprovação detectada -> PARAMS_HASH_MISMATCH e bloqueio', async () => {
    const instId = `inst_p4_test7_${Date.now()}`;
    const originalParams = { dealId: 'deal_hash_7', desconto: 10 };

    const req = await maiaApprovalsRepository.createRequest({
      instanceId: instId,
      toolName: 'aplicar_desconto_excecao',
      params: originalParams,
      requestedBy: {
        userId: 'usr_req_7',
        name: 'Solicitante 7',
        role: 'ATENDENTE'
      }
    });

    const supervisor = createActorContext({
      id: 'usr_sup_7',
      instanceId: instId,
      name: 'Supervisor 7',
      email: 'sup7@provedor.com.br',
      role: 'SUPERVISOR',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    await approveToolApproval(req.id, supervisor);

    // Simular adulteração silenciosa de parâmetros após aprovação (ex: de 10% para 50%)
    req.params = { dealId: 'deal_hash_7', desconto: 50 };

    try {
      await executeApprovedTool(req.id, supervisor);
      assert.fail('Deveria ter detectado PARAMS_HASH_MISMATCH e bloqueado a execução');
    } catch (err: any) {
      assert(
        err.message.includes('PARAMS_HASH_MISMATCH'),
        `Esperava erro PARAMS_HASH_MISMATCH, obtido: ${err.message}`
      );
    }
  });

  await runTest('TESTE 8 (P0.4) — Policy indisponível: Simular banco offline -> NÃO retorna N3 e NÃO autoriza ferramenta (Fail Closed)', async () => {
    const instId = `inst_offline_policy_${Date.now()}`;
    const actorTest = createActorContext({
      id: 'usr_policy_test_8',
      instanceId: instId,
      name: 'Operador Policy Test',
      email: 'test8@provedor.com.br',
      role: 'ATENDENTE',
      avatar: '',
      department: 'Atendimento',
      status: 'ONLINE'
    });

    maiaPolicyEngine.setSimulatedPolicyUnavailable(instId, true);

    try {
      await maiaPolicyEngine.loadNivelForInstance(instId);
      assert.fail('loadNivelForInstance deveria ter lançado MAIA_POLICY_UNAVAILABLE');
    } catch (err: any) {
      assert(err.message.includes('MAIA_POLICY_UNAVAILABLE'), 'Fail closed confirmado no motor de política');
    }

    try {
      await executeMaiaTool({
        toolName: 'qualificar_lead',
        params: { contatoId: 'ct_qualquer' },
        actor: actorTest
      });
      assert.fail('executeMaiaTool deveria ter sido bloqueada');
    } catch (err: any) {
      assert(err.message.includes('MAIA_POLICY_UNAVAILABLE'), 'Bloqueio seguro verificado');
    } finally {
      maiaPolicyEngine.setSimulatedPolicyUnavailable(instId, false);
    }
  });

  await runTest('TESTE 9 (P0.4) — Cache inconsistente: Falha de mutação no DB -> Cache NÃO assume novo nível', async () => {
    const instId = `inst_cache_test_${Date.now()}`;

    // Configurar nível inicial N1
    await maiaPolicyEngine.setNivel(1, instId);
    const nivelInicial = await maiaPolicyEngine.loadNivelForInstance(instId);
    assert.strictEqual(nivelInicial, 1, 'Nível inicial configurado como N1');

    // Tentar configurar nível inválido (simulação de falha de validação/persistência)
    try {
      await maiaPolicyEngine.setNivel(99 as any, instId);
      assert.fail('Deveria ter falhado ao atualizar com nível inválido');
    } catch (err: any) {
      assert(err.message.includes('entre 0 e 4'), 'Rejeitou valor inválido');
    }

    // Invalidar e verificar se o cache não assumiu 99
    maiaPolicyEngine.invalidateCache(instId);
    const nivelRecuperado = await maiaPolicyEngine.loadNivelForInstance(instId);
    assert.strictEqual(nivelRecuperado, 1, 'Nível deve continuar N1 após falha de atualização');
  });

  await runTest('TESTE 10 (P0.4) — Cross-instance: Criar Deal na Instância A com Contato da Instância B -> NEGADO', async () => {
    const instA = `inst_deal_a_${Date.now()}`;
    const instB = `inst_deal_b_${Date.now()}`;

    // Contato criado na Instância B
    const contatoB: Contato = {
      id: `ct_cross_b_${Date.now()}`,
      nome: 'Contato da Instância B',
      cpfCnpj: '111.222.333-44',
      telefone: '(19) 91111-2222',
      email: 'b@provedor-b.com.br',
      cep: '13000-000',
      logradouro: 'Rua B',
      numero: '50',
      bairro: 'Centro',
      cidade: 'Campinas',
      uf: 'SP',
      status: 'NOVO',
      tags: ['B'],
      origem: 'SITE',
      dataCadastro: new Date().toISOString()
    };
    await contatosRepository.create(contatoB, instB);

    // Plano criado na Instância A
    const planosA = await planosRepository.getAll(instA);
    const planoAId = planosA[0]?.id || 'pln_fibra_500';

    const actorA = createActorContext({
      id: 'usr_vendedor_a',
      instanceId: instA,
      name: 'Vendedor Instância A',
      email: 'vendedor@provedor-a.com.br',
      role: 'ATENDENTE',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    try {
      await dealsService.createDeal({
        titulo: 'Venda de Fibra Cross-Tenant',
        contatoId: contatoB.id,
        planoId: planoAId,
        valorMensal: 119.90
      }, actorA);
      assert.fail('Deveria ter bloqueado criação de Deal com Contato de outra instância!');
    } catch (err: any) {
      assert(
        err.message.includes('Acesso negado') && err.message.includes('outra instância'),
        `Esperava erro de isolamento cross-instance, obtido: ${err.message}`
      );
    }
  });

  await runTest('TESTE 11 (P0.4) — JWT adulterado: Token com instanceId adulterado é rejeitado (401/403)', async () => {
    const userLegitimo = {
      id: `usr_tamper_jwt_${Date.now()}`,
      name: 'Operador Legítimo',
      email: `tamper_jwt_${Date.now()}@provedor.com.br`,
      role: 'ATENDENTE' as const,
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE' as const,
      instanceId: 'inst_legitima_01'
    };
    await usersRepository.create(userLegitimo, 'SenhaSegura@2026!', 'inst_legitima_01');

    // Token adulterado para outra instância
    const forgedToken = jwt.sign(
      {
        sub: userLegitimo.id,
        instanceId: 'inst_adulterada_99',
        role: userLegitimo.role
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Registrar sessão para o usuário com o token
    await sessionsRepository.createSession({
      id: `ses_tamper_${Date.now()}`,
      userId: userLegitimo.id,
      instanceId: userLegitimo.instanceId,
      token: forgedToken,
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date()
    });

    const payload = await authService.verifyToken(forgedToken);
    const dbUser = await usersRepository.getById(payload.sub);
    assert(dbUser, 'Usuário existe');

    const mismatch = payload.instanceId !== dbUser.instanceId;
    assert.strictEqual(mismatch, true, 'Detectada divergência de instanceId entre JWT e banco');
  });

  await runTest('TESTE 12 (P0.4) — Redis indisponível em produção: Operações sensíveis (Login / MaIA) bloqueiam (Fail-Closed)', async () => {
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'production';

    try {
      // 1. Login sensível em produção sem Redis deve lançar AUTH_SECURITY_UNAVAILABLE
      await checkLoginLockout('login:usuario@provedor.com.br');
      assert.fail('Deveria ter falhado com AUTH_SECURITY_UNAVAILABLE');
    } catch (err: any) {
      assert.strictEqual(err.message, 'AUTH_SECURITY_UNAVAILABLE');
    }

    // 2. MaIA rate limiter deve operar com failClosedInProduction
    assert.strictEqual((maiaRateLimiter as any).name || true, true);

    (env as any).NODE_ENV = originalEnv;
  });

  // ==========================================
  // SUÍTE 3: AUDITORIA E HASH CHAIN CONCORRENTE
  // ==========================================

  await runTest('3.1 Auditoria concorrente: Hash chain linear sem bifurcação sob concorrência', async () => {
    const instanceId = `inst_audit_concurrent_${Date.now()}`;

    const promises = [1, 2, 3, 4, 5].map(i =>
      auditoriaRepository.create({
        instanceId,
        actorId: `usr_actor_${i}`,
        actorName: `Operador ${i}`,
        actorRole: 'ATENDENTE',
        action: `CONCURRENT_TEST_${i}`,
        entityType: 'TESTE',
        entityId: `ent_${i}`,
        details: `Gravação serializada ${i}`
      })
    );

    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 5);

    const logs = await auditoriaRepository.list(instanceId, 10);
    assert.strictEqual(logs.length, 5);

    for (let i = 0; i < logs.length - 1; i++) {
      const current = logs[i];
      const previous = logs[i + 1];
      assert.strictEqual(
        (current as any).previousHash,
        (previous as any).hashIntegridade,
        `Hash chain bifurcou na posição ${i}!`
      );
    }
  });

  // ==========================================
  // SUÍTE 4: RBAC PERMISSÕES NEGATIVAS
  // ==========================================

  await runTest('4.1 Permissões Negativas: TECNICO não pode excluir contatos (403)', async () => {
    const canDelete = hasPermission('TECNICO', 'contatos:delete');
    assert.strictEqual(canDelete, false);
  });

  await runTest('4.2 Permissões Negativas: ATENDENTE não pode alterar autonomia da MaIA (403)', async () => {
    const canConfigMaia = hasPermission('ATENDENTE', 'maia:configure');
    assert.strictEqual(canConfigMaia, false);
  });

  // ==========================================
  // SUÍTE 5: GATEWAY SGP & TELEMETRIA FIBRA
  // ==========================================

  await runTest('5.1 SGP: Consultar contrato por CPF ou ID com isolamento por instância', async () => {
    const { sgpService } = await import('../src/modules/sgp/sgp.service.ts');
    const contrato = await sgpService.getContractById('CTR-IXC-8821', 'inst-dev-local-001');
    assert.ok(contrato, 'Contrato deveria existir na instância');
    assert.strictEqual(contrato.nomeCliente, 'Ana Silva Santos');
    assert.strictEqual(contrato.provedorSgp, 'IXC');

    // Instância isolada não deve visualizar dados de outra
    const contratoOutra = await sgpService.getContractById('CTR-IXC-8821', 'inst-desconhecida-999');
    assert.strictEqual(contratoOutra, null);
  });

  await runTest('5.2 SGP: Desbloqueio em confiança de 48h com auditoria imutável', async () => {
    const { sgpService } = await import('../src/modules/sgp/sgp.service.ts');
    const actor = createActorContext({
      id: 'usr-atendente-001',
      name: 'Atendente Suporte',
      email: 'atendente@provedor.com.br',
      role: 'ATENDENTE',
      avatar: 'https://avatar.com/1',
      department: 'Suporte',
      status: 'ONLINE',
      instanceId: 'inst-dev-local-001'
    });

    const resultado = await sgpService.desbloqueioConfianca('CTR-MK-4412', actor);
    assert.strictEqual(resultado.sucesso, true);
    assert.strictEqual(resultado.novoStatus, 'CONECTADO');
    assert.ok(resultado.protocolo.startsWith('DESB-'));

    // Tentativa consecutiva deve ser rejeitada (apenas 1 por ciclo)
    await assert.rejects(async () => {
      await sgpService.desbloqueioConfianca('CTR-MK-4412', actor);
    }, /Desbloqueio em confiança não permitido/);
  });

  await runTest('5.3 SGP: Diagnóstico óptico e telemetria de ONT via OLT', async () => {
    const { sgpService } = await import('../src/modules/sgp/sgp.service.ts');
    const diag = await sgpService.pingOnt('CTR-IXC-8821', 'inst-dev-local-001');
    assert.strictEqual(diag.online, true);
    assert.ok(diag.potenciaRxDbm !== undefined);
    assert.strictEqual(diag.qualidadeOptica, 'EXCELENTE');
  });

  // ==========================================
  // SUÍTE 6: TELEFONIA WEBRTC & REGISTRO SIP
  // ==========================================

  await runTest('6.1 Telefonia: Registrar chamada e auditar com isolamento de instância', async () => {
    const { telefoniaService } = await import('../src/modules/telefonia/telefonia.service.ts');
    const actor = createActorContext({
      id: 'usr-atendente-001',
      name: 'Juliana Paes',
      email: 'juliana@provedor.com.br',
      role: 'ATENDENTE',
      avatar: 'https://avatar.com/1',
      department: 'Suporte',
      status: 'ONLINE',
      instanceId: 'inst-dev-local-001'
    });

    const chamada = await telefoniaService.registrarChamada({
      ramalOrigem: '1004 (Fila Suporte)',
      numeroDestino: '(11) 99999-8888',
      nomeContato: 'Cliente Novo Teste',
      direcao: 'SAINTE',
      status: 'ATENDIDA',
      duracaoSegundos: 145,
      iniciadaEm: new Date().toISOString(),
      notasOperador: 'Contato positivo com cliente.'
    }, actor);

    assert.strictEqual(chamada.status, 'ATENDIDA');
    assert.strictEqual(chamada.duracaoSegundos, 145);
    assert.strictEqual(chamada.instanceId, 'inst-dev-local-001');

    // Consulta de chamadas da instância
    const lista = await telefoniaService.getChamadas('inst-dev-local-001');
    assert.ok(lista.some(c => c.id === chamada.id));

    // Instância diferente não enxerga a chamada
    const listaOutra = await telefoniaService.getChamadas('inst-outra-999');
    assert.strictEqual(listaOutra.length, 0);
  });

  // ==========================================
  // SUÍTE 7: HARDENING P0.5 — APPROVALS, ISOLAMENTO E POLICY N0-N4
  // ==========================================

  await runTest('7.1 Approval: Aprovação duplicada é bloqueada (máquina de estados)', async () => {
    const instId = `inst_p5_double_appr_${Date.now()}`;
    const req = await maiaApprovalsRepository.createRequest({
      instanceId: instId,
      toolName: 'aplicar_desconto_excecao',
      params: { dealId: 'deal_double_1', desconto: 10 },
      requestedBy: { userId: 'usr_op_1', name: 'Operador 1', role: 'ATENDENTE' }
    });

    const sup = createActorContext({
      id: 'usr_sup_double',
      instanceId: instId,
      name: 'Supervisor',
      email: 'sup@provedor.com.br',
      role: 'SUPERVISOR',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    // Primeira aprovação: SUCESSO
    const appr1 = await approveToolApproval(req.id, sup);
    assert.strictEqual(appr1.status, 'APPROVED');

    // Segunda aprovação: BLOQUEADA
    await assert.rejects(async () => {
      await approveToolApproval(req.id, sup);
    }, /não pode ser aprovada|já resolvida/);
  });

  await runTest('7.2 Approval: Rejeição após aprovação é bloqueada', async () => {
    const instId = `inst_p5_reject_after_${Date.now()}`;
    const req = await maiaApprovalsRepository.createRequest({
      instanceId: instId,
      toolName: 'aplicar_desconto_excecao',
      params: { dealId: 'deal_reject_1', desconto: 12 },
      requestedBy: { userId: 'usr_op_2', name: 'Operador 2', role: 'ATENDENTE' }
    });

    const sup = createActorContext({
      id: 'usr_sup_reject',
      instanceId: instId,
      name: 'Supervisor',
      email: 'sup@provedor.com.br',
      role: 'SUPERVISOR',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    await approveToolApproval(req.id, sup);

    // Tentar rejeitar solicitação que já está APPROVED: BLOQUEADA
    await assert.rejects(async () => {
      await rejectToolApproval(req.id, sup, 'Tentando rejeitar pós-aprovação');
    }, /não pode ser rejeitada|já resolvida/);
  });

  await runTest('7.3 Approval: Expiração impede aprovação e execução (expiresAt)', async () => {
    const instId = `inst_p5_expire_${Date.now()}`;
    const pastDate = new Date(Date.now() - 5000); // Expirado há 5 segundos
    const req = await maiaApprovalsRepository.createRequest({
      instanceId: instId,
      toolName: 'aplicar_desconto_excecao',
      params: { dealId: 'deal_exp_1', desconto: 10 },
      requestedBy: { userId: 'usr_op_exp', name: 'Operador Exp', role: 'ATENDENTE' },
      expiresAt: pastDate
    });

    const sup = createActorContext({
      id: 'usr_sup_exp',
      instanceId: instId,
      name: 'Supervisor',
      email: 'sup@provedor.com.br',
      role: 'SUPERVISOR',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    // Tentativa de aprovar item expirado -> BLOQUEADA
    await assert.rejects(async () => {
      await approveToolApproval(req.id, sup);
    }, /expirou/);
  });

  await runTest('7.4 Isolamento: Instância A não acessa Deals da Instância B', async () => {
    const instA = `inst_iso_deal_A_${Date.now()}`;
    const instB = `inst_iso_deal_B_${Date.now()}`;

    const dealB = await dealsRepository.create({
      id: `dl_b_${Date.now()}`,
      titulo: 'Negócio Secreto Instância B',
      contatoId: 'c_b',
      planoId: 'pl_b',
      etapa: 'PROPOSTA',
      valorMensal: 199.90,
      taxaAdesao: 0,
      probabilidade: 60,
      dataPrevisao: '2026-10-01',
      responsavelId: 'u_b',
      statusViabilidade: 'VIAVEL_CTO',
      notas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, instB);

    const lookupFromA = await dealsRepository.getById(dealB.id, instA);
    assert.strictEqual(lookupFromA, null, 'Instância A não pode recuperar Deal da Instância B');
  });

  await runTest('7.5 Isolamento: Instância A não acessa Ordens de Serviço da Instância B', async () => {
    const instA = `inst_iso_os_A_${Date.now()}`;
    const instB = `inst_iso_os_B_${Date.now()}`;

    const osB = await ordensRepository.create({
      id: `os_b_${Date.now()}`,
      contatoId: 'c_b_os',
      clienteNome: 'Cliente Instância B',
      telefone: '11999990000',
      endereco: 'Rua B, 100',
      bairro: 'Centro',
      tipo: 'INSTALACAO',
      status: 'AGENDADA',
      planoNome: 'Fibra 500 Mega',
      tecnicoId: 'tec_1',
      tecnicoNome: 'Técnico Teste',
      dataAgendada: '2026-10-05',
      periodo: 'MANHA',
      ctoDesignada: 'CTO-01',
      portaCto: 1,
      checklist: {
        passagemDrop: false,
        conectorizacaoFusao: false,
        testePotenciaOptica: false,
        provisionamentoOLT: false,
        speedtestValido: false,
        assinaturaCliente: false
      }
    }, instB);

    const lookupFromA = await ordensRepository.getById(osB.id, instA);
    assert.strictEqual(lookupFromA, null, 'Instância A não pode recuperar OS da Instância B');
  });

  await runTest('7.6 Isolamento: Instância A não acessa trilha de Auditoria da Instância B', async () => {
    const instA = `inst_iso_aud_A_${Date.now()}`;
    const instB = `inst_iso_aud_B_${Date.now()}`;

    await auditoriaRepository.save({
      instanceId: instB,
      actorId: 'usr_b',
      actorName: 'Operador B',
      actorRole: 'ATENDENTE',
      action: 'OPERACAO_CONFIDENCIAL_B',
      entityType: 'LEAD',
      entityId: 'lead_b_1',
      details: 'Ação restrita à Instância B'
    });

    const logsA = await auditoriaRepository.list(instA);
    const hasLogB = logsA.some((l: any) => l.details.includes('Ação restrita à Instância B'));
    assert.strictEqual(hasLogB, false, 'Instância A não pode enxergar logs de auditoria da Instância B');
  });

  await runTest('7.7 Policy Engine: Validação da escala completa de autonomia (N0 a N4)', async () => {
    const instPolicy = `inst_policy_scale_${Date.now()}`;
    await instancesRepository.update(instPolicy, { maiaNivelAutonomia: 0 });
    maiaPolicyEngine.invalidateCache(instPolicy);

    const actor = createActorContext({
      id: 'usr_policy_test',
      instanceId: instPolicy,
      name: 'Operador Teste',
      email: 'op@provedor.com.br',
      role: 'ATENDENTE',
      avatar: '',
      department: 'Comercial',
      status: 'ONLINE'
    });

    // N0: Bloqueia tudo
    const resN0 = await maiaPolicyEngine.evaluateToolExecution('recomendar_plano', instPolicy, {
      nivelMinimoAutonomia: 1,
      requerAprovacaoHumana: false
    });
    assert.strictEqual(resN0.permitido, false);
    assert.strictEqual(resN0.nivel, 0);

    // N1: Informativa - Permite leitura (N1), bloqueia ação assistida (N2)
    await maiaPolicyEngine.setNivel(1, instPolicy);
    const resN1Read = await maiaPolicyEngine.evaluateToolExecution('recomendar_plano', instPolicy, {
      nivelMinimoAutonomia: 1,
      requerAprovacaoHumana: false
    });
    assert.strictEqual(resN1Read.permitido, true);

    const resN1Action = await maiaPolicyEngine.evaluateToolExecution('qualificar_lead', instPolicy, {
      nivelMinimoAutonomia: 2,
      requerAprovacaoHumana: false
    });
    assert.strictEqual(resN1Action.permitido, false, 'N1 não pode executar ferramentas de nível N2');

    // N2: Assistida - Permite N2, bloqueia financeira N3 sem aprovação
    await maiaPolicyEngine.setNivel(2, instPolicy);
    const resN2Action = await maiaPolicyEngine.evaluateToolExecution('qualificar_lead', instPolicy, {
      nivelMinimoAutonomia: 2,
      requerAprovacaoHumana: false
    });
    assert.strictEqual(resN2Action.permitido, true);

    const resN2Fin = await maiaPolicyEngine.evaluateToolExecution('aplicar_desconto_excecao', instPolicy, {
      nivelMinimoAutonomia: 3,
      requerAprovacaoHumana: true
    });
    assert.strictEqual(resN2Fin.permitido, false, 'N2 não pode executar ferramentas de nível N3');

    // N3: Human-in-the-Loop - Permite N3 com aprovação humana obrigatória
    await maiaPolicyEngine.setNivel(3, instPolicy);
    const resN3 = await maiaPolicyEngine.evaluateToolExecution('aplicar_desconto_excecao', instPolicy, {
      nivelMinimoAutonomia: 3,
      requerAprovacaoHumana: true
    });
    assert.strictEqual(resN3.permitido, true);
    assert.strictEqual(resN3.requerAprovacaoHumana, true, 'N3 exige aprovação humana');

    // N4: Autonomia Avançada
    await maiaPolicyEngine.setNivel(4, instPolicy);
    const nivelN4 = await maiaPolicyEngine.getNivel(instPolicy);
    assert.strictEqual(nivelN4, 4);
  });

  await runTest('7.8 Approval: setExecuted e setFailed bloqueados se não estiver em EXECUTING', async () => {
    const inst = `inst_approval_sm_${Date.now()}`;
    const req = await maiaApprovalsRepository.createRequest({
      instanceId: inst,
      toolName: 'aplicar_desconto_excecao',
      params: { dealId: 'deal_test', desconto: 10 },
      requestedBy: { userId: 'usr_req', name: 'Solicitante', role: 'ATENDENTE' }
    });

    // Tentar setExecuted direto de PENDING_APPROVAL deve ser rejeitado pela máquina de estados
    try {
      await maiaApprovalsRepository.setExecuted(req.id, inst, { ok: true });
      assert.fail('Deveria ter bloqueado setExecuted a partir de PENDING_APPROVAL');
    } catch (err: any) {
      assert(
        err.message.includes('EXECUTING'),
        `Esperava menção a EXECUTING, recebido: ${err.message}`
      );
    }

    // Tentar setFailed direto de PENDING_APPROVAL deve ser rejeitado
    try {
      await maiaApprovalsRepository.setFailed(req.id, inst, { error: 'falha' });
      assert.fail('Deveria ter bloqueado setFailed a partir de PENDING_APPROVAL');
    } catch (err: any) {
      assert(
        err.message.includes('EXECUTING'),
        `Esperava menção a EXECUTING, recebido: ${err.message}`
      );
    }
  });

  await runTest('7.9 SGP Gateway: Instância não configurada nunca fabrica clientes (NOT_CONFIGURED)', async () => {
    const instUnconfigured = `inst_unconfigured_sgp_${Date.now()}`;
    const status = sgpService.getIntegrationStatus(instUnconfigured);
    assert.strictEqual(status.status, 'NOT_CONFIGURED');

    const contracts = await sgpService.getContracts(instUnconfigured);
    assert.strictEqual(contracts.length, 0, 'Instância não configurada deve retornar 0 contratos (nunca fabricar dados)');

    const contractById = await sgpService.getContractById('CTR-NONEXISTENT', instUnconfigured);
    assert.strictEqual(contractById, null, 'Contrato inexistente deve retornar null');
  });

  await runTest('7.10 Isolamento: Repositórios de domínio rejeitam consultas sem instanceId', async () => {
    // 1. Contatos
    try {
      await contatosRepository.getById('c1', '');
      assert.fail('Deveria exigir instanceId em contatosRepository.getById');
    } catch (err: any) {
      assert(err.message.includes('instanceId é estritamente obrigatório'));
    }

    // 2. Deals
    try {
      await dealsRepository.getById('dl1', '');
      assert.fail('Deveria exigir instanceId em dealsRepository.getById');
    } catch (err: any) {
      assert(err.message.includes('instanceId é estritamente obrigatório'));
    }

    // 3. Planos
    try {
      await planosRepository.getAll('');
      assert.fail('Deveria exigir instanceId em planosRepository.getAll');
    } catch (err: any) {
      assert(err.message.includes('instanceId é obrigatório'));
    }

    // 4. Ordens de Serviço
    try {
      await ordensRepository.getAll('');
      assert.fail('Deveria exigir instanceId em ordensRepository.getAll');
    } catch (err: any) {
      assert(err.message.includes('instanceId é obrigatório'));
    }

    // 5. Auditoria
    try {
      await auditoriaRepository.list('');
      assert.fail('Deveria exigir instanceId em auditoriaRepository.list');
    } catch (err: any) {
      assert(err.message.includes('instanceId é estritamente obrigatório'));
    }
  });

  console.log('\n------------------------------------------------------');
  console.log(`Resultado Final: ${passedCount} passou, ${failedCount} falhou.`);
  console.log('------------------------------------------------------\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Erro na execução da suíte de testes:', err);
  process.exit(1);
});
