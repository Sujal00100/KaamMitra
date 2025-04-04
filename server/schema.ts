import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

// Define your users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  password: text('password'),
  role: text('role', { enum: ['ADMIN', 'USER', 'WORKER'] }).default('USER'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

// Define jobs table
export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  salary: text('salary'),
  userId: text('user_id').notNull().references(() => users.id),
  status: text('status', { enum: ['OPEN', 'ASSIGNED', 'COMPLETED'] }).default('OPEN'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

// Add more tables as needed for your application