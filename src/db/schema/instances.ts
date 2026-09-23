import { pgTable, text, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

export const instancesTable = pgTable('instances', {
  id: varchar('id', { length: 64 }).primaryKey(),
  cnpj: varchar('cnpj', { length: 32 }).notNull().unique(),
  razaoSocial: text('razao_social').notNull(),
  nomeFantasia: text('nome_fantasia').notNull(),
  cidadeSede: text('cidade_sede').notNull(),
  uf: varchar('uf', { length: 2 }).notNull(),
  timezone: varchar('timezone', { length: 64 }).notNull().default('America/Sao_Paulo (BRT)'),
  status: varchar('status', { length: 32 }).notNull().default('ISOLADA_ATIVA'),
  databaseEngine: text('database_engine').notNull().default('PostgreSQL 16.2 (Dedicado)'),
  sgpIntegrado: varchar('sgp_integrado', { length: 64 }).notNull().default('IXC Soft'),
  totalCtos: integer('total_ctos').notNull().default(0),
  totalPortasDisponiveis: integer('total_portas_disponiveis').notNull().default(0),
  versaoMaia: varchar('versao_maia', { length: 64 }).notNull().default('MaIA v3.8 Flash (Tool Gateway RBAC)'),
  maiaNivelAutonomia: integer('maia_nivel_autonomia').notNull().default(3),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type InstanceDb = typeof instancesTable.$inferSelect;
export type NewInstanceDb = typeof instancesTable.$inferInsert;
