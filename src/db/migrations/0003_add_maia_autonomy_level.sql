-- =============================================================================
-- ENLACE TELECOM CRM — MIGRAÇÃO 0003: NÍVEL DE AUTONOMIA DA MAIA EM INSTANCES (P0)
-- Adiciona a coluna maia_nivel_autonomia com constraint de 0 a 4 e default seguro 3
-- =============================================================================

DO $$
BEGIN
  -- 1. Adicionar coluna maia_nivel_autonomia caso não exista
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'instances' AND column_name = 'maia_nivel_autonomia'
  ) THEN
    ALTER TABLE instances 
    ADD COLUMN maia_nivel_autonomia INTEGER NOT NULL DEFAULT 3;
  END IF;

  -- 2. Adicionar constraint de intervalo seguro (0 a 4: N0 a N4)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_instances_maia_nivel_autonomia'
  ) THEN
    ALTER TABLE instances
    ADD CONSTRAINT chk_instances_maia_nivel_autonomia 
    CHECK (maia_nivel_autonomia >= 0 AND maia_nivel_autonomia <= 4);
  END IF;
END $$;
