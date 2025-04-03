import { db } from "./db.js";
import { sql } from "drizzle-orm";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from 'url';

async function migrate() {
  console.log("Starting database schema upgrade...");

  try {
    // Check if the table exists first
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log("Users table doesn't exist. Please run the regular database setup first.");
      return;
    }

    // Add new columns to users table
    console.log("Adding new verification columns to users table...");
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS date_of_birth DATE,
      ADD COLUMN IF NOT EXISTS age INTEGER,
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'not_submitted' NOT NULL
    `);

    // Create verification_documents table if it doesn't exist
    console.log("Creating verification_documents table if it doesn't exist...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS verification_documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        document_type VARCHAR(20) NOT NULL,
        document_number VARCHAR(50) NOT NULL,
        document_image_url TEXT,
        verification_notes TEXT,
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        reviewed_at TIMESTAMP
      )
    `);

    console.log("Database schema upgrade completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

// Execute the migration if this script is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  migrate()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrate };