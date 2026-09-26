import { pgTable, varchar, timestamp, text, jsonb, index } from 'drizzle-orm/pg-core';
import { instancesTable } from './instances.ts';
import { usersTable } from './users.ts';

export const maiaConversationsTable = pgTable(
  'maia_conversations',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    instanceId: varchar('instance_id', { length: 64 })
      .notNull()
      .references(() => instancesTable.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull().default('Nova Conversa'),
    dealId: varchar('deal_id', { length: 64 }),
    contatoId: varchar('contato_id', { length: 64 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    instanceIdx: index('idx_maia_conv_instance').on(table.instanceId),
    userIdx: index('idx_maia_conv_user').on(table.userId),
    createdAtIdx: index('idx_maia_conv_created_at').on(table.createdAt)
  })
);

export const maiaMessagesTable = pgTable(
  'maia_messages',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    conversationId: varchar('conversation_id', { length: 64 })
      .notNull()
      .references(() => maiaConversationsTable.id, { onDelete: 'cascade' }),
    instanceId: varchar('instance_id', { length: 64 })
      .notNull()
      .references(() => instancesTable.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 32 }).notNull(), // 'user' | 'assistant' | 'system' | 'tool'
    content: text('content').notNull(),
    toolCalls: jsonb('tool_calls'),
    toolResults: jsonb('tool_results'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    convIdx: index('idx_maia_msg_conv').on(table.conversationId),
    instanceIdx: index('idx_maia_msg_instance').on(table.instanceId),
    createdAtIdx: index('idx_maia_msg_created_at').on(table.createdAt)
  })
);

export type MaiaConversationDb = typeof maiaConversationsTable.$inferSelect;
export type NewMaiaConversationDb = typeof maiaConversationsTable.$inferInsert;
export type MaiaMessageDb = typeof maiaMessagesTable.$inferSelect;
export type NewMaiaMessageDb = typeof maiaMessagesTable.$inferInsert;
