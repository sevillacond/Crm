import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const rolesTable = pgTable('roles', {
  id: varchar('id', { length: 32 }).primaryKey(), // 'ADMIN', 'SUPERVISOR', 'ATENDENTE', 'TECNICO', 'MAIA_AGENT'
  nome: varchar('nome', { length: 64 }).notNull(),
  descricao: text('descricao').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const permissionsTable = pgTable('permissions', {
  id: varchar('id', { length: 64 }).primaryKey(), // ex: 'deals:read', 'deals:write', 'audit:read'
  modulo: varchar('modulo', { length: 32 }).notNull(),
  acao: varchar('acao', { length: 32 }).notNull(),
  descricao: text('descricao').notNull()
});

export const rolePermissionsTable = pgTable('role_permissions', {
  roleId: varchar('role_id', { length: 32 }).notNull().references(() => rolesTable.id, { onDelete: 'cascade' }),
  permissionId: varchar('permission_id', { length: 64 }).notNull().references(() => permissionsTable.id, { onDelete: 'cascade' })
});
