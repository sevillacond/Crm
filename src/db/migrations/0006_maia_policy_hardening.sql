-- Migration: 0006_maia_policy_hardening.sql
-- Adiciona campos de snapshot de governança para revalidação estrita de política e SoD

ALTER TABLE "maia_approval_requests" ADD COLUMN IF NOT EXISTS "autonomy_level" varchar(16);
ALTER TABLE "maia_approval_requests" ADD COLUMN IF NOT EXISTS "risk_level" varchar(32);
ALTER TABLE "maia_approval_requests" ADD COLUMN IF NOT EXISTS "tool_policy_snapshot" jsonb;
