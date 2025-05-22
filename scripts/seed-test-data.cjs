#!/usr/bin/env node

/**
 * Test Data Seed Script for Deployment
 * 
 * This script seeds the database with test account data to ensure
 * that demo accounts like owner@example.com and customer@example.com
 * are available in the deployed environment.
 */

const { Pool } = require('pg');
const { eq, and } = require('drizzle-orm');

// Get database connection from environment
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set to run seed script");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Define schema structure directly instead of importing to avoid module issues
const users = {
  table: 'users',
  id: 'id',
  email: 'email'
};

const horses = {
  table: 'horses',
  id: 'id',
  owner_id: 'owner_id'
};

const matches = {
  table: 'matches',
  id: 'id',
  customer_id: 'customer_id',
  horse_id: 'horse_id'
};

const conversations = {
  table: 'conversations',
  id: 'id',
  customer_id: 'customer_id',
  owner_id: 'owner_id',
  horse_id: 'horse_id',
  last_message_id: 'last_message_id',
  last_message_time: 'last_message_time',
  unread_count: 'unread_count'
};

const messages = {
  table: 'messages',
  id: 'id',
  customer_id: 'customer_id',
  owner_id: 'owner_id',
  horse_id: 'horse_id',
  content: 'content',
  sender_type: 'sender_type',
  is_read: 'is_read'
};

