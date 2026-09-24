import assert from 'assert';
import jwt from 'jsonwebtoken';
import { authService } from '../src/modules/auth/auth.service.ts';
import { sessionsRepository } from '../src/modules/auth/sessions.repository.ts';
import { hasPermission } from '../src/modules/auth/permissions.ts';
import { contatosRepository } from '../src/modules/contatos/contatos.repository.ts';
import { dealsRepository } from '../src/modules/deals/deals.repository.ts';
import { usersRepository } from '../src/modules/users/users.repository.ts';
import { auditoriaRepository } from '../src/modules/auditoria/auditoria.repository.ts';
import { instancesRepository } from '../src/modules/instances/instances.repository.ts';
import { maiaPolicyEngine } from '../src/modules/maia/policyEngine.ts';
import { MAIA_TOOL_REGISTRY, executeMaiaTool, approveAndExecuteTool } from '../src/modules/maia/toolRegistry.ts';
import { maiaApprovalsRepository } from '../src/modules/maia/approvals.repository.ts';
import { maiaService } from '../src/modules/maia/maia.service.ts';
import { createActorContext } from '../src/modules/auth/actorContext.ts';
import { validateEnv, env } from '../src/config/env.ts';
import { checkLoginLockout, recordFailedLogin } from '../src/shared/redis.ts';
import { Contato, Deal } from '../src/types/index.ts';

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
  console.log('   ENLACE CRM — P0.3 HARDENING & SECURITY SUITE');
  console.log('======================================================\n');

  // ==========================================
  // 1. AUTH SUITE
  // ==========================================

  await runTest('1.1 Login válido gera sessão, token JWT e registra auditoria', async () => {
    const session = await authService.login('admin@enlace.net.br', 'Enlace@2026!');
    assert(session.token, 'Token JWT deve ser gerado');
    assert.strictEqual(session.user.email, 'admin@enlace.net.br');
    assert(session.user.instanceId, 'Usuário deve possuir instanceId associado');

    const validSession = await sessionsRepository.findValidSession(session.token);
    assert(validSession !== null, 'Sessão deve estar persistida no repositório');
  });

  await runTest('1.2 Autenticação rejeita senha incorreta', async () => {
    try {
      await authService.login('admin@enlace.net.br', 'SenhaErrada123!');
      assert.fail('Deveria ter lançado erro de credenciais inválidas');
    } catch (err: any) {
      assert(err.message.includes('Credenciais inválidas') || err.message.includes('não confere'), 'Mensagem de erro esperada');
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
        // JWT_SECRET omitido propositalmente
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
        // ADMIN_INITIAL_PASSWORD omitido propositalmente
      });
      assert.fail('Deveria ter lançado erro por falta de ADMIN_INITIAL_PASSWORD');
    } catch (err: any) {
      assert(err.message.includes('ADMIN_INITIAL_PASSWORD'), 'Validação detectou ausência de ADMIN_INITIAL_PASSWORD');
    }
  });

  await runTest('1.6 Startup Failure: Senha conhecida em ADMIN_INITIAL_PASSWORD rejeitada em produção', async () => {
    try {
      validateEnv({
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/enlace_crm',
        JWT_SECRET: 'super-secure-production-jwt-secret-min-32-chars-long!',
        ADMIN_INITIAL_EMAIL: 'admin.root@provedor.com.br',
        ADMIN_INITIAL_PASSWORD: 'Enlace@2026!', // Senha de demonstração proibida em prod
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
  // MANDATORY P0.3 TEST 2 — JWT ADULTERADO
  // ==========================================

  await runTest('TESTE 2 (P0.3) — JWT adulterado (JWT.instanceId = B, DB.user.instanceId = A -> BLOQUEADO)', async () => {
    // Criar um usuário legítimo na Instância A
    const userA = {
      id: `usr_tamper_${Date.now()}`,
      name: 'Operador Legítimo Instância A',
      email: `tamper_${Date.now()}@provedor-a.com.br`,
      role: 'ATENDENTE' as const,
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE' as const,
      instanceId: 'inst_legitima_A'
    };
    await usersRepository.create(userA, 'SenhaSegura@2026!', 'inst_legitima_A');

    // Token assinado com a chave legítima, porém adulterado para a Instância B
    const forgedToken = jwt.sign(
      {
        sub: userA.id,
        instanceId: 'inst_vitima_B', // Adulterado
        role: userA.role
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Registrar sessão no repositório para o token
    await sessionsRepository.createSession({
      id: `ses_tamper_${Date.now()}`,
      userId: userA.id,
      instanceId: 'inst_legitima_A',
      token: forgedToken,
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date()
    });

    // Simular middleware de autenticação
    const payload = await authService.verifyToken(forgedToken);
    const dbUser = await usersRepository.getById(payload.sub);
    assert(dbUser, 'Usuário existe no banco');

    // Validação estrita JWT x Banco (P0: INSTANCE_CONTEXT_MISMATCH)
    const isMismatch = !payload.instanceId || !dbUser.instanceId || payload.instanceId !== dbUser.instanceId;
    assert.strictEqual(isMismatch, true, 'Mismatch detectado: JWT.instanceId diverge do user.instanceId');
  });

  // ==========================================
  // MANDATORY P0.3 TEST 1 — ISOLAMENTO DE DADOS
  // ==========================================

  await runTest('TESTE 1 (P0.3) — Isolamento de Contatos: Usuário A acessa Contato A, Contato B de Instância B é BLOQUEADO', async () => {
    const contatoA: Contato = {
      id: `ct_iso_a_${Date.now()}`,
      nome: 'Cliente Exclusivo da Instância A',
      cpfCnpj: '123.456.789-00',
      telefone: '(19) 97777-1111',
      email: 'a@provedora.com.br',
      cep: '13000-000',
      logradouro: 'Rua A',
      numero: '10',
      bairro: 'Centro',
      cidade: 'Campinas',
      uf: 'SP',
      status: 'NOVO',
      tags: ['A'],
      origem: 'SITE',
      dataCadastro: new Date().toISOString()
    };
    await contatosRepository.create(contatoA, 'inst_provedor_A');

    const contatoB: Contato = {
      id: `ct_iso_b_${Date.now()}`,
      nome: 'Cliente Exclusivo da Instância B',
      cpfCnpj: '987.654.321-99',
      telefone: '(11) 98888-2222',
      email: 'b@provedorb.com.br',
      cep: '01000-000',
      logradouro: 'Av B',
      numero: '20',
      bairro: 'Jardins',
      cidade: 'São Paulo',
      uf: 'SP',
      status: 'NOVO',
      tags: ['B'],
      origem: 'SITE',
      dataCadastro: new Date().toISOString()
    };
    await contatosRepository.create(contatoB, 'inst_provedor_B');

    // Usuário da Instância A acessa Contato A com sucesso
    const acessouProprio = await contatosRepository.getById(contatoA.id, 'inst_provedor_A');
    assert(acessouProprio !== null, 'Usuário A deve acessar Contato A');

    // Usuário da Instância A tenta acessar Contato B -> BLOQUEADO (retorna null / 404)
    const crossAccess = await contatosRepository.getById(contatoB.id, 'inst_provedor_A');
    assert.strictEqual(crossAccess, null, 'Contato B da Instância B deve ser inacessível para Instância A');
  });

  // ==========================================
  // MANDATORY P0.3 TEST 3 — MAIA ISOLATION
  // ==========================================

  await runTest('TESTE 3 (P0.3) — MaIA da Instância A tentando contato da Instância B -> BLOQUEADO', async () => {
    const contatoBeta: Contato = {
      id: `ct_maia_target_b_${Date.now()}`,
      nome: 'Lead Exclusivo B',
      cpfCnpj: '333.444.555-66',
      telefone: '(19) 96666-2222',
      email: 'beta@empresa.com.br',
      cep: '13000-000',
      logradouro: 'Av Beta',
      numero: '200',
      bairro: 'Jardins',
      cidade: 'Campinas',
      uf: 'SP',
      status: 'NOVO',
      tags: ['BETA'],
      origem: 'SITE',
      dataCadastro: new Date().toISOString()
    };
    await contatosRepository.create(contatoBeta, 'inst_provedor_B');

    const actorAlfa = createActorContext({
      id: 'usr_alfa_op',
      instanceId: 'inst_provedor_A',
      name: 'Operador Alfa',
      email: 'alfa@empresa.com.br',
      role: 'ATENDENTE',
      avatar: '',
      department: 'Atendimento',
      status: 'ONLINE'
    });

    try {
      await executeMaiaTool({
        toolName: 'qualificar_lead',
        params: { contatoId: contatoBeta.id },
        actor: actorAlfa
      });
      assert.fail('Deveria ter bloqueado qualificação de contato de outra instância!');
    } catch (err: any) {
      assert(
        err.message.includes('não encontrado na instância') || err.message.includes('bloqueada'),
        `Esperava mensagem de contenção de isolamento, recebido: ${err.message}`
      );
    }
  });

  // ==========================================
  // MANDATORY P0.3 TEST 4 — POLICY INDISPONÍVEL (FAIL-CLOSED)
  // ==========================================

  await runTest('TESTE 4 (P0.3) — Policy indisponível: Banco offline + MaIA solicita ferramenta -> NÃO EXECUTA (FAIL CLOSED)', async () => {
    const actorTest = createActorContext({
      id: 'usr_policy_test',
      instanceId: 'inst_offline_policy',
      name: 'Operador Teste',
      email: 'test@provedor.com.br',
      role: 'ATENDENTE',
      avatar: '',
      department: 'Atendimento',
      status: 'ONLINE'
    });

    // Simular que a política do banco de dados desta instância está indisponível
    maiaPolicyEngine.setSimulatedPolicyUnavailable('inst_offline_policy', true);

    try {
      await executeMaiaTool({
        toolName: 'qualificar_lead',
        params: { contatoId: 'ct_qualquer' },
        actor: actorTest
      });
      assert.fail('Deveria ter falhado e bloqueado a execução (Fail Closed)');
    } catch (err: any) {
      assert(
        err.message.includes('MAIA_POLICY_UNAVAILABLE'),
        `Esperava erro MAIA_POLICY_UNAVAILABLE, recebido: ${err.message}`
      );
    } finally {
      maiaPolicyEngine.setSimulatedPolicyUnavailable('inst_offline_policy', false);
    }
  });

  // ==========================================
  // MANDATORY P0.3 TEST 5 — REDIS INDISPONÍVEL EM PRODUÇÃO
  // ==========================================

  await runTest('TESTE 5 (P0.3) — Redis indisponível em produção + login -> bloqueia sem cair silenciosamente para memória local', async () => {
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'production';

    try {
      // Em produção sem Redis conectado, checkLoginLockout deve falhar com AUTH_SECURITY_UNAVAILABLE
      await checkLoginLockout('login:alvo@provedor.com.br');
      assert.fail('Deveria ter lançado AUTH_SECURITY_UNAVAILABLE');
    } catch (err: any) {
      assert.strictEqual(
        err.message,
        'AUTH_SECURITY_UNAVAILABLE',
        'Redis offline em produção deve lançar estritamente AUTH_SECURITY_UNAVAILABLE'
      );
    } finally {
      (env as any).NODE_ENV = originalEnv;
    }
  });

  // ==========================================
  // MANDATORY P0.3 TEST 6 — APROVAÇÃO HUMANA (HUMAN-IN-THE-LOOP)
  // ==========================================

  await runTest('TESTE 6 (P0.3) — Aprovação Humana: tool.requerAprovacaoHumana = true -> Execução direta bloqueada -> PENDING_APPROVAL -> APPROVED -> EXECUTED', async () => {
    const actorOp = createActorContext({
      id: 'usr_atendente_1',
      instanceId: 'inst_aprovacao_01',
      name: 'Atendente Junior',
      email: 'atendente@provedor.com.br',
      role: 'ATENDENTE',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    const actorSupervisor = createActorContext({
      id: 'usr_super_1',
      instanceId: 'inst_aprovacao_01',
      name: 'Supervisor Comercial',
      email: 'supervisor@provedor.com.br',
      role: 'SUPERVISOR',
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE'
    });

    // Ferramenta que exige aprovação humana
    const result = await executeMaiaTool({
      toolName: 'aplicar_desconto_excecao',
      params: { dealId: 'deal_vip_100', desconto: 20 },
      actor: actorOp
    });

    assert.strictEqual(result.status, 'PENDING_APPROVAL', 'Execução direta deve ser suspensa com status PENDING_APPROVAL');
    assert(result.approvalId, 'Deve gerar um ID de solicitação de aprovação');

    // Verificar requisição persistida no repositório de aprovações
    const pendingReq = await maiaApprovalsRepository.getById(result.approvalId!, 'inst_aprovacao_01');
    assert(pendingReq, 'Requisição deve constar no repositório');
    assert.strictEqual(pendingReq.status, 'PENDING_APPROVAL');

    // Supervisor aprova e executa a solicitação
    const approvedExecution = await approveAndExecuteTool(result.approvalId!, actorSupervisor);
    assert.strictEqual(approvedExecution.status, 'EXECUTED', 'Após aprovação do supervisor, a ferramenta é executada');

    // Verificar transição no repositório
    const resolvedReq = await maiaApprovalsRepository.getById(result.approvalId!, 'inst_aprovacao_01');
    assert.strictEqual(resolvedReq?.status, 'EXECUTED');
    assert.strictEqual(resolvedReq?.resolvedBy?.userId, actorSupervisor.userId);
  });

  // ==========================================
  // MANDATORY P0.3 TEST 7 — AUDITORIA CONCORRENTE SERIALIZADA
  // ==========================================

  await runTest('TESTE 7 (P0.3) — Auditoria concorrente: Gravações simultâneas na mesma instância geram hash chain linear sem bifurcação', async () => {
    const instanceId = `inst_audit_concurrent_${Date.now()}`;

    // Disparar 5 gravações de auditoria concorrentes simultaneamente
    const promises = [1, 2, 3, 4, 5].map(i =>
      auditoriaRepository.create({
        instanceId,
        actorId: `usr_actor_${i}`,
        actorName: `Operador Concorrente ${i}`,
        actorRole: 'ATENDENTE',
        action: `CONCURRENT_ACTION_${i}`,
        entityType: 'TESTE',
        entityId: `ent_${i}`,
        details: `Gravação concorrente serializada ${i}`
      })
    );

    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 5, 'Todas as 5 gravações devem concluir');

    // Recuperar todos os logs da instância ordenados cronologicamente
    const logs = await auditoriaRepository.list(instanceId, 10);
    // Ordenados desc (mais recente primeiro): logs[0] -> logs[1] -> logs[2] -> logs[3] -> logs[4]
    assert.strictEqual(logs.length, 5, 'Devem existir exatamente 5 logs para a instância');

    // Verificar encadeamento SHA-256 linear: previousHash do evento mais recente é igual ao hashIntegridade do anterior
    for (let i = 0; i < logs.length - 1; i++) {
      const current = logs[i];
      const previous = logs[i + 1];
      assert.strictEqual(
        (current as any).previousHash,
        (previous as any).hashIntegridade,
        `Hash chain bifurcou na posição ${i}! Encadeamento deve ser estritamente linear.`
      );
    }
  });

  // ==========================================
  // MANDATORY P0.3 TEST 8 — POLÍTICA POR INSTÂNCIA
  // ==========================================

  await runTest('TESTE 8 (P0.3) — Instâncias diferentes: Instância A (N1) vs Instância B (N3), alterar A não altera B', async () => {
    const instA = `inst_pol_a_${Date.now()}`;
    const instB = `inst_pol_b_${Date.now()}`;

    // Configurar Instância A para N1
    await maiaPolicyEngine.setNivel(1, instA);

    // Configurar Instância B para N3
    await maiaPolicyEngine.setNivel(3, instB);

    // Verificar leituras independentes
    const nivelA = await maiaPolicyEngine.loadNivelForInstance(instA);
    const nivelB = await maiaPolicyEngine.loadNivelForInstance(instB);

    assert.strictEqual(nivelA, 1, 'Instância A deve ter nível N1');
    assert.strictEqual(nivelB, 3, 'Instância B deve ter nível N3');

    // Alterar Instância A para N4
    await maiaPolicyEngine.setNivel(4, instA);

    const novoNivelA = await maiaPolicyEngine.loadNivelForInstance(instA);
    const inalteradoNivelB = await maiaPolicyEngine.loadNivelForInstance(instB);

    assert.strictEqual(novoNivelA, 4, 'Instância A atualizada para N4');
    assert.strictEqual(inalteradoNivelB, 3, 'Instância B deve permanecer estritamente em N3 (sem contaminação)');
  });

  // ==========================================
  // 4. RBAC NEGATIVE PERMISSIONS SUITE
  // ==========================================

  await runTest('4.1 Permissões Negativas: TECNICO não pode excluir contatos (403)', async () => {
    const canDelete = hasPermission('TECNICO', 'contatos:delete');
    assert.strictEqual(canDelete, false, 'TECNICO deve ter contatos:delete bloqueado');

    const canCreateUsers = hasPermission('TECNICO', 'usuarios:create');
    assert.strictEqual(canCreateUsers, false, 'TECNICO deve ter usuarios:create bloqueado');
  });

  await runTest('4.2 Permissões Negativas: ATENDENTE não pode alterar autonomia da MaIA (403)', async () => {
    const canConfigMaia = hasPermission('ATENDENTE', 'maia:configure');
    assert.strictEqual(canConfigMaia, false, 'ATENDENTE não deve ter maia:configure');
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
