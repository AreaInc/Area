import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Just an example for testing, nothing to see
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
