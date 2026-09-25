import { pgTable, text, timestamp, varchar, integer, numeric, jsonb, index, unique, foreignKey } from 'drizzle-orm/pg-core';
import { instancesTable } from './instances.ts';
import { contatosTable } from './contatos.ts';
import { dealsTable } from './deals.ts';
import { usersTable } from './users.ts';

export const ordensServicoTable = pgTable(
  'ordens_servico',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    instanceId: varchar('instance_id', { length: 64 }).notNull().references(() => instancesTable.id, { onDelete: 'cascade' }),
    dealId: varchar('deal_id', { length: 64 }).references(() => dealsTable.id),
    contatoId: varchar('contato_id', { length: 64 }).notNull().references(() => contatosTable.id),
    clienteNome: varchar('cliente_nome', { length: 255 }).notNull(),
    telefone: varchar('telefone', { length: 32 }).notNull(),
    endereco: text('endereco').notNull(),
    bairro: varchar('bairro', { length: 128 }).notNull(),
    tipo: varchar('tipo', { length: 32 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('AGENDADA'),
    planoNome: varchar('plano_nome', { length: 255 }).notNull(),
    tecnicoId: varchar('tecnico_id', { length: 64 }).notNull().references(() => usersTable.id),
    tecnicoNome: varchar('tecnico_nome', { length: 255 }).notNull(),
    dataAgendada: varchar('data_agendada', { length: 32 }).notNull(),
    periodo: varchar('periodo', { length: 16 }).notNull().default('MANHA'),
    ctoDesignada: varchar('cto_designada', { length: 64 }).notNull(),
    portaCto: integer('porta_cto').notNull().default(1),
    sinalOpticoDbm: numeric('sinal_optico_dbm', { precision: 5, scale: 2 }),
    metragemDropMetros: integer('metragem_drop_metros'),
    ontSerialGpon: varchar('ont_serial_gpon', { length: 64 }),
    roteadorWifi6Serial: varchar('roteador_wifi6_serial', { length: 64 }),
    checklist: jsonb('checklist').$type<{
      passagemDrop: boolean;
      conectorizacaoFusao: boolean;
      testePotenciaOptica: boolean;
      provisionamentoOLT: boolean;
      speedtestValido: boolean;
      assinaturaCliente: boolean;
    }>().notNull(),
    observacoes: text('observacoes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    uqOsInstance: unique('uq_ordens_servico_id_instance').on(table.id, table.instanceId),
    fkOsContatoInstance: foreignKey({
      name: 'fk_os_contato_instance',
      columns: [table.contatoId, table.instanceId],
      foreignColumns: [contatosTable.id, contatosTable.instanceId]
    }),
    fkOsTecnicoInstance: foreignKey({
      name: 'fk_os_tecnico_instance',
      columns: [table.tecnicoId, table.instanceId],
      foreignColumns: [usersTable.id, usersTable.instanceId]
    }),
    instanceIdx: index('idx_os_instance').on(table.instanceId),
    statusIdx: index('idx_os_status').on(table.status),
    tecnicoIdx: index('idx_os_tecnico').on(table.tecnicoId)
  })
);

export type OrdemServicoDb = typeof ordensServicoTable.$inferSelect;
export type NewOrdemServicoDb = typeof ordensServicoTable.$inferInsert;
