// Direct database initialization for user accounts
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Configure Neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;

// Load environment variables
dotenv.config();

console.log('Starting direct user initialization...');

// Define sample users
const sampleUsers = [
  {
    id: 3,
    email: 'owner@example.com',
    password: 'password123',
    name: 'Test Owner',
    business_name: 'Elite Sporthorses',
    contact_name: 'John Smith',
    is_selling: true,
    is_searching: true,
    location_country: 'Australia',
    stripe_subscription_id: 'beta-1747733745568',
    subscription_status: 'active',
    subscription_plan: 'beta-seller',
    subscription_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    preferred_disciplines: [],
    preferred_levels: [],
    preferred_breeds: [],
    age_range_min: 0,
    age_range_max: 999,
    height_range_min: 13,
    height_range_max: 99,
    preferred_sexes: [],
    breeding_preferences: '',
    preferred_characteristics: [],
    price_range_min: 0,
    price_range_max: 999999999,
    currency: 'AUD'
  },
  {
    id: 4,
    email: 'customer@example.com',
    password: 'password123',
    name: 'Sarah Thompson',
    is_searching: true,
    is_selling: false,
    location_country: 'Australia',
    preferred_disciplines: ['Eventing'],
    currency: 'AUD',
    stripe_subscription_id: 'beta-1747776794304',
    subscription_status: 'active',
    subscription_plan: 'beta-searching',
    subscription_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    preferred_levels: [],
    preferred_breeds: [],
    age_range_min: 13,
    age_range_max: 19,
    height_range_min: 13,
    height_range_max: 15.3,
    preferred_sexes: ['Mare'],
    breeding_preferences: '',
    preferred_characteristics: [],
    price_range_min: 10000,
    price_range_max: 25000
  }
];

// Direct database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initUsers() {
  try {
    console.log('Checking database connection...');
    const connectionTest = await pool.query('SELECT NOW()');
    console.log(`Database connection successful! Server time: ${connectionTest.rows[0].now}`);

    // Create users table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        business_name TEXT,
        contact_name TEXT,
        is_selling BOOLEAN NOT NULL DEFAULT false,
        is_searching BOOLEAN NOT NULL DEFAULT false,
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
    `;
    
    await pool.query(createTableQuery);
    console.log('Users table created or verified.');
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Insert each user
    for (const user of sampleUsers) {
      // Check if user already exists
      const checkResult = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      
      if (checkResult.rows.length > 0) {
        console.log(`User ${user.email} already exists with ID ${checkResult.rows[0].id}, updating...`);
        
        // Update existing user
        const updateResult = await pool.query(`
          UPDATE users SET
            password = $1,
            name = $2,
            business_name = $3,
            contact_name = $4,
            is_selling = $5,
            is_searching = $6,
            location_country = $7,
            preferred_disciplines = $8,
            preferred_levels = $9,
            preferred_breeds = $10,
            age_range_min = $11,
            age_range_max = $12,
            height_range_min = $13,
            height_range_max = $14,
            preferred_sexes = $15,
            breeding_preferences = $16,
            preferred_characteristics = $17,
            price_range_min = $18,
            price_range_max = $19,
            currency = $20,
            stripe_subscription_id = $21,
            subscription_status = $22,
            subscription_plan = $23,
            subscription_end_date = $24
          WHERE email = $25
          RETURNING id
        `, [
          user.password,
          user.name,
          user.business_name,
          user.contact_name,
          user.is_selling,
          user.is_searching,
          user.location_country,
          user.preferred_disciplines,
          user.preferred_levels,
          user.preferred_breeds,
          user.age_range_min,
          user.age_range_max,
          user.height_range_min,
          user.height_range_max,
          user.preferred_sexes,
          user.breeding_preferences,
          user.preferred_characteristics,
          user.price_range_min,
          user.price_range_max,
          user.currency,
          user.stripe_subscription_id,
          user.subscription_status,
          user.subscription_plan,
          user.subscription_end_date,
          user.email
        ]);
        
        console.log(`Updated user ${user.email} with ID ${updateResult.rows[0].id}`);
      } else {
        console.log(`User ${user.email} does not exist, creating...`);
        
        // Insert new user
        const insertResult = await pool.query(`
          INSERT INTO users (
            id, email, password, name, business_name, contact_name, 
            is_selling, is_searching, location_country, 
            preferred_disciplines, preferred_levels, preferred_breeds,
            age_range_min, age_range_max, height_range_min, height_range_max,
            preferred_sexes, breeding_preferences, preferred_characteristics,
            price_range_min, price_range_max, currency,
            stripe_subscription_id, subscription_status, subscription_plan, subscription_end_date
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            password = EXCLUDED.password,
            name = EXCLUDED.name
          RETURNING id
        `, [
          user.id,
          user.email,
          user.password,
          user.name,
          user.business_name,
          user.contact_name,
          user.is_selling,
          user.is_searching,
          user.location_country,
          user.preferred_disciplines,
          user.preferred_levels,
          user.preferred_breeds,
          user.age_range_min,
          user.age_range_max,
          user.height_range_min,
          user.height_range_max,
          user.preferred_sexes,
          user.breeding_preferences,
          user.preferred_characteristics,
          user.price_range_min,
          user.price_range_max,
          user.currency,
          user.stripe_subscription_id,
          user.subscription_status,
          user.subscription_plan,
          user.subscription_end_date
        ]);
        
        console.log(`Created user ${user.email} with ID ${insertResult.rows[0].id}`);
      }
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    console.log('User initialization completed successfully!');
  } catch (error) {
    // Rollback in case of error
    await pool.query('ROLLBACK');
    console.error('Error initializing users:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the initialization
initUsers().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});