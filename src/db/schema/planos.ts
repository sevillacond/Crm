import { pgTable, text, timestamp, varchar, integer, numeric, boolean, jsonb } from 'drizzle-orm/pg-core';
import { instancesTable } from './instances.ts';

export const planosTable = pgTable('planos', {
  id: varchar('id', { length: 64 }).primaryKey(),
  instanceId: varchar('instance_id', { length: 64 }).notNull().references(() => instancesTable.id, { onDelete: 'cascade' }),
  nome: varchar('nome', { length: 255 }).notNull(),
  downloadMbps: integer('download_mbps').notNull(),
  uploadMbps: integer('upload_mbps').notNull(),
  precoMensal: numeric('preco_mensal', { precision: 10, scale: 2 }).notNull(),
  adesao: numeric('adesao', { precision: 10, scale: 2 }).notNull().default('0.00'),
  tecnologia: varchar('tecnologia', { length: 64 }).notNull(),
  popular: boolean('popular').notNull().default(false),
  recursos: jsonb('recursos').$type<string[]>().notNull().default([]),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type PlanoDb = typeof planosTable.$inferSelect;
export type NewPlanoDb = typeof planosTable.$inferInsert;
