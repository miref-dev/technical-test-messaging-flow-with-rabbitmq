import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey(),
  sender: text('sender').notNull(),
  receiver: text('receiver').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  templateCategory: text('template_category'),
  status: text('status').notNull(),
  attempts: integer('attempts').default(0),
  failReason: text('fail_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
});

export type DBMessage = typeof messages.$inferSelect;
export type NewDBMessage = typeof messages.$inferInsert;
