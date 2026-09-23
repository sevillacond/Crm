import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { instancesTable } from './instances.ts';
import { rolesTable } from './roles.ts';

export const usersTable = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  instanceId: varchar('instance_id', { length: 64 }).notNull().references(() => instancesTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 32 }).notNull().references(() => rolesTable.id),
  avatar: text('avatar').notNull().default(''),
  department: varchar('department', { length: 128 }).notNull().default('Geral'),
  status: varchar('status', { length: 32 }).notNull().default('OFFLINE'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type UserDb = typeof usersTable.$inferSelect;
export type NewUserDb = typeof usersTable.$inferInsert;
