-- =============================================================================
-- ENLACE TELECOM CRM — MIGRAÇÃO 0004: TABELAS DE TELEFONIA, COBRANÇA E WEBHOOKS (P0/P1)
-- Persistência oficial no PostgreSQL de chamadas PBX, cobranças Pix e eventos de webhook
-- =============================================================================

DO $$
BEGIN
  -- 1. Tabela de chamadas telefônicas (Asterisk PBX / WebRTC SIP)
  CREATE TABLE IF NOT EXISTS calls (
    id VARCHAR(64) PRIMARY KEY,
    instance_id VARCHAR(64) NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    provider_call_id VARCHAR(128),
    asterisk_channel_id VARCHAR(128),
    ramal VARCHAR(64) NOT NULL,
    origem VARCHAR(64) NOT NULL,
    destino VARCHAR(64) NOT NULL,
    contato_id VARCHAR(64) REFERENCES contatos(id) ON DELETE SET NULL,
    direcao VARCHAR(16) NOT NULL CHECK (direcao IN ('ENTRANTE', 'SAINTE')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('RINGING', 'ANSWERED', 'HANGUP', 'BUSY', 'FAILED', 'DISCANDO', 'CONECTADA', 'FINALIZADA', 'ATENDIDA', 'NAO_ATENDIDA', 'OCUPADO', 'FALHA')),
    duracao_segundos INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    recording_url TEXT DEFAULT NULL,
    notas_operador TEXT,
    operador_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    operador_nome VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_calls_instance_id ON calls(instance_id);
  CREATE INDEX IF NOT EXISTS idx_calls_provider_call_id ON calls(provider_call_id);

  -- 2. Tabela de cobranças financeiras (Enlace-Pay / Pix / Gateways)
  CREATE TABLE IF NOT EXISTS cobrancas (
    id VARCHAR(64) PRIMARY KEY,
    instance_id VARCHAR(64) NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    txid VARCHAR(128) UNIQUE,
    contato_id VARCHAR(64) REFERENCES contatos(id) ON DELETE SET NULL,
    deal_id VARCHAR(64) REFERENCES deals(id) ON DELETE SET NULL,
    fatura_id VARCHAR(64) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'EXPIRADO', 'CANCELADO', 'ESTORNADO')),
    pix_copia_e_cola TEXT,
    chave_pix VARCHAR(128),
    provider VARCHAR(64) NOT NULL DEFAULT 'NOT_CONFIGURED',
    provider_event_id VARCHAR(128),
    e2e_id VARCHAR(128),
    idempotency_key VARCHAR(128),
    pago_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_cobrancas_instance_id ON cobrancas(instance_id);
  CREATE INDEX IF NOT EXISTS idx_cobrancas_txid ON cobrancas(txid);
  CREATE INDEX IF NOT EXISTS idx_cobrancas_idempotency ON cobrancas(idempotency_key);

  -- 3. Tabela de eventos de webhooks para proteção contra replay e idempotência
  CREATE TABLE IF NOT EXISTS webhook_events (
    id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(32) NOT NULL,
    event_id VARCHAR(128) NOT NULL UNIQUE,
    payload_hash VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PROCESSED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
END $$;
