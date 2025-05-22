#!/usr/bin/env node

/**
 * Database Initialization Script for Deployment
 * 
 * This script ensures the database schema is correctly set up during deployment.
 * Run this script before starting the application in production to avoid database-related issues.
 * 
 * This script will also call seed-test-data.cjs to ensure test accounts are available in the deployed environment.
 */

const { Pool } = require('pg');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execPromise = promisify(exec);

// Get database connection from environment
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set to run the initialization script");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
    
    if (usersResult.rows.length === 0) {
      console.log('Users table not found, creating it...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          name TEXT,
          business_name TEXT,
          contact_name TEXT,
          is_searching BOOLEAN DEFAULT FALSE,
          is_selling BOOLEAN DEFAULT FALSE,
          location_country TEXT,
          location_radius_km INTEGER,
          preferred_disciplines TEXT[],
          preferred_levels TEXT[],
          preferred_breeds TEXT[],
          age_range_min INTEGER,
          age_range_max INTEGER,
          height_range_min REAL,
          height_range_max REAL,
          preferred_sexes TEXT[],
          breeding_preferences TEXT,
          preferred_characteristics TEXT[],
          price_range_min INTEGER,
          price_range_max INTEGER,
          currency TEXT,
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          subscription_status TEXT,
          subscription_plan TEXT,
          subscription_end_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Users table created successfully');
    } else {
      const userColumns = usersResult.rows.map(row => row.column_name);
      console.log(`Found ${userColumns.length} columns in users table`);
    
      // Check for missing columns in users table, particularly the Stripe-related ones
      const requiredUserColumns = [
        'id', 'email', 'password', 'name', 'business_name', 'contact_name',
        'is_searching', 'is_selling', 'location_country', 'location_radius_km',
        'preferred_disciplines', 'preferred_levels', 'preferred_breeds',
        'age_range_min', 'age_range_max', 'height_range_min', 'height_range_max',
        'preferred_sexes', 'breeding_preferences', 'preferred_characteristics',
        'price_range_min', 'price_range_max', 'currency',
        'stripe_customer_id', 'stripe_subscription_id', 'subscription_status', 
        'subscription_plan', 'subscription_end_date', 'created_at'
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
            if (column === 'name') {
              await pool.query(`ALTER TABLE users ADD COLUMN name TEXT`);
            } else if (column === 'business_name') {
              await pool.query(`ALTER TABLE users ADD COLUMN business_name TEXT`);
            } else if (column === 'contact_name') {
              await pool.query(`ALTER TABLE users ADD COLUMN contact_name TEXT`);
            } else if (column === 'is_searching') {
              await pool.query(`ALTER TABLE users ADD COLUMN is_searching BOOLEAN DEFAULT FALSE`);
            } else if (column === 'is_selling') {
              await pool.query(`ALTER TABLE users ADD COLUMN is_selling BOOLEAN DEFAULT FALSE`);
            } else if (column === 'location_country') {
              await pool.query(`ALTER TABLE users ADD COLUMN location_country TEXT`);
            } else if (column === 'location_radius_km') {
              await pool.query(`ALTER TABLE users ADD COLUMN location_radius_km INTEGER`);
            } else if (column === 'preferred_disciplines') {
              await pool.query(`ALTER TABLE users ADD COLUMN preferred_disciplines TEXT[]`);
            } else if (column === 'preferred_levels') {
              await pool.query(`ALTER TABLE users ADD COLUMN preferred_levels TEXT[]`);
            } else if (column === 'preferred_breeds') {
              await pool.query(`ALTER TABLE users ADD COLUMN preferred_breeds TEXT[]`);
            } else if (column === 'age_range_min') {
              await pool.query(`ALTER TABLE users ADD COLUMN age_range_min INTEGER`);
            } else if (column === 'age_range_max') {
              await pool.query(`ALTER TABLE users ADD COLUMN age_range_max INTEGER`);
            } else if (column === 'height_range_min') {
              await pool.query(`ALTER TABLE users ADD COLUMN height_range_min REAL`);
            } else if (column === 'height_range_max') {
              await pool.query(`ALTER TABLE users ADD COLUMN height_range_max REAL`);
            } else if (column === 'preferred_sexes') {
              await pool.query(`ALTER TABLE users ADD COLUMN preferred_sexes TEXT[]`);
            } else if (column === 'breeding_preferences') {
              await pool.query(`ALTER TABLE users ADD COLUMN breeding_preferences TEXT`);
            } else if (column === 'preferred_characteristics') {
              await pool.query(`ALTER TABLE users ADD COLUMN preferred_characteristics TEXT[]`);
            } else if (column === 'price_range_min') {
              await pool.query(`ALTER TABLE users ADD COLUMN price_range_min INTEGER`);
            } else if (column === 'price_range_max') {
              await pool.query(`ALTER TABLE users ADD COLUMN price_range_max INTEGER`);
            } else if (column === 'currency') {
              await pool.query(`ALTER TABLE users ADD COLUMN currency TEXT`);
            } else if (column === 'stripe_customer_id') {
              await pool.query(`ALTER TABLE users ADD COLUMN stripe_customer_id TEXT`);
            } else if (column === 'stripe_subscription_id') {
              await pool.query(`ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT`);
            } else if (column === 'subscription_status') {
              await pool.query(`ALTER TABLE users ADD COLUMN subscription_status TEXT`);
            } else if (column === 'subscription_plan') {
              await pool.query(`ALTER TABLE users ADD COLUMN subscription_plan TEXT`);
            } else if (column === 'subscription_end_date') {
              await pool.query(`ALTER TABLE users ADD COLUMN subscription_end_date TIMESTAMP`);
            } else if (column === 'created_at') {
              await pool.query(`ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW()`);
            }
            console.log(`Added column: ${column}`);
          } catch (err) {
            console.error(`Error adding column ${column}:`, err.message);
          }
        }
      } else {
        console.log('All required columns exist in users table');
      }
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
    
    // Check for all required tables in the schema
    console.log('Checking for all required database tables...');
    const requiredTables = ['horses', 'matches', 'messages', 'conversations', 'push_subscriptions', 'notifications'];
    
    for (const tableName of requiredTables) {
      try {
        console.log(`Checking for ${tableName} table...`);
        const tableCheck = await pool.query(`
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = $1
        `, [tableName]);
        
        if (tableCheck.rows.length === 0) {
          console.log(`Table ${tableName} not found, creating it...`);
          
          // Create the table based on our schema definitions
          if (tableName === 'horses') {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS horses (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                location_country TEXT NOT NULL,
                location_radius_km INTEGER,
                disciplines TEXT[] NOT NULL,
                levels TEXT[] NOT NULL,
                breeds TEXT[] NOT NULL,
                age INTEGER NOT NULL,
                height_hands REAL,
                height_cm INTEGER,
                sex TEXT NOT NULL,
                sire TEXT,
                dam TEXT,
                dam_sire TEXT,
                characteristics TEXT[],
                price_min INTEGER NOT NULL,
                price_max INTEGER NOT NULL,
                currency TEXT NOT NULL,
                description TEXT,
                photos TEXT[] NOT NULL,
                videos TEXT[],
                created_at TIMESTAMP DEFAULT NOW()
              )
            `);
          } else if (tableName === 'matches') {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS matches (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                horse_id INTEGER NOT NULL,
                is_liked BOOLEAN NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
              )
            `);
          } else if (tableName === 'messages') {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                owner_id INTEGER NOT NULL,
                horse_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                sender_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                is_read BOOLEAN DEFAULT FALSE
              )
            `);
          } else if (tableName === 'conversations') {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                owner_id INTEGER NOT NULL,
                horse_id INTEGER NOT NULL,
                last_message_id INTEGER,
                last_message_time TIMESTAMP,
                unread_count INTEGER DEFAULT 0
              )
            `);
          } else if (tableName === 'push_subscriptions') {
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
          } else if (tableName === 'notifications') {
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
          }
          
          console.log(`Table ${tableName} created successfully`);
        } else {
          console.log(`Table ${tableName} exists`);
        }
      } catch (err) {
        console.error(`Error checking/creating ${tableName} table:`, err.message);
      }
    }
    
    console.log('Database initialization completed successfully!');
    
    // Run the seed test data script to ensure test accounts are present
    try {
      console.log('Running seed test data script...');
      const scriptPath = path.resolve('./scripts/seed-test-data.cjs');
      
      // Make sure DATABASE_URL is available to the seed script
      const env = { ...process.env };
      
      const { stdout, stderr } = await execPromise(`node ${scriptPath}`, { 
        env: env,
        maxBuffer: 10 * 1024 * 1024 // Increase buffer size to 10MB
      });
      
      if (stdout) {
        console.log('Seed script output:', stdout);
      }
      
      if (stderr) {
        console.error('Seed script error output:', stderr);
      }
      
      console.log('Seed test data completed!');
    } catch (seedError) {
      console.error('Failed to run seed test data script:', seedError);
      console.error('Error details:', seedError.message);
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