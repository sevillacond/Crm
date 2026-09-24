-- =============================================================================
-- ENLACE TELECOM CRM — MIGRAÇÃO 0001: PERSISTÊNCIA DAS APROVAÇÕES MAIA
-- Tabela transacional com isolamento estrito por instance_id (FK cascade)
-- =============================================================================

CREATE TABLE IF NOT EXISTS maia_approval_requests (
  id VARCHAR(64) PRIMARY KEY,
  instance_id VARCHAR(64) NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  tool_name VARCHAR(128) NOT NULL,
  params JSONB NOT NULL,
  params_hash VARCHAR(128) NOT NULL,
  policy_version VARCHAR(64) NOT NULL DEFAULT 'v1',
  requested_by_user_id VARCHAR(64) NOT NULL,
  requested_by_name VARCHAR(255) NOT NULL,
  requested_by_role VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_user_id VARCHAR(64),
  resolved_by_name VARCHAR(255),
  resolved_by_role VARCHAR(64),
  rejection_reason TEXT,
  executed_by_user_id VARCHAR(64),
  executed_by_name VARCHAR(255),
  executed_by_role VARCHAR(64),
  execution_result JSONB,
  executed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  request_id VARCHAR(64),
  correlation_id VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_maia_approvals_instance ON maia_approval_requests(instance_id);
CREATE INDEX IF NOT EXISTS idx_maia_approvals_status ON maia_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_maia_approvals_created_at ON maia_approval_requests(created_at);

-- Garantir integridade da chave estrangeira e restrição NOT NULL em sessions caso existente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'instance_id' AND is_nullable = 'YES'
  ) THEN
    -- Apenas altera caso não haja registros com NULL
    DELETE FROM sessions WHERE instance_id IS NULL;
    ALTER TABLE sessions ALTER COLUMN instance_id SET NOT NULL;
  END IF;
END $$;
