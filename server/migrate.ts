import { db } from './db';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as path from 'path';

// Run migrations
async function runMigrations() {
  console.log('Running database migrations...');
  try {
    // This path should point to the directory containing your migration files
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

// Execute the migration if this script is run directly
if (import.meta.url.endsWith('migrate.ts')) {
  runMigrations()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { runMigrations };