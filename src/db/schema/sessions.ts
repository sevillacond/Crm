import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { usersTable } from './users.ts';
import { instancesTable } from './instances.ts';

export const sessionsTable = pgTable('sessions', {
  id: varchar('id', { length: 128 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  instanceId: varchar('instance_id', { length: 64 }).notNull().references(() => instancesTable.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type SessionDb = typeof sessionsTable.$inferSelect;
export type NewSessionDb = typeof sessionsTable.$inferInsert;
