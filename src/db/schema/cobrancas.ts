import { pgTable, varchar, timestamp, numeric, text } from 'drizzle-orm/pg-core';
import { instancesTable } from './instances.ts';
import { contatosTable } from './contatos.ts';
import { dealsTable } from './deals.ts';

export const cobrancasTable = pgTable('cobrancas', {
  id: varchar('id', { length: 64 }).primaryKey(),
  instanceId: varchar('instance_id', { length: 64 })
    .notNull()
    .references(() => instancesTable.id, { onDelete: 'cascade' }),
  txid: varchar('txid', { length: 128 }).unique(),
  contatoId: varchar('contato_id', { length: 64 }).references(() => contatosTable.id, { onDelete: 'set null' }),
  dealId: varchar('deal_id', { length: 64 }).references(() => dealsTable.id, { onDelete: 'set null' }),
  faturaId: varchar('fatura_id', { length: 64 }).notNull(),
  valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('PENDENTE'),
  pixCopiaECola: text('pix_copia_e_cola'),
  chavePix: varchar('chave_pix', { length: 128 }),
  provider: varchar('provider', { length: 64 }).notNull().default('NOT_CONFIGURED'),
  providerEventId: varchar('provider_event_id', { length: 128 }),
  e2eId: varchar('e2e_id', { length: 128 }),
  idempotencyKey: varchar('idempotency_key', { length: 128 }),
  pagoEm: timestamp('pago_em', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const webhookEventsTable = pgTable('webhook_events', {
  id: varchar('id', { length: 64 }).primaryKey(),
  provider: varchar('provider', { length: 32 }).notNull(),
  eventId: varchar('event_id', { length: 128 }).notNull().unique(),
  payloadHash: varchar('payload_hash', { length: 64 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('PROCESSED'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type CobrancaDb = typeof cobrancasTable.$inferSelect;
export type InsertCobrancaDb = typeof cobrancasTable.$inferInsert;
export type WebhookEventDb = typeof webhookEventsTable.$inferSelect;
