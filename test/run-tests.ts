import assert from 'assert';
import jwt from 'jsonwebtoken';
import { authService } from '../src/modules/auth/auth.service.ts';
import { sessionsRepository } from '../src/modules/auth/sessions.repository.ts';
import { hasPermission } from '../src/modules/auth/permissions.ts';
import { contatosRepository } from '../src/modules/contatos/contatos.repository.ts';
import { dealsRepository } from '../src/modules/deals/deals.repository.ts';
import { usersRepository } from '../src/modules/users/users.repository.ts';
import { auditoriaRepository } from '../src/modules/auditoria/auditoria.repository.ts';
import { MAIA_TOOL_REGISTRY } from '../src/modules/maia/toolRegistry.ts';
import { maiaService } from '../src/modules/maia/maia.service.ts';
import { createActorContext } from '../src/modules/auth/actorContext.ts';
import { validateEnv, env } from '../src/config/env.ts';
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
  console.log('   ENLACE CRM — P0.2 HARDENING & SECURITY SUITE');
  console.log('======================================================\n');

  // ==========================================
  // 1. AUTH SUITE
  // ==========================================

  await runTest('1.1 Login válido gera sessão, token JWT e registra auditoria', async () => {
    // In dev fallback, admin user is available
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
        ADMIN_INITIAL_PASSWORD: 'StrongPassword@2026!',
        INSTANCE_ID: 'inst_prod_001'
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
        INSTANCE_ID: 'inst_prod_001'
        // ADMIN_INITIAL_PASSWORD omitido propositalmente
      });
      assert.fail('Deveria ter lançado erro por falta de ADMIN_INITIAL_PASSWORD');
    } catch (err: any) {
      assert(err.message.includes('ADMIN_INITIAL_PASSWORD'), 'Validação detectou ausência de ADMIN_INITIAL_PASSWORD');
    }
  });

  await runTest('1.6 Logout revoga sessão e token fica inutilizável', async () => {
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

  await runTest('1.7 Sessão expirada é rejeitada', async () => {
    const expiredToken = jwt.sign(
      { sub: 'usr_admin', instanceId: 'inst_test', role: 'ADMIN', sessionId: 'ses_expired' },
      env.JWT_SECRET,
      { expiresIn: -10 } // Expired 10s ago
    );

    try {
      await authService.verifyToken(expiredToken);
      assert.fail('Deveria ter rejeitado token expirado');
    } catch (err: any) {
      assert(err.message.includes('expirado') || err.message.includes('expired'), 'Token expirado rejeitado');
    }
  });

  await runTest('1.8 Token inválido com assinatura forjada é rejeitado', async () => {
    const forgedToken = jwt.sign(
      { sub: 'usr_admin', instanceId: 'inst_test', role: 'ADMIN' },
      'forged_secret_attacker'
    );

    try {
      await authService.verifyToken(forgedToken);
      assert.fail('Deveria ter rejeitado assinatura adulterada');
    } catch (err: any) {
      assert(err.message.includes('inválido') || err.message.includes('signature'), 'Assinatura inválida rejeitada');
    }
  });

  // ==========================================
  // 2. INSTANCE ISOLATION SUITE
  // ==========================================

  await runTest('2.1 Isolamento de Contatos (Instância A vs Instância B -> 404/null)', async () => {
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

    // Instância B tenta buscar o contato de A pelo ID exato
    const crossAccess = await contatosRepository.getById(contatoA.id, 'inst_provedor_B');
    assert.strictEqual(crossAccess, null, 'Instância B NÃO pode enxergar o contato de A (retorna null / 404)');

    // Instância A busca normalmente
    const legitimateAccess = await contatosRepository.getById(contatoA.id, 'inst_provedor_A');
    assert(legitimateAccess !== null, 'Instância A deve acessar seu próprio contato');
  });

  await runTest('2.2 Isolamento de Deals (Instância A vs Instância B -> 404/null)', async () => {
    const dealA: Deal = {
      id: `dl_iso_a_${Date.now()}`,
      titulo: 'Proposta Fibra 1 Giga Instância A',
      contatoId: 'ct_qualquer',
      planoId: 'pln_1giga',
      etapa: 'PROPOSTA',
      valorMensal: 199.9,
      taxaAdesao: 0,
      probabilidade: 60,
      dataPrevisao: '2026-10-01',
      responsavelId: 'usr_admin',
      statusViabilidade: 'VIAVEL_CTO',
      notas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dealsRepository.create(dealA, 'inst_provedor_A');

    const crossDeal = await dealsRepository.getById(dealA.id, 'inst_provedor_B');
    assert.strictEqual(crossDeal, null, 'Instância B NÃO pode acessar o deal de A');

    const legitDeal = await dealsRepository.getById(dealA.id, 'inst_provedor_A');
    assert(legitDeal !== null, 'Instância A deve acessar seu deal');
  });

  await runTest('2.3 Isolamento de Histórico de Deal (dealHistory isolado por instância)', async () => {
    const dealId = `dl_hist_iso_${Date.now()}`;
    const dealForHistory: Deal = {
      id: dealId,
      titulo: 'Deal para teste de histórico',
      contatoId: 'ct_x',
      planoId: 'pln_x',
      etapa: 'NOVO_LEAD',
      valorMensal: 99.9,
      taxaAdesao: 0,
      probabilidade: 20,
      dataPrevisao: '2026-10-01',
      responsavelId: 'usr_admin',
      statusViabilidade: 'PENDENTE',
      notas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dealsRepository.create(dealForHistory, 'inst_provedor_A');
    await dealsRepository.updateStage(dealId, 'PROPOSTA', 'inst_provedor_A', 'usr_admin', 'Cliente solicitou proposta formal');

    // Consulta de histórico a partir da Instância B
    const historyB = await dealsRepository.getHistoryByDealId(dealId, 'inst_provedor_B');
    assert.strictEqual(historyB.length, 0, 'Instância B não deve ter acesso ao histórico de deals de outra instância');

    // Consulta pela Instância A
    const historyA = await dealsRepository.getHistoryByDealId(dealId, 'inst_provedor_A');
    assert(historyA.length > 0, 'Instância A deve consultar seu próprio histórico');
  });

  await runTest('2.4 Isolamento de Usuários (Instância A vs Instância B)', async () => {
    const userA = {
      id: `usr_iso_a_${Date.now()}`,
      name: 'Operador Instância A',
      email: `op_a_${Date.now()}@provedora.com.br`,
      role: 'ATENDENTE' as const,
      avatar: '',
      department: 'Vendas',
      status: 'ONLINE' as const,
      instanceId: 'inst_provedor_A'
    };

    await usersRepository.create(userA, 'SenhaForte@2026!', 'inst_provedor_A');

    const searchB = await usersRepository.getById(userA.id, 'inst_provedor_B');
    assert.strictEqual(searchB, null, 'Instância B não deve encontrar usuário cadastrado na Instância A');

    const searchA = await usersRepository.getById(userA.id, 'inst_provedor_A');
    assert(searchA !== null, 'Instância A deve encontrar seu operador');
  });

  await runTest('2.5 Isolamento de Auditoria (Logs de A invisíveis em B)', async () => {
    await auditoriaRepository.create({
      instanceId: 'inst_provedor_A',
      actorId: 'usr_audit_a',
      actorName: 'Audit A',
      actorRole: 'ADMIN',
      action: 'ISOLATION_CHECK_LOG',
      entityType: 'TESTE',
      entityId: 'ent_1',
      details: 'Log restrito à instância A'
    });

    const logsB = await auditoriaRepository.list('inst_provedor_B');
    const hasLogA = logsB.some(l => l.details === 'Log restrito à instância A');
    assert.strictEqual(hasLogA, false, 'Instância B não pode listar registros de auditoria pertencentes à Instância A');
  });

  // ==========================================
  // 3. MAIA GOVERNANCE & QUALIFICAR_LEAD SUITE
  // ==========================================

  await runTest('3.1 qualificar_lead bloqueia atualização de contato pertencente a outra instância', async () => {
    // Contato criado na Instância Beta
    const contatoBeta: Contato = {
      id: `ct_beta_target_${Date.now()}`,
      nome: 'Lead da Empresa Beta',
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

    // Ator operando sob o contexto autenticado da Instância Alfa
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

    const tool = MAIA_TOOL_REGISTRY.qualificar_lead;

    // Tentativa de executar qualificar_lead no contato da instância B com ator da instância A
    try {
      await tool.execute({ contatoId: contatoBeta.id }, actorAlfa);
      assert.fail('Deveria ter bloqueado qualificação de contato de outra instância!');
    } catch (err: any) {
      assert(
        err.message.includes('não encontrado na instância') || err.message.includes('bloqueada'),
        `Esperava mensagem de isolamento, recebido: ${err.message}`
      );
    }
  });

  await runTest('3.2 MaIA impede vazamento contextual de contato e deal de outra instância', async () => {
    const actorA = createActorContext({
      id: 'usr_actor_a',
      instanceId: 'inst_provedor_A',
      name: 'Operador A',
      email: 'actor_a@provedor.com.br',
      role: 'ATENDENTE',
      avatar: '',
      department: 'Atendimento',
      status: 'ONLINE'
    });

    // Enviar prompt tentando qualificar contato pertencente a outra instância
    const result = await maiaService.processPrompt(
      {
        prompt: 'Qualifique o lead e me informe o score',
        contatoId: 'ct_contato_inexistente_ou_de_outra_instancia'
      },
      actorA
    );

    assert(
      result.resposta.includes('Erro de Governança') || result.resposta.includes('não encontrado'),
      'MaIA não deve permitir processamento de contato de outra instância'
    );
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

  // ==========================================
  // 5. BANCO INDISPONÍVEL EM PRODUÇÃO (FAIL-FAST)
  // ==========================================

  await runTest('5.1 Produção proíbe fallback para memória quando DB offline', async () => {
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'production';

    try {
      await contatosRepository.create({
        id: 'ct_failfast_check',
        nome: 'Contato Prod FailFast',
        cpfCnpj: '',
        telefone: '1999999999',
        email: 'failfast@test.com',
        cep: '13000-000',
        logradouro: 'Rua',
        numero: '1',
        bairro: 'Bairro',
        cidade: 'Campinas',
        uf: 'SP',
        status: 'NOVO',
        tags: [],
        origem: 'SITE',
        dataCadastro: new Date().toISOString()
      }, 'inst_prod_check');

      assert.fail('Deveria ter falhado imediatamente em produção!');
    } catch (err: any) {
      assert(
        err.message.includes('produção') || err.message.includes('indisponível'),
        `Esperado erro de contenção de produção, recebido: ${err.message}`
      );
    } finally {
      (env as any).NODE_ENV = originalEnv;
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