async function seedTestData() {
  console.log('Starting test data seeding process...');
  
  try {
    // Check database connection
    console.log('Checking database connection...');
    await pool.query('SELECT NOW()');
    console.log('Database connection successful!');
    
    // Check if test accounts already exist
    console.log('Checking for existing test accounts...');
    
    // Check for owner@example.com
    const ownerResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      ['owner@example.com']
    );
    
    // Check for customer@example.com
    const customerResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      ['customer@example.com']
    );
    
    let ownerId = null;
    let customerId = null;
    
    // Create or update test owner account
    if (ownerResult.rows.length === 0) {
      console.log('Creating test owner account...');
      const result = await pool.query(
        `INSERT INTO users (
          email, password, business_name, contact_name, is_selling, is_searching,
          name, stripe_subscription_id, subscription_status, subscription_plan,
          subscription_end_date, preferred_disciplines, preferred_levels, preferred_breeds,
          age_range_min, age_range_max, height_range_min, height_range_max, preferred_sexes,
          breeding_preferences, preferred_characteristics, price_range_min, price_range_max,
          currency, location_country, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, NOW()
        ) RETURNING id`,
        [
          'owner@example.com',
          'password123',
          'Elite Sporthorses',
          'John Smith',
          true,
          true,
          'Test Owner',
          'beta-' + Date.now(),
          'active',
          'beta-seller',
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          '{}',
          '{}',
          '{}',
          0,
          999,
          13,
          99,
          '{}',
          '',
          '{}',
          0,
          999999999,
          'AUD',
          'Australia'
        ]
      );
      ownerId = result.rows[0].id;
      console.log('Test owner account created with ID:', ownerId);
    } else {
      ownerId = ownerResult.rows[0].id;
      console.log('Test owner account already exists with ID:', ownerId);
    }
    
    // Create or update test customer account
    if (customerResult.rows.length === 0) {
      console.log('Creating test customer account...');
      const result = await pool.query(
        `INSERT INTO users (
          email, password, name, is_searching, is_selling,
          location_country, preferred_disciplines, currency,
          stripe_subscription_id, subscription_status, subscription_plan,
          subscription_end_date, preferred_levels, preferred_breeds,
          age_range_min, age_range_max, height_range_min, height_range_max, preferred_sexes,
          breeding_preferences, preferred_characteristics, price_range_min, price_range_max,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, NOW()
        ) RETURNING id`,
        [
          'customer@example.com',
          'password123',
          'Sarah Thompson',
          true,
          false,
          'Australia',
          '{Eventing}',
          'AUD',
          'beta-' + Date.now(),
          'active',
          'beta-searching',
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          '{}',
          '{}',
          13,
          19,
          13,
          15.3,
          '{Mare}',
          '',
          '{}',
          10000,
          25000
        ]
      );
      customerId = result.rows[0].id;
      console.log('Test customer account created with ID:', customerId);
    } else {
      customerId = customerResult.rows[0].id;
      console.log('Test customer account already exists with ID:', customerId);
    }
    
    if (!ownerId) {
      throw new Error('Owner ID not found. Cannot seed horse data.');
    }
    
    if (!customerId) {
      throw new Error('Customer ID not found. Cannot seed match data.');
    }
    
    // Check for existing horses owned by the test owner
    const horsesResult = await pool.query(
      `SELECT * FROM horses WHERE owner_id = $1`,
      [ownerId]
    );
    
    let horse1Id = null;
    let horse2Id = null;
    
    // Create test horses if none exist
    if (horsesResult.rows.length === 0) {
      console.log('Creating test horses...');
      
      // Create test horse 1
      const horse1Result = await pool.query(
        `INSERT INTO horses (
          owner_id, name, location_country, location_radius_km,
          disciplines, levels, breeds, age, height_hands, height_cm,
          sex, sire, dam, dam_sire, characteristics, price_min, price_max,
          currency, description, photos, videos, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW()
        ) RETURNING id`,
        [
          ownerId,
          'Midnight Magic',
          'Australia',
          100,
          '{Jumping,Dressage}',
          '{1.20m,Novice}',
          '{Warmblood}',
          8,
          16.2,
          168,
          'Gelding',
          'Cornet Obolensky',
          'Magic Lady',
          'Heartbreaker',
          '{Brave,Careful,Forward}',
          40000,
          50000,
          'AUD',
          'Beautiful black gelding with fantastic jumping technique. Three excellent gaits and a willing temperament make him suitable for an ambitious amateur or professional.',
          '{/horses/horse1_1.jpg,/horses/horse1_2.jpg}',
          '{https://www.youtube.com/watch?v=dQw4w9WgXcQ}'
        ]
      );
      horse1Id = horse1Result.rows[0].id;
      
      // Create test horse 2
      const horse2Result = await pool.query(
        `INSERT INTO horses (
          owner_id, name, location_country, location_radius_km,
          disciplines, levels, breeds, age, height_hands, height_cm,
          sex, sire, dam, dam_sire, characteristics, price_min, price_max,
          currency, description, photos, videos, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW()
        ) RETURNING id`,
        [
          ownerId,
          'Sunshine Girl',
          'Australia',
          100,
          '{Eventing,Dressage}',
          '{1*,Elementary}',
          '{Thoroughbred}',
          7,
          15.3,
          160,
          'Mare',
          'Northern Dancer',
          'Sun Goddess',
          'Sadler\'s Wells',
          '{Bold,Sensitive}',
          25000,
          30000,
          'AUD',
          'Talented young eventing prospect with excellent bloodlines. Bold cross-country and improving dressage work.',
          '{/horses/horse2_1.jpg,/horses/horse2_2.jpg}',
          '{}'
        ]
      );
      horse2Id = horse2Result.rows[0].id;
      
      console.log('Test horses created with IDs:', horse1Id, horse2Id);
    } else {
      console.log(`${horsesResult.rows.length} test horses already exist`);
      // Get the existing horse IDs
      if (horsesResult.rows.length > 0) horse1Id = horsesResult.rows[0].id;
      if (horsesResult.rows.length > 1) horse2Id = horsesResult.rows[1].id;
    }
    
    // Get all horse IDs for creating matches
    const allHorsesResult = await pool.query('SELECT id FROM horses');
    const horseIds = allHorsesResult.rows.map(row => row.id);
    
    if (horseIds.length > 0) {
      // Check for existing matches
      const matchesResult = await pool.query(
        `SELECT * FROM matches WHERE customer_id = $1`,
        [customerId]
      );
      
      // Create test matches if none exist
      if (matchesResult.rows.length === 0) {
        console.log('Creating test matches...');
        
        // Create a match for each horse
        for (const horseId of horseIds) {
          await pool.query(
            `INSERT INTO matches (
              customer_id, horse_id, is_liked, created_at
            ) VALUES (
              $1, $2, $3, NOW()
            )`,
            [customerId, horseId, true]
          );
        }
        
        console.log('Test matches created');
      } else {
        console.log(`${matchesResult.rows.length} test matches already exist`);
      }
      
      // Create conversations and messages between owner and customer
      for (const horseId of horseIds) {
        // Check if conversation already exists
        const convoResult = await pool.query(
          `SELECT * FROM conversations 
           WHERE customer_id = $1 AND owner_id = $2 AND horse_id = $3`,
          [customerId, ownerId, horseId]
        );
        
        if (convoResult.rows.length === 0) {
          console.log(`Creating test conversation for horse ID ${horseId}...`);
          
          // Get horse name
          const horseResult = await pool.query(
            `SELECT name FROM horses WHERE id = $1`,
            [horseId]
          );
          const horseName = horseResult.rows[0]?.name || 'this horse';
          
          // Create conversation
          const convoInsertResult = await pool.query(
            `INSERT INTO conversations (
              customer_id, owner_id, horse_id, unread_count
            ) VALUES (
              $1, $2, $3, 0
            ) RETURNING id`,
            [customerId, ownerId, horseId]
          );
          
          const convoId = convoInsertResult.rows[0].id;
          
          if (convoId) {
            // Create test messages
            console.log('Adding test messages to conversation...');
            
            // Customer message
            const custMsgResult = await pool.query(
              `INSERT INTO messages (
                customer_id, owner_id, horse_id, content, sender_type, is_read, created_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, NOW() - INTERVAL '2 days'
              ) RETURNING id, created_at`,
              [
                customerId,
                ownerId,
                horseId,
                `Hi, I'm interested in ${horseName}. Could you tell me more about their temperament?`,
                'customer',
                true
              ]
            );
            
            const custMsgId = custMsgResult.rows[0].id;
            const custMsgTime = custMsgResult.rows[0].created_at;
            
            // Owner response
            const ownerMsgResult = await pool.query(
              `INSERT INTO messages (
                customer_id, owner_id, horse_id, content, sender_type, is_read, created_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, NOW() - INTERVAL '1 day'
              ) RETURNING id, created_at`,
              [
                customerId,
                ownerId,
                horseId,
                `Hello! ${horseName} has a lovely temperament, very easy to handle and brave to the jumps. Would you like to come see them?`,
                'owner',
                false
              ]
            );
            
            const ownerMsgId = ownerMsgResult.rows[0].id;
            const ownerMsgTime = ownerMsgResult.rows[0].created_at;
            
            // Update conversation with last message
            if (ownerMsgId) {
              await pool.query(
                `UPDATE conversations 
                 SET last_message_id = $1, last_message_time = $2, unread_count = 1
                 WHERE id = $3`,
                [ownerMsgId, ownerMsgTime, convoId]
              );
            }
            
            console.log('Test messages created');
          }
        } else {
          console.log(`Test conversation for horse ID ${horseId} already exists`);
        }
      }
    }
    
    console.log('Test data seeding completed successfully!');
  } catch (error) {
    console.error('Test data seeding failed:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the seeding process
seedTestData().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});