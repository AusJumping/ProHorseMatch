#!/usr/bin/env node

/**
 * Database Initialization Script for Deployment
 * 
 * This script ensures the database schema is correctly set up during deployment.
 * Run this script before starting the application in production to avoid database-related issues.
 * 
 * This script will also call seed-test-data.js to ensure test accounts are available in the deployed environment.
 */

import { pool, db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { sql } from 'drizzle-orm';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

async function initializeDatabase() {
  console.log('Starting database initialization...');
  
  try {
    // Check database connection
    console.log('Checking database connection...');
    await pool.query('SELECT NOW()');
    console.log('Database connection successful!');
    
    // Verify all required tables exist
    console.log('Verifying database schema...');
    
    // Check if users table exists and has the required columns
    console.log('Checking users table...');
    const usersResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const userColumns = usersResult.rows.map(row => row.column_name);
    console.log(`Found ${userColumns.length} columns in users table`);
    
    // Check for missing columns in users table, particularly the Stripe-related ones
    const requiredUserColumns = [
      'id', 'email', 'password', 'stripe_customer_id', 
      'stripe_subscription_id', 'subscription_status', 
      'subscription_plan', 'subscription_end_date'
    ];
    
    const missingUserColumns = requiredUserColumns.filter(
      col => !userColumns.includes(col)
    );
    
    if (missingUserColumns.length > 0) {
      console.log(`Missing columns in users table: ${missingUserColumns.join(', ')}`);
      console.log('Adding missing columns...');
      
      // Add missing columns
      for (const column of missingUserColumns) {
        try {
          if (column === 'stripe_customer_id') {
            await pool.query(`ALTER TABLE users ADD COLUMN stripe_customer_id TEXT`);
          } else if (column === 'stripe_subscription_id') {
            await pool.query(`ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT`);
          } else if (column === 'subscription_status') {
            await pool.query(`ALTER TABLE users ADD COLUMN subscription_status TEXT`);
          } else if (column === 'subscription_plan') {
            await pool.query(`ALTER TABLE users ADD COLUMN subscription_plan TEXT`);
          } else if (column === 'subscription_end_date') {
            await pool.query(`ALTER TABLE users ADD COLUMN subscription_end_date TIMESTAMP`);
          }
          console.log(`Added column: ${column}`);
        } catch (err) {
          console.error(`Error adding column ${column}:`, err.message);
        }
      }
    } else {
      console.log('All required columns exist in users table');
    }
    
    // Check if sessions table exists for authentication
    console.log('Checking sessions table for authentication...');
    try {
      const sessionsCheck = await pool.query(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sessions'
      `);
      
      if (sessionsCheck.rows.length === 0) {
        console.log('Sessions table not found, creating it...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS sessions (
            sid VARCHAR PRIMARY KEY,
            sess JSON NOT NULL,
            expire TIMESTAMP NOT NULL
          )
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire)`);
        console.log('Sessions table created successfully');
      } else {
        console.log('Sessions table exists');
      }
    } catch (err) {
      console.error('Error checking/creating sessions table:', err.message);
    }
    
    console.log('Database initialization completed successfully!');
    
    // Run the seed test data script to ensure test accounts are present
    try {
      console.log('Running seed test data script...');
      const scriptPath = path.resolve('./scripts/seed-test-data.js');
      const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
      
      if (stdout) {
        console.log('Seed script output:', stdout);
      }
      
      if (stderr) {
        console.error('Seed script error output:', stderr);
      }
      
      console.log('Seed test data completed!');
    } catch (seedError) {
      console.error('Failed to run seed test data script:', seedError);
      // We don't exit here as the main initialization was successful
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the initialization
initializeDatabase().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});