import { pgTable, text, timestamp, varchar, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { instancesTable } from './instances.ts';

export const contatosTable = pgTable(
  'contatos',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    instanceId: varchar('instance_id', { length: 64 }).notNull().references(() => instancesTable.id, { onDelete: 'cascade' }),
    nome: varchar('nome', { length: 255 }).notNull(),
    cpfCnpj: varchar('cpf_cnpj', { length: 32 }).notNull().default(''),
    telefone: varchar('telefone', { length: 32 }).notNull().default(''),
    email: varchar('email', { length: 255 }).notNull().default(''),
    cep: varchar('cep', { length: 16 }).notNull().default('13000-000'),
    logradouro: text('logradouro').notNull().default(''),
    numero: varchar('numero', { length: 32 }).notNull().default(''),
    complemento: text('complemento'),
    bairro: varchar('bairro', { length: 128 }).notNull().default(''),
    cidade: varchar('cidade', { length: 128 }).notNull().default(''),
    uf: varchar('uf', { length: 2 }).notNull().default('SP'),
    status: varchar('status', { length: 32 }).notNull().default('NOVO'),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    scoreMaia: integer('score_maia'),
    resumoMaia: text('resumo_maia'),
    origem: varchar('origem', { length: 32 }).notNull().default('SITE'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ultimoContato: timestamp('ultimo_contato', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    instanceIdx: index('idx_contatos_instance').on(table.instanceId),
    cpfCnpjIdx: index('idx_contatos_cpf_cnpj').on(table.cpfCnpj),
    telefoneIdx: index('idx_contatos_telefone').on(table.telefone),
    statusIdx: index('idx_contatos_status').on(table.status),
    deletedAtIdx: index('idx_contatos_deleted_at').on(table.deletedAt)
  })
);

export type ContatoDb = typeof contatosTable.$inferSelect;
export type NewContatoDb = typeof contatosTable.$inferInsert;
