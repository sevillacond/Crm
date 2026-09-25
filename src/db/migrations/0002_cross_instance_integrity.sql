-- =============================================================================
-- ENLACE TELECOM CRM — MIGRAÇÃO 0002: INTEGRIDADE REFERENCIAL CROSS-INSTANCE (P0.1)
-- Garante via PostgreSQL que chaves estrangeiras validem (id + instance_id)
-- =============================================================================

DO $$
DECLARE
  inconsistent_deals INTEGER;
  inconsistent_sessions INTEGER;
  inconsistent_os INTEGER;
BEGIN
  -- 1. DETECÇÃO E FALHA EXPLÍCITA DE DADOS INCONSISTENTES EXISTENTES
  SELECT COUNT(*) INTO inconsistent_deals
  FROM deals d
  JOIN contatos c ON d.contato_id = c.id
  WHERE d.instance_id <> c.instance_id;

  IF inconsistent_deals > 0 THEN
    RAISE EXCEPTION 'FATAL: Detectados % deals vinculados a contatos de outra instância. Migração abortada para evitar corrupção de dados.', inconsistent_deals;
  END IF;

  SELECT COUNT(*) INTO inconsistent_sessions
  FROM sessions s
  JOIN users u ON s.user_id = u.id
  WHERE s.instance_id <> u.instance_id;

  IF inconsistent_sessions > 0 THEN
    RAISE EXCEPTION 'FATAL: Detectadas % sessões vinculadas a usuários de outra instância. Migração abortada.', inconsistent_sessions;
  END IF;

  SELECT COUNT(*) INTO inconsistent_os
  FROM ordens_servico os
  JOIN contatos c ON os.contato_id = c.id
  WHERE os.instance_id <> c.instance_id;

  IF inconsistent_os > 0 THEN
    RAISE EXCEPTION 'FATAL: Detectadas % ordens de serviço vinculadas a contatos de outra instância. Migração abortada.', inconsistent_os;
  END IF;

  -- 2. CONSTRAINTS DE UNICIDADE COMPOSTAS (id, instance_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_id_instance') THEN
    ALTER TABLE users ADD CONSTRAINT uq_users_id_instance UNIQUE (id, instance_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_contatos_id_instance') THEN
    ALTER TABLE contatos ADD CONSTRAINT uq_contatos_id_instance UNIQUE (id, instance_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_planos_id_instance') THEN
    ALTER TABLE planos ADD CONSTRAINT uq_planos_id_instance UNIQUE (id, instance_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_deals_id_instance') THEN
    ALTER TABLE deals ADD CONSTRAINT uq_deals_id_instance UNIQUE (id, instance_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_ordens_servico_id_instance') THEN
    ALTER TABLE ordens_servico ADD CONSTRAINT uq_ordens_servico_id_instance UNIQUE (id, instance_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_maia_approvals_id_instance') THEN
    ALTER TABLE maia_approval_requests ADD CONSTRAINT uq_maia_approvals_id_instance UNIQUE (id, instance_id);
  END IF;

  -- 3. CHAVES ESTRANGEIRAS COMPOSTAS CROSS-INSTANCE NO POSTGRESQL
  -- DEALS -> CONTATOS (contato_id, instance_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_deals_contato_instance') THEN
    ALTER TABLE deals ADD CONSTRAINT fk_deals_contato_instance 
      FOREIGN KEY (contato_id, instance_id) REFERENCES contatos(id, instance_id) ON DELETE CASCADE;
  END IF;

  -- DEALS -> PLANOS (plano_id, instance_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_deals_plano_instance') THEN
    ALTER TABLE deals ADD CONSTRAINT fk_deals_plano_instance 
      FOREIGN KEY (plano_id, instance_id) REFERENCES planos(id, instance_id);
  END IF;

  -- DEALS -> USERS (responsavel_id, instance_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_deals_user_instance') THEN
    ALTER TABLE deals ADD CONSTRAINT fk_deals_user_instance 
      FOREIGN KEY (responsavel_id, instance_id) REFERENCES users(id, instance_id);
  END IF;

  -- SESSIONS -> USERS (user_id, instance_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sessions_user_instance') THEN
    ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user_instance 
      FOREIGN KEY (user_id, instance_id) REFERENCES users(id, instance_id) ON DELETE CASCADE;
  END IF;

  -- ORDENS_SERVICO -> CONTATOS (contato_id, instance_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_os_contato_instance') THEN
    ALTER TABLE ordens_servico ADD CONSTRAINT fk_os_contato_instance 
      FOREIGN KEY (contato_id, instance_id) REFERENCES contatos(id, instance_id);
  END IF;

  -- ORDENS_SERVICO -> USERS (tecnico_id, instance_id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_os_tecnico_instance') THEN
    ALTER TABLE ordens_servico ADD CONSTRAINT fk_os_tecnico_instance 
      FOREIGN KEY (tecnico_id, instance_id) REFERENCES users(id, instance_id);
  END IF;

END $$;
