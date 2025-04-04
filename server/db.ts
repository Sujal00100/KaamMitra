import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as path from 'path';

// Define the database path relative to the project root
const dbPath = path.resolve(process.cwd(), 'sqlite.db');

// Create a database connection
const sqlite = new Database(dbPath);

// Create the Drizzle instance
export const db = drizzle(sqlite);

console.log(`SQLite database initialized at: ${dbPath}`);

// Add a dummy pool export to maintain compatibility with existing code
export const pool = {
  connect: () => Promise.resolve({}),
  end: () => Promise.resolve(),
  query: () => Promise.resolve({ rows: [] }),
  on: () => {},
};