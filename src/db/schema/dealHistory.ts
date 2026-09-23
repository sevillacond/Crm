import { pgTable, text, timestamp, varchar, index } from 'drizzle-orm/pg-core';
import { dealsTable } from './deals.ts';
import { usersTable } from './users.ts';

export const dealHistoryTable = pgTable(
  'deal_history',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    dealId: varchar('deal_id', { length: 64 }).notNull().references(() => dealsTable.id, { onDelete: 'cascade' }),
    etapaAnterior: varchar('etapa_anterior', { length: 32 }).notNull(),
    etapaNova: varchar('etapa_nova', { length: 32 }).notNull(),
    motivo: text('motivo'),
    userId: varchar('user_id', { length: 64 }).notNull().references(() => usersTable.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    dealIdx: index('idx_deal_history_deal_id').on(table.dealId),
    createdAtIdx: index('idx_deal_history_created_at').on(table.createdAt)
  })
);

export type DealHistoryDb = typeof dealHistoryTable.$inferSelect;
export type NewDealHistoryDb = typeof dealHistoryTable.$inferInsert;
