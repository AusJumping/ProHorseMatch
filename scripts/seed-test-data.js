#!/usr/bin/env node

/**
 * Test Data Seed Script for Deployment
 * 
 * This script seeds the database with test account data to ensure
 * that demo accounts like owner@example.com and customer@example.com
 * are available in the deployed environment.
 */

// Use CommonJS require instead of ES modules for compatibility
const { pool, db } = require('../server/db');
const schema = require('../shared/schema');
const { eq } = require('drizzle-orm');

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
    const ownerExists = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, 'owner@example.com'));
    
    // Check for customer@example.com
    const customerExists = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, 'customer@example.com'));
    
    // Create or update test owner account
    if (ownerExists.length === 0) {
      console.log('Creating test owner account...');
      await db.insert(schema.users).values({
        email: 'owner@example.com',
        password: 'password123',
        business_name: 'Elite Sporthorses',
        contact_name: 'John Smith',
        is_selling: true,
        is_searching: true,
        name: 'Test Owner',
        stripe_subscription_id: 'beta-' + Date.now(),
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
        currency: 'AUD',
        location_country: 'Australia'
      });
      console.log('Test owner account created');
    } else {
      console.log('Test owner account already exists');
    }
    
    // Create or update test customer account
    if (customerExists.length === 0) {
      console.log('Creating test customer account...');
      await db.insert(schema.users).values({
        email: 'customer@example.com',
        password: 'password123',
        name: 'Sarah Thompson',
        is_searching: true,
        is_selling: false,
        location_country: 'Australia',
        preferred_disciplines: ['Eventing'],
        currency: 'AUD',
        stripe_subscription_id: 'beta-' + Date.now(),
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
      });
      console.log('Test customer account created');
    } else {
      console.log('Test customer account already exists');
    }
    
    // Get test owner ID (we need this for creating horses)
    const owner = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, 'owner@example.com'));
    
    const ownerId = owner[0]?.id;
    
    if (!ownerId) {
      throw new Error('Owner ID not found. Cannot seed horse data.');
    }
    
    // Check for existing horses owned by the test owner
    const existingHorses = await db.select()
      .from(schema.horses)
      .where(eq(schema.horses.owner_id, ownerId));
    
    // Create test horses if none exist
    if (existingHorses.length === 0) {
      console.log('Creating test horses...');
      
      // Create test horse 1
      await db.insert(schema.horses).values({
        owner_id: ownerId,
        name: 'Midnight Magic',
        location_country: 'Australia',
        location_radius_km: 100,
        disciplines: ['Jumping', 'Dressage'],
        levels: ['1.20m', 'Novice'],
        breeds: ['Warmblood'],
        age: 8,
        height_hands: 16.2,
        height_cm: 168,
        sex: 'Gelding',
        sire: 'Cornet Obolensky',
        dam: 'Magic Lady',
        dam_sire: 'Heartbreaker',
        characteristics: ['Brave', 'Careful', 'Forward'],
        price_min: 40000,
        price_max: 50000,
        currency: 'AUD',
        description: 'Beautiful black gelding with fantastic jumping technique. Three excellent gaits and a willing temperament make him suitable for an ambitious amateur or professional.',
        photos: [
          '/horses/horse1_1.jpg',
          '/horses/horse1_2.jpg'
        ],
        videos: [
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        ]
      });
      
      // Create test horse 2
      await db.insert(schema.horses).values({
        owner_id: ownerId,
        name: 'Sunshine Girl',
        location_country: 'Australia',
        location_radius_km: 100,
        disciplines: ['Eventing', 'Dressage'],
        levels: ['1*', 'Elementary'],
        breeds: ['Thoroughbred'],
        age: 7,
        height_hands: 15.3,
        height_cm: 160,
        sex: 'Mare',
        sire: 'Northern Dancer',
        dam: 'Sun Goddess',
        dam_sire: 'Sadler\'s Wells',
        characteristics: ['Bold', 'Sensitive'],
        price_min: 25000,
        price_max: 30000,
        currency: 'AUD',
        description: 'Talented young eventing prospect with excellent bloodlines. Bold cross-country and improving dressage work.',
        photos: [
          '/horses/horse2_1.jpg',
          '/horses/horse2_2.jpg'
        ],
        videos: []
      });
      
      console.log('Test horses created');
    } else {
      console.log(`${existingHorses.length} test horses already exist`);
    }
    
    // Get test customer ID (needed for matches)
    const customer = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, 'customer@example.com'));
    
    const customerId = customer[0]?.id;
    
    if (!customerId) {
      throw new Error('Customer ID not found. Cannot seed match data.');
    }
    
    // Get all horses for creating matches
    const allHorses = await db.select().from(schema.horses);
    
    if (allHorses.length > 0) {
      // Check for existing matches
      const existingMatches = await db.select()
        .from(schema.matches)
        .where(eq(schema.matches.customer_id, customerId));
      
      // Create test matches if none exist
      if (existingMatches.length === 0) {
        console.log('Creating test matches...');
        
        // Create a match for each horse
        for (const horse of allHorses) {
          await db.insert(schema.matches).values({
            customer_id: customerId,
            horse_id: horse.id,
            is_liked: true
          });
        }
        
        console.log('Test matches created');
      } else {
        console.log(`${existingMatches.length} test matches already exist`);
      }
      
      // Create conversations and messages between owner and customer
      for (const horse of allHorses) {
        // Check if conversation already exists
        const existingConvo = await db.select()
          .from(schema.conversations)
          .where(
            eq(schema.conversations.customer_id, customerId) && 
            eq(schema.conversations.owner_id, ownerId) && 
            eq(schema.conversations.horse_id, horse.id)
          );
        
        if (existingConvo.length === 0) {
          console.log(`Creating test conversation for horse ${horse.name}...`);
          
          // Create conversation
          const [newConvo] = await db.insert(schema.conversations)
            .values({
              customer_id: customerId,
              owner_id: ownerId,
              horse_id: horse.id
            })
            .returning();
          
          if (newConvo) {
            // Create test messages
            console.log('Adding test messages to conversation...');
            
            // Customer message
            const [custMessage] = await db.insert(schema.messages)
              .values({
                customer_id: customerId,
                owner_id: ownerId,
                horse_id: horse.id,
                content: `Hi, I'm interested in ${horse.name}. Could you tell me more about their temperament?`,
                sender_type: 'customer',
                is_read: true
              })
              .returning();
            
            // Owner response
            const [ownerMessage] = await db.insert(schema.messages)
              .values({
                customer_id: customerId,
                owner_id: ownerId,
                horse_id: horse.id,
                content: `Hello! ${horse.name} has a lovely temperament, very easy to handle and brave to the jumps. Would you like to come see them?`,
                sender_type: 'owner',
                is_read: false
              })
              .returning();
            
            // Update conversation with last message
            if (ownerMessage) {
              await db.update(schema.conversations)
                .set({ 
                  last_message_id: ownerMessage.id,
                  last_message_time: ownerMessage.created_at,
                  unread_count: 1
                })
                .where(eq(schema.conversations.id, newConvo.id));
            }
            
            console.log('Test messages created');
          }
        } else {
          console.log(`Test conversation for horse ${horse.name} already exists`);
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