#!/usr/bin/env node

/**
 * Create Notification Tables Script
 * 
 * This script creates the push notification related tables in the database.
 */

import { Pool } from 'pg';

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTables() {
  console.log('Creating push notification tables...');
  
  try {
    // Start a transaction
    await pool.query('BEGIN');
    
    // Create push_subscriptions table
    console.log('Creating push_subscriptions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL,
        auth_key TEXT NOT NULL,
        p256dh_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        subscription_data JSONB NOT NULL,
        notify_for_matches BOOLEAN DEFAULT TRUE,
        notify_for_messages BOOLEAN DEFAULT TRUE
      )
    `);
    
    // Create notifications table
    console.log('Creating notifications table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        data JSONB,
        action_url TEXT
      )
    `);
    
    // Create indexes for better performance
    console.log('Creating indexes...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read)`);
    
    // Commit transaction
    await pool.query('COMMIT');
    
    console.log('Push notification tables created successfully!');
  } catch (error) {
    // Rollback transaction on error
    await pool.query('ROLLBACK');
    console.error('Error creating push notification tables:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the migration
createTables().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});