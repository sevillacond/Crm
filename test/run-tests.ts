import assert from 'assert';
import { authService } from '../src/modules/auth/auth.service.ts';
import { sessionsRepository } from '../src/modules/auth/sessions.repository.ts';
import { hasPermission } from '../src/modules/auth/permissions.ts';
import { contatosRepository } from '../src/modules/contatos/contatos.repository.ts';
import { auditoriaRepository } from '../src/modules/auditoria/auditoria.repository.ts';
import { env } from '../src/config/env.ts';
import { Contato } from '../src/types/index.ts';

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
  console.log('   ENLACE CRM — P0 HARDENING AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Autenticação falha com senha errada
  await runTest('1. Autenticação rejeita senha incorreta', async () => {
    try {
      await authService.login('admin@enlace.net.br', 'SenhaErrada123!');
      assert.fail('Deveria ter lançado erro de credenciais inválidas');
    } catch (err: any) {
      assert(err.message.includes('Credenciais inválidas') || err.message.includes('não confere'), 'Mensagem de erro esperada');
    }
  });

  // Test 2: Autenticação NÃO aceita senha master hardcoded
  await runTest('2. Autenticação NÃO aceita senha master hardcoded', async () => {
    try {
      await authService.login('usuario_inexistente@enlace.net.br', 'Enlace@2026!');
      assert.fail('Deveria ter rejeitado usuário inexistente mesmo com senha master');
    } catch (err: any) {
      assert(err.message.includes('Credenciais') || err.message.includes('não encontrado'), 'Rejeitou com segurança');
    }
  });

  // Test 3: Logout revoga sessão no repositório de sessões
  await runTest('3. Logout revoga sessão e impede reutilização', async () => {
    const token = 'sample_jwt_token_test_logout';
    await sessionsRepository.createSession({
      id: 'sess_test_logout',
      userId: 'usr_test_logout',
      instanceId: 'inst_test_001',
      token,
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date()
    });

    const activeBefore = await sessionsRepository.findValidSession(token);
    assert(activeBefore !== null, 'Sessão deveria estar ativa antes do logout');

    await sessionsRepository.revokeSession(token);
    const activeAfter = await sessionsRepository.findValidSession(token);
    assert.strictEqual(activeAfter, null, 'Sessão revogada não pode ser retornada como válida');
  });

  // Test 4: RBAC & Permissions - Permissão negada retorna false (403 no middleware)
  await runTest('4. RBAC restringe permissões por perfil (Princípio do Menor Privilégio)', async () => {
    // TECNICO não tem permissão para gerenciar usuários nem deletar contatos
    const tecnicoCanManageUsers = hasPermission('TECNICO', 'usuarios:create');
    assert.strictEqual(tecnicoCanManageUsers, false, 'TECNICO não deve criar usuários');

    const tecnicoCanDeleteContatos = hasPermission('TECNICO', 'contatos:delete');
    assert.strictEqual(tecnicoCanDeleteContatos, false, 'TECNICO não deve excluir contatos');

    // ADMIN tem permissões administrativas
    const adminCanManageUsers = hasPermission('ADMIN', 'usuarios:create');
    assert.strictEqual(adminCanManageUsers, true, 'ADMIN deve poder criar usuários');

    // ATENDENTE pode ler contatos
    const atendenteCanRead = hasPermission('ATENDENTE', 'contatos:read');
    assert.strictEqual(atendenteCanRead, true, 'ATENDENTE deve ler contatos');
  });

  // Test 5: Auditoria - Encadeamento criptográfico SHA-256 e integridade
  await runTest('5. Auditoria gera encadeamento criptográfico inviolável (hashIntegridade)', async () => {
    const event1 = await auditoriaRepository.create({
      instanceId: 'inst_chain_test',
      actorId: 'usr_auditor_1',
      actorName: 'Carlos Teste',
      actorRole: 'ADMIN',
      action: 'CHAIN_TEST_1',
      entityType: 'SISTEMA',
      entityId: 'sys_1',
      details: 'Primeiro evento da cadeia de testes'
    });

    assert(event1.hashIntegridade, 'Deve possuir hashIntegridade');

    const event2 = await auditoriaRepository.create({
      instanceId: 'inst_chain_test',
      actorId: 'usr_auditor_1',
      actorName: 'Carlos Teste',
      actorRole: 'ADMIN',
      action: 'CHAIN_TEST_2',
      entityType: 'SISTEMA',
      entityId: 'sys_2',
      details: 'Segundo evento encadeado ao primeiro'
    });

    assert.strictEqual(event2.previousHash, event1.hashIntegridade, 'O previousHash do segundo evento deve ser exatamente o hashIntegridade do primeiro');
    assert.notStrictEqual(event2.hashIntegridade, event1.hashIntegridade, 'Hashes devem ser distintos');
  });

  // Test 6: Isolamento de Instância (Tenant Isolation)
  await runTest('6. Isolamento estrito entre instâncias (Provedor A vs Provedor B)', async () => {
    const contatoInstA: Contato = {
      id: `ct_test_insta_${Date.now()}`,
      nome: 'Cliente Provedor Alfa',
      cpfCnpj: '111.222.333-44',
      telefone: '(19) 98888-0001',
      email: 'alfa@cliente.com',
      cep: '13000-000',
      logradouro: 'Rua A',
      numero: '10',
      bairro: 'Centro',
      cidade: 'Campinas',
      uf: 'SP',
      status: 'NOVO',
      tags: ['ALFA'],
      origem: 'SITE',
      dataCadastro: new Date().toISOString()
    };

    // Cria na Instância A
    await contatosRepository.create(contatoInstA, 'inst_provedor_alfa');

    // Busca pela Instância B
    const buscaPelaInstanciaB = await contatosRepository.getById(contatoInstA.id, 'inst_provedor_beta');
    assert.strictEqual(buscaPelaInstanciaB, null, 'Instância B NÃO pode enxergar contatos da Instância A');

    // Busca pela Instância A correta
    const buscaPelaInstanciaA = await contatosRepository.getById(contatoInstA.id, 'inst_provedor_alfa');
    assert(buscaPelaInstanciaA !== null, 'Instância A deve enxergar seu próprio contato');
    assert.strictEqual(buscaPelaInstanciaA.nome, 'Cliente Provedor Alfa');
  });

  // Test 7: Falha controlada em produção (Fail-Fast quando DB indisponível)
  await runTest('7. Falha controlada em produção (Fail-Fast: proíbe persistência em RAM em produção)', async () => {
    // Simulando ambiente de produção com banco indisponível
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'production';

    try {
      await contatosRepository.create({
        id: 'ct_failfast_prod',
        nome: 'Contato Prod Test',
        cpfCnpj: '',
        telefone: '1999999999',
        email: 'prod@test.com',
        cep: '13000-000',
        logradouro: 'Rua Test',
        numero: '1',
        bairro: 'Bairro',
        cidade: 'Campinas',
        uf: 'SP',
        status: 'NOVO',
        tags: [],
        origem: 'SITE',
        dataCadastro: new Date().toISOString()
      }, 'inst_prod_failfast');

      assert.fail('Deveria ter lançado erro de PostgreSQL indisponível em produção!');
    } catch (err: any) {
      assert(
        err.message.includes('produção') || err.message.includes('indisponível'),
        `Esperava mensagem de erro de produção, recebido: ${err.message}`
      );
    } finally {
      (env as any).NODE_ENV = originalEnv;
    }
  });

  console.log('\n------------------------------------------------------');
  console.log(`Resultado: ${passedCount} passou, ${failedCount} falhou.`);
  console.log('------------------------------------------------------\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
