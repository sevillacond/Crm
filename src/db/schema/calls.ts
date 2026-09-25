import { pgTable, varchar, timestamp, integer, text } from 'drizzle-orm/pg-core';
import { instancesTable } from './instances.ts';
import { contatosTable } from './contatos.ts';
import { usersTable } from './users.ts';

export const callsTable = pgTable('calls', {
  id: varchar('id', { length: 64 }).primaryKey(),
  instanceId: varchar('instance_id', { length: 64 })
    .notNull()
    .references(() => instancesTable.id, { onDelete: 'cascade' }),
  providerCallId: varchar('provider_call_id', { length: 128 }),
  asteriskChannelId: varchar('asterisk_channel_id', { length: 128 }),
  ramal: varchar('ramal', { length: 64 }).notNull(),
  origem: varchar('origem', { length: 64 }).notNull(),
  destino: varchar('destino', { length: 64 }).notNull(),
  contatoId: varchar('contato_id', { length: 64 }).references(() => contatosTable.id, { onDelete: 'set null' }),
  direcao: varchar('direcao', { length: 16 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  duracaoSegundos: integer('duracao_segundos').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  answeredAt: timestamp('answered_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  recordingUrl: text('recording_url'),
  notasOperador: text('notas_operador'),
  operadorId: varchar('operador_id', { length: 64 }).references(() => usersTable.id, { onDelete: 'set null' }),
  operadorNome: varchar('operador_nome', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type CallDb = typeof callsTable.$inferSelect;
export type InsertCallDb = typeof callsTable.$inferInsert;
