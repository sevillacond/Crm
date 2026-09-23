import { pgTable, text, timestamp, varchar, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { instancesTable } from './instances.ts';

export const auditEventsTable = pgTable(
  'audit_events',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    instanceId: varchar('instance_id', { length: 64 }).notNull().references(() => instancesTable.id, { onDelete: 'cascade' }),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    actorId: varchar('actor_id', { length: 64 }).notNull(),
    actorName: varchar('actor_name', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 32 }).notNull(),
    action: varchar('action', { length: 128 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: varchar('entity_id', { length: 64 }).notNull(),
    details: text('details').notNull(),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    requestId: varchar('request_id', { length: 64 }),
    correlationId: varchar('correlation_id', { length: 64 }),
    dadosAnteriores: jsonb('dados_anteriores'),
    dadosPosteriores: jsonb('dados_posteriores'),
    origem: varchar('origem', { length: 64 }).notNull().default('WEB_CRM'),
    resultado: varchar('resultado', { length: 32 }).notNull().default('SUCESSO'),
    isMaiaAction: boolean('is_maia_action').notNull().default(false),
    previousHash: varchar('previous_hash', { length: 128 }),
    hashIntegridade: varchar('hash_integridade', { length: 128 })
  },
  (table) => ({
    instanceIdx: index('idx_audit_events_instance').on(table.instanceId),
    timestampIdx: index('idx_audit_events_timestamp').on(table.timestamp),
    actorIdx: index('idx_audit_events_actor').on(table.actorId),
    entityIdx: index('idx_audit_events_entity').on(table.entityType, table.entityId)
  })
);

export type AuditEventDb = typeof auditEventsTable.$inferSelect;
export type NewAuditEventDb = typeof auditEventsTable.$inferInsert;
