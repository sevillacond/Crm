import { pgTable, varchar, timestamp, text, jsonb } from 'drizzle-orm/pg-core';
import { instancesTable } from './instances.ts';

export const maiaApprovalRequestsTable = pgTable('maia_approval_requests', {
  id: varchar('id', { length: 64 }).primaryKey(),
  instanceId: varchar('instance_id', { length: 64 })
    .notNull()
    .references(() => instancesTable.id, { onDelete: 'cascade' }),
  toolName: varchar('tool_name', { length: 128 }).notNull(),
  params: jsonb('params').notNull(),
  paramsHash: varchar('params_hash', { length: 128 }).notNull(),
  policyVersion: varchar('policy_version', { length: 64 }).notNull().default('v1'),
  requestedByUserId: varchar('requested_by_user_id', { length: 64 }).notNull(),
  requestedByName: varchar('requested_by_name', { length: 255 }).notNull(),
  requestedByRole: varchar('requested_by_role', { length: 64 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('PENDING_APPROVAL'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedByUserId: varchar('resolved_by_user_id', { length: 64 }),
  resolvedByName: varchar('resolved_by_name', { length: 255 }),
  resolvedByRole: varchar('resolved_by_role', { length: 64 }),
  rejectionReason: text('rejection_reason'),
  executedByUserId: varchar('executed_by_user_id', { length: 64 }),
  executedByName: varchar('executed_by_name', { length: 255 }),
  executedByRole: varchar('executed_by_role', { length: 64 }),
  executionResult: jsonb('execution_result'),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  requestId: varchar('request_id', { length: 64 }),
  correlationId: varchar('correlation_id', { length: 64 })
});

export type MaiaApprovalRequestDb = typeof maiaApprovalRequestsTable.$inferSelect;
export type NewMaiaApprovalRequestDb = typeof maiaApprovalRequestsTable.$inferInsert;
