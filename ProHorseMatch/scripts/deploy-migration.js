// Deployment migration script to fix database schema issues
import { db } from '../server/db.js';

async function runDeploymentMigration() {
  console.log("🚀 Starting deployment database migration...");
  
  try {
    // Check if tables exist and create them if they don't
    console.log("📊 Checking database schema...");
    
    // Create users table with all subscription fields
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        business_name TEXT,
        contact_name TEXT,
        is_searching BOOLEAN DEFAULT false,
        is_selling BOOLEAN DEFAULT false,
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
    
    // Create horses table with proper price fields
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS horses (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        sex TEXT NOT NULL,
        height_hands REAL,
        location_country TEXT NOT NULL,
        location_state TEXT,
        location_city TEXT,
        disciplines TEXT[] NOT NULL,
        levels TEXT[],
        breeds TEXT[] NOT NULL,
        characteristics TEXT[],
        sire TEXT,
        dam_sire TEXT,
        description TEXT,
        price_min INTEGER,
        price_max INTEGER,
        currency TEXT NOT NULL,
        photos TEXT[],
        videos TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Handle price column migration if it exists
    try {
      await db.execute(sql`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'horses' AND column_name = 'price') THEN
            -- If price_min doesn't exist, create it from price
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'horses' AND column_name = 'price_min') THEN
              ALTER TABLE horses ADD COLUMN price_min INTEGER;
              UPDATE horses SET price_min = price WHERE price_min IS NULL;
            END IF;
            
            -- If price_max doesn't exist, create it from price
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'horses' AND column_name = 'price_max') THEN
              ALTER TABLE horses ADD COLUMN price_max INTEGER;
              UPDATE horses SET price_max = price WHERE price_max IS NULL;
            END IF;
            
            -- Drop the old price column
            ALTER TABLE horses DROP COLUMN price;
          END IF;
        END
        $$;
      `);
    } catch (error) {
      console.log("Price column migration handled:", error.message);
    }
    
    // Create other required tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES users(id),
        horse_id INTEGER NOT NULL REFERENCES horses(id),
        is_liked BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES users(id),
        owner_id INTEGER NOT NULL REFERENCES users(id),
        horse_id INTEGER NOT NULL REFERENCES horses(id),
        last_message_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id),
        sender_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ Database schema migration completed successfully!");
    console.log("🎯 All tables are now ready for deployment!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDeploymentMigration()
    .then(() => {
      console.log("🎉 Deployment migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment migration failed:", error);
      process.exit(1);
    });
}

export { runDeploymentMigration };