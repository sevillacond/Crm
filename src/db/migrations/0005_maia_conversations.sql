-- Migration: 0005_maia_conversations.sql
-- Enlace-CRM & MaIA Runtime: Tabelas de conversas persistentes e mensagens para isolamento multi-tenant

CREATE TABLE IF NOT EXISTS maia_conversations (
    id VARCHAR(64) PRIMARY KEY,
    instance_id VARCHAR(64) NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Nova Conversa',
    deal_id VARCHAR(64),
    contato_id VARCHAR(64),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maia_conv_instance ON maia_conversations(instance_id);
CREATE INDEX IF NOT EXISTS idx_maia_conv_user ON maia_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_maia_conv_created_at ON maia_conversations(created_at);

CREATE TABLE IF NOT EXISTS maia_messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES maia_conversations(id) ON DELETE CASCADE,
    instance_id VARCHAR(64) NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    tool_calls JSONB,
    tool_results JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maia_msg_conv ON maia_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_maia_msg_instance ON maia_messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_maia_msg_created_at ON maia_messages(created_at);
