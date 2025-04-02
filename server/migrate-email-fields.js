import { pool } from './db.js';

async function migrateEmailFields() {
  console.log('Starting email verification fields migration...');
  
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if email_verified column exists
    const checkEmailVerifiedColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email_verified'
    `);
    
    if (checkEmailVerifiedColumn.rows.length === 0) {
      console.log('Adding email_verified column...');
      await client.query(`
        ALTER TABLE users
        ADD COLUMN email_verified BOOLEAN DEFAULT FALSE
      `);
    } else {
      console.log('email_verified column already exists.');
    }
    
    // Check if verification_code column exists
    const checkVerificationCodeColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'verification_code'
    `);
    
    if (checkVerificationCodeColumn.rows.length === 0) {
      console.log('Adding verification_code column...');
      await client.query(`
        ALTER TABLE users
        ADD COLUMN verification_code TEXT
      `);
    } else {
      console.log('verification_code column already exists.');
    }
    
    // Check if verification_code_expires column exists
    const checkVerificationCodeExpiresColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'verification_code_expires'
    `);
    
    if (checkVerificationCodeExpiresColumn.rows.length === 0) {
      console.log('Adding verification_code_expires column...');
      await client.query(`
        ALTER TABLE users
        ADD COLUMN verification_code_expires TIMESTAMP
      `);
    } else {
      console.log('verification_code_expires column already exists.');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Email verification fields migration completed successfully.');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error during email verification fields migration:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// We won't auto-run this in ESM modules
// The migration will be called directly from routes.ts

export default migrateEmailFields;