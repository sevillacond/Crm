import bcrypt from 'bcryptjs';
import { pool, checkDatabaseConnection } from '../client.ts';
import { runMigrations } from '../migrate.ts';
import {
  INITIAL_INSTANCE,
  INITIAL_USERS,
  INITIAL_PLANOS,
  INITIAL_CONTATOS,
  INITIAL_DEALS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ORDENS_SERVICO
} from '../../data/mockData.ts';

export async function seedDatabase(): Promise<boolean> {
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.log('[SEED] Banco PostgreSQL não disponível. Seed será mantido na camada de persistência em memória/cache.');
    return false;
  }

  // Ensure tables exist before seeding
  await runMigrations();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Roles
    const roles = [
      { id: 'ADMIN', nome: 'Administrador Geral', descricao: 'Acesso irrestrito a configurações, auditoria e usuários' },
      { id: 'SUPERVISOR', nome: 'Supervisor de Vendas/Atendimento', descricao: 'Gestão de equipe, relatórios e aprovação de exceções' },
      { id: 'ATENDENTE', nome: 'Atendente Comercial / Suporte', descricao: 'Gestão de leads, contatos, propostas e inbox' },
      { id: 'TECNICO', nome: 'Técnico de Instalação e Campo', descricao: 'Atendimento de ordens de serviço e apontamento de fusão' },
      { id: 'MAIA_AGENT', nome: 'Agente IA Autônomo', descricao: 'Execução de ferramentas sob menor privilégio e governança estrita' }
    ];

    for (const r of roles) {
      await client.query(
        `INSERT INTO roles (id, nome, descricao)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao`,
        [r.id, r.nome, r.descricao]
      );
    }

    // 2. Permissions
    const permissions = [
      { id: 'instancia:manage', modulo: 'INSTANCIA', acao: 'MANAGE', descricao: 'Configurar dados do provedor' },
      { id: 'usuarios:manage', modulo: 'USUARIOS', acao: 'MANAGE', descricao: 'Criar e editar usuários e perfis' },
      { id: 'auditoria:read', modulo: 'AUDITORIA', acao: 'READ', descricao: 'Visualizar trilha de auditoria' },
      { id: 'contatos:read', modulo: 'CONTATOS', acao: 'READ', descricao: 'Consultar carteira de contatos' },
      { id: 'contatos:write', modulo: 'CONTATOS', acao: 'WRITE', descricao: 'Criar e editar contatos' },
      { id: 'deals:read', modulo: 'DEALS', acao: 'READ', descricao: 'Visualizar funil de vendas' },
      { id: 'deals:write', modulo: 'DEALS', acao: 'WRITE', descricao: 'Criar e mover negócios de etapa' },
      { id: 'os:read', modulo: 'ORDENS_SERVICO', acao: 'READ', descricao: 'Visualizar ordens de serviço' },
      { id: 'os:write', modulo: 'ORDENS_SERVICO', acao: 'WRITE', descricao: 'Editar e concluir ordens de serviço' },
      { id: 'maia:interact', modulo: 'MAIA', acao: 'INTERACT', descricao: 'Conversar e solicitar ferramentas da MaIA' }
    ];

    for (const p of permissions) {
      await client.query(
        `INSERT INTO permissions (id, modulo, acao, descricao)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [p.id, p.modulo, p.acao, p.descricao]
      );
    }

    // 3. Instance
    await client.query(
      `INSERT INTO instances (
        id, cnpj, razao_social, nome_fantasia, cidade_sede, uf, timezone,
        status, database_engine, sgp_integrado, total_ctos, total_portas_disponiveis, versao_maia
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        nome_fantasia = EXCLUDED.nome_fantasia,
        cidade_sede = EXCLUDED.cidade_sede,
        total_ctos = EXCLUDED.total_ctos,
        total_portas_disponiveis = EXCLUDED.total_portas_disponiveis`,
      [
        INITIAL_INSTANCE.instanceId,
        INITIAL_INSTANCE.cnpj,
        INITIAL_INSTANCE.razaoSocial,
        INITIAL_INSTANCE.nomeFantasia,
        INITIAL_INSTANCE.cidadeSede,
        INITIAL_INSTANCE.uf,
        INITIAL_INSTANCE.timezone,
        INITIAL_INSTANCE.status,
        INITIAL_INSTANCE.databaseEngine,
        INITIAL_INSTANCE.sgpIntegrado,
        INITIAL_INSTANCE.totalCtos,
        INITIAL_INSTANCE.totalPortasDisponiveis,
        INITIAL_INSTANCE.versaoMaia
      ]
    );

    // 4. Users with bcrypt password hash
    // Standard secure test password hash for initial users (cost factor 10)
    // Salted hash for 'Enlace@2026!':
    const passwordHash = await bcrypt.hash('Enlace@2026!', 10);

    for (const u of INITIAL_USERS) {
      await client.query(
        `INSERT INTO users (
          id, instance_id, name, email, password_hash, role, avatar, department, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          department = EXCLUDED.department,
          avatar = EXCLUDED.avatar`,
        [
          u.id,
          INITIAL_INSTANCE.instanceId,
          u.name,
          u.email,
          passwordHash,
          u.role,
          u.avatar,
          u.department,
          u.status
        ]
      );
    }

    // 5. Planos
    for (const p of INITIAL_PLANOS) {
      await client.query(
        `INSERT INTO planos (
          id, instance_id, nome, download_mbps, upload_mbps, preco_mensal, adesao, tecnologia, popular, recursos
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          nome = EXCLUDED.nome,
          preco_mensal = EXCLUDED.preco_mensal`,
        [
          p.id,
          INITIAL_INSTANCE.instanceId,
          p.nome,
          p.downloadMbps,
          p.uploadMbps,
          p.precoMensal,
          p.adesao,
          p.tecnologia,
          p.popular || false,
          JSON.stringify(p.recursos)
        ]
      );
    }

    // 6. Contatos
    for (const c of INITIAL_CONTATOS) {
      await client.query(
        `INSERT INTO contatos (
          id, instance_id, nome, cpf_cnpj, telefone, email, cep, logradouro, numero, complemento,
          bairro, cidade, uf, status, tags, score_maia, resumo_maia, origem, data_cadastro
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO NOTHING`,
        [
          c.id,
          INITIAL_INSTANCE.instanceId,
          c.nome,
          c.cpfCnpj,
          c.telefone,
          c.email,
          c.cep,
          c.logradouro,
          c.numero,
          c.complemento || null,
          c.bairro,
          c.cidade,
          c.uf,
          c.status,
          JSON.stringify(c.tags),
          c.scoreMaia || null,
          c.resumoMaia || null,
          c.origem,
          c.dataCadastro
        ]
      );
    }

    // 7. Deals
    for (const d of INITIAL_DEALS) {
      await client.query(
        `INSERT INTO deals (
          id, instance_id, titulo, contato_id, plano_id, etapa, valor_mensal, taxa_adesao,
          probabilidade, data_previsao, responsavel_id, status_viabilidade, cto_proxima,
          distancia_metros, motivo_perda, notas, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO NOTHING`,
        [
          d.id,
          INITIAL_INSTANCE.instanceId,
          d.titulo,
          d.contatoId,
          d.planoId,
          d.etapa,
          d.valorMensal,
          d.taxaAdesao,
          d.probabilidade,
          d.dataPrevisao,
          d.responsavelId,
          d.statusViabilidade,
          d.ctoProxima || null,
          d.distanciaMetros || null,
          d.motivoPerda || null,
          JSON.stringify(d.notas),
          d.createdAt,
          d.updatedAt
        ]
      );
    }

    // 8. Ordens de Servico
    for (const os of INITIAL_ORDENS_SERVICO) {
      await client.query(
        `INSERT INTO ordens_servico (
          id, instance_id, deal_id, contato_id, cliente_nome, telefone, endereco, bairro,
          tipo, status, plano_nome, tecnico_id, tecnico_nome, data_agendada, periodo,
          cto_designada, porta_cto, sinal_optico_dbm, metragem_drop_metros, ont_serial_gpon,
          roteador_wifi6_serial, checklist
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (id) DO NOTHING`,
        [
          os.id,
          INITIAL_INSTANCE.instanceId,
          os.dealId || null,
          os.contatoId,
          os.clienteNome,
          os.telefone,
          os.endereco,
          os.bairro,
          os.tipo,
          os.status,
          os.planoNome,
          os.tecnicoId,
          os.tecnicoNome,
          os.dataAgendada,
          os.periodo,
          os.ctoDesignada,
          os.portaCto,
          os.sinalOpticoDbm || null,
          os.metragemDropMetros || null,
          os.ontSerialGpon || null,
          os.roteadorWifi6Serial || null,
          JSON.stringify(os.checklist)
        ]
      );
    }

    // 9. Audit Events
    for (const a of INITIAL_AUDIT_LOGS) {
      await client.query(
        `INSERT INTO audit_events (
          id, instance_id, timestamp, actor_id, actor_name, actor_role, action,
          entity_type, entity_id, details, is_maia_action
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING`,
        [
          a.id,
          INITIAL_INSTANCE.instanceId,
          a.timestamp,
          a.actorId,
          a.actorName,
          a.actorRole,
          a.action,
          a.entityType,
          a.entityId,
          a.details,
          a.isMaiaAction
        ]
      );
    }

    await client.query('COMMIT');
    console.log('[SEED] Base de dados PostgreSQL 16 semeada com sucesso.');
    return true;
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[SEED] Erro ao semear banco de dados:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
