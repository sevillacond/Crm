-- =============================================================================
-- ENLACE TELECOM CRM — SCHEMA DE MIGRAÇÃO INICIAL (POSTGRESQL 16)
-- Single-Tenant Dedicated Architecture
-- =============================================================================

CREATE TABLE IF NOT EXISTS instances (
  id VARCHAR(64) PRIMARY KEY,
  cnpj VARCHAR(32) NOT NULL UNIQUE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  cidade_sede TEXT NOT NULL,
  uf VARCHAR(2) NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo (BRT)',
  status VARCHAR(32) NOT NULL DEFAULT 'ISOLADA_ATIVA',
  database_engine TEXT NOT NULL DEFAULT 'PostgreSQL 16.2 (Dedicado)',
  sgp_integrado VARCHAR(64) NOT NULL DEFAULT 'IXC Soft',
  total_ctos INTEGER NOT NULL DEFAULT 0,
  total_portas_disponiveis INTEGER NOT NULL DEFAULT 0,
  versao_maia VARCHAR(64) NOT NULL DEFAULT 'MaIA v3.8 Flash (Tool Gateway RBAC)',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(32) PRIMARY KEY,
  nome VARCHAR(64) NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(64) PRIMARY KEY,
  modulo VARCHAR(32) NOT NULL,
  acao VARCHAR(32) NOT NULL,
  descricao TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id VARCHAR(32) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(64) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  instance_id VARCHAR(64) NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL REFERENCES roles(id),
  avatar TEXT NOT NULL DEFAULT '',
  department VARCHAR(128) NOT NULL DEFAULT 'Geral',
  status VARCHAR(32) NOT NULL DEFAULT 'OFFLINE',
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instance_id VARCHAR(64),
  token TEXT NOT NULL UNIQUE,
  ip_address VARCHAR(64),
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planos (
  id VARCHAR(64) PRIMARY KEY,
  instance_id VARCHAR(64) NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  download_mbps INTEGER NOT NULL,
  upload_mbps INTEGER NOT NULL,
  preco_mensal NUMERIC(10, 2) NOT NULL,
  adesao NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tecnologia VARCHAR(64) NOT NULL,
  popular BOOLEAN NOT NULL DEFAULT FALSE,
  recursos JSONB NOT NULL DEFAULT '[]',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contatos (
  id VARCHAR(64) PRIMARY KEY,
  instance_id VARCHAR(64) NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(32) NOT NULL DEFAULT '',
  telefone VARCHAR(32) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  cep VARCHAR(16) NOT NULL DEFAULT '13000-000',
  logradouro TEXT NOT NULL DEFAULT '',
  numero VARCHAR(32) NOT NULL DEFAULT '',
  complemento TEXT,
  bairro VARCHAR(128) NOT NULL DEFAULT '',
  cidade VARCHAR(128) NOT NULL DEFAULT '',
  uf VARCHAR(2) NOT NULL DEFAULT 'SP',
  status VARCHAR(32) NOT NULL DEFAULT 'NOVO',
  tags JSONB NOT NULL DEFAULT '[]',
  score_maia INTEGER,
  resumo_maia TEXT,
  origem VARCHAR(32) NOT NULL DEFAULT 'SITE',
  deleted_at TIMESTAMP WITH TIME ZONE,
  ultimo_contato TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contatos_instance ON contatos(instance_id);
CREATE INDEX IF NOT EXISTS idx_contatos_cpf_cnpj ON contatos(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_contatos_telefone ON contatos(telefone);
CREATE INDEX IF NOT EXISTS idx_contatos_status ON contatos(status);
CREATE INDEX IF NOT EXISTS idx_contatos_deleted_at ON contatos(deleted_at);

CREATE TABLE IF NOT EXISTS deals (
  id VARCHAR(64) PRIMARY KEY,
  instance_id VARCHAR(64) NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  contato_id VARCHAR(64) NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  plano_id VARCHAR(64) NOT NULL REFERENCES planos(id),
  etapa VARCHAR(32) NOT NULL DEFAULT 'NOVO_LEAD',
  valor_mensal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  taxa_adesao NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  probabilidade INTEGER NOT NULL DEFAULT 20,
  data_previsao VARCHAR(32) NOT NULL,
  responsavel_id VARCHAR(64) NOT NULL REFERENCES users(id),
  status_viabilidade VARCHAR(32) NOT NULL DEFAULT 'PENDENTE',
  cto_proxima VARCHAR(64),
  distancia_metros INTEGER,
  motivo_perda TEXT,
  notas JSONB NOT NULL DEFAULT '[]',
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_instance ON deals(instance_id);
CREATE INDEX IF NOT EXISTS idx_deals_contato ON deals(contato_id);
CREATE INDEX IF NOT EXISTS idx_deals_etapa ON deals(etapa);
CREATE INDEX IF NOT EXISTS idx_deals_responsavel ON deals(responsavel_id);

CREATE TABLE IF NOT EXISTS deal_history (
  id VARCHAR(64) PRIMARY KEY,
  deal_id VARCHAR(64) NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  etapa_anterior VARCHAR(32) NOT NULL,
  etapa_nova VARCHAR(32) NOT NULL,
  motivo TEXT,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_history_deal_id ON deal_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_history_created_at ON deal_history(created_at);

CREATE TABLE IF NOT EXISTS ordens_servico (
  id VARCHAR(64) PRIMARY KEY,
  instance_id VARCHAR(64) NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  deal_id VARCHAR(64) REFERENCES deals(id),
  contato_id VARCHAR(64) NOT NULL REFERENCES contatos(id),
  cliente_nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(32) NOT NULL,
  endereco TEXT NOT NULL,
  bairro VARCHAR(128) NOT NULL,
  tipo VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'AGENDADA',
  plano_nome VARCHAR(255) NOT NULL,
  tecnico_id VARCHAR(64) NOT NULL REFERENCES users(id),
  tecnico_nome VARCHAR(255) NOT NULL,
  data_agendada VARCHAR(32) NOT NULL,
  periodo VARCHAR(16) NOT NULL DEFAULT 'MANHA',
  cto_designada VARCHAR(64) NOT NULL,
  porta_cto INTEGER NOT NULL DEFAULT 1,
  sinal_optico_dbm NUMERIC(5, 2),
  metragem_drop_metros INTEGER,
  ont_serial_gpon VARCHAR(64),
  roteador_wifi6_serial VARCHAR(64),
  checklist JSONB NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_os_instance ON ordens_servico(instance_id);
CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_os_tecnico ON ordens_servico(tecnico_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id VARCHAR(64) PRIMARY KEY,
  instance_id VARCHAR(64) NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actor_id VARCHAR(64) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  action VARCHAR(128) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  details TEXT NOT NULL,
  ip_address VARCHAR(64),
  user_agent TEXT,
  request_id VARCHAR(64),
  correlation_id VARCHAR(64),
  dados_anteriores JSONB,
  dados_posteriores JSONB,
  origem VARCHAR(64) NOT NULL DEFAULT 'WEB_CRM',
  resultado VARCHAR(32) NOT NULL DEFAULT 'SUCESSO',
  is_maia_action BOOLEAN NOT NULL DEFAULT FALSE,
  previous_hash VARCHAR(128),
  hash_integridade VARCHAR(128)
);

CREATE INDEX IF NOT EXISTS idx_audit_events_instance ON audit_events(instance_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
