import { pgTable, text, timestamp, varchar, integer, numeric, jsonb, index } from 'drizzle-orm/pg-core';
import { instancesTable } from './instances.ts';
import { contatosTable } from './contatos.ts';
import { planosTable } from './planos.ts';
import { usersTable } from './users.ts';

export const dealsTable = pgTable(
  'deals',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    instanceId: varchar('instance_id', { length: 64 }).notNull().references(() => instancesTable.id, { onDelete: 'cascade' }),
    titulo: varchar('titulo', { length: 255 }).notNull(),
    contatoId: varchar('contato_id', { length: 64 }).notNull().references(() => contatosTable.id, { onDelete: 'cascade' }),
    planoId: varchar('plano_id', { length: 64 }).notNull().references(() => planosTable.id),
    etapa: varchar('etapa', { length: 32 }).notNull().default('NOVO_LEAD'),
    valorMensal: numeric('valor_mensal', { precision: 10, scale: 2 }).notNull().default('0.00'),
    taxaAdesao: numeric('taxa_adesao', { precision: 10, scale: 2 }).notNull().default('0.00'),
    probabilidade: integer('probabilidade').notNull().default(20),
    dataPrevisao: varchar('data_previsao', { length: 32 }).notNull(),
    responsavelId: varchar('responsavel_id', { length: 64 }).notNull().references(() => usersTable.id),
    statusViabilidade: varchar('status_viabilidade', { length: 32 }).notNull().default('PENDENTE'),
    ctoProxima: varchar('cto_proxima', { length: 64 }),
    distanciaMetros: integer('distancia_metros'),
    motivoPerda: text('motivo_perda'),
    notas: jsonb('notas').$type<string[]>().notNull().default([]),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    instanceIdx: index('idx_deals_instance').on(table.instanceId),
    contatoIdx: index('idx_deals_contato').on(table.contatoId),
    etapaIdx: index('idx_deals_etapa').on(table.etapa),
    responsavelIdx: index('idx_deals_responsavel').on(table.responsavelId)
  })
);

export type DealDb = typeof dealsTable.$inferSelect;
export type NewDealDb = typeof dealsTable.$inferInsert;
