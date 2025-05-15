import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Define the SQL query to create the users table
const createUsersTable = `
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "email" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "name" text,
  "business_name" text,
  "contact_name" text,
  "is_searching" boolean DEFAULT false,
  "is_selling" boolean DEFAULT false,
  "location_country" text,
  "location_radius_km" integer,
  "preferred_disciplines" text[],
  "preferred_levels" text[],
  "preferred_breeds" text[],
  "age_range_min" integer,
  "age_range_max" integer,
  "height_range_min" real,
  "height_range_max" real,
  "preferred_sexes" text[],
  "breeding_preferences" text,
  "preferred_characteristics" text[],
  "price_range_min" integer,
  "price_range_max" integer,
  "currency" text,
  "created_at" timestamp DEFAULT now()
);
`;

// Define the SQL query to create the horses table
const createHorsesTable = `
CREATE TABLE IF NOT EXISTS "horses" (
  "id" serial PRIMARY KEY,
  "owner_id" integer NOT NULL,
  "name" text NOT NULL,
  "location_country" text NOT NULL,
  "location_radius_km" integer,
  "disciplines" text[] NOT NULL,
  "levels" text[] NOT NULL,
  "breeds" text[] NOT NULL,
  "age" integer NOT NULL,
  "height_hands" real,
  "height_cm" integer,
  "sex" text NOT NULL,
  "sire" text,
  "dam" text,
  "dam_sire" text,
  "characteristics" text[],
  "price" integer NOT NULL,
  "currency" text NOT NULL,
  "description" text,
  "photos" text[] NOT NULL,
  "videos" text[],
  "created_at" timestamp DEFAULT now()
);
`;

// Define the SQL query to create the matches table
const createMatchesTable = `
CREATE TABLE IF NOT EXISTS "matches" (
  "id" serial PRIMARY KEY,
  "customer_id" integer NOT NULL,
  "horse_id" integer NOT NULL,
  "is_liked" boolean NOT NULL,
  "created_at" timestamp DEFAULT now()
);
`;

// Define the SQL query to create the messages table
const createMessagesTable = `
CREATE TABLE IF NOT EXISTS "messages" (
  "id" serial PRIMARY KEY,
  "customer_id" integer NOT NULL,
  "owner_id" integer NOT NULL,
  "horse_id" integer NOT NULL,
  "content" text NOT NULL,
  "sender_type" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "is_read" boolean DEFAULT false
);
`;

// Define the SQL query to create the conversations table
const createConversationsTable = `
CREATE TABLE IF NOT EXISTS "conversations" (
  "id" serial PRIMARY KEY,
  "customer_id" integer NOT NULL,
  "owner_id" integer NOT NULL,
  "horse_id" integer NOT NULL,
  "last_message_id" integer,
  "last_message_time" timestamp,
  "unread_count" integer DEFAULT 0
);
`;

// Define the SQL query to create the sessions table
const createSessionsTable = `
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar NOT NULL PRIMARY KEY,
  "sess" jsonb NOT NULL,
  "expire" timestamp(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
`;

async function main() {
  console.log("Starting migration...");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  // Connect to the database
  console.log("Connecting to database...");
  const connectionString = process.env.DATABASE_URL;
  const sql = postgres(connectionString, { max: 1 });
  
  try {
    // Create tables
    console.log("Creating users table...");
    await sql.unsafe(createUsersTable);
    
    console.log("Creating horses table...");
    await sql.unsafe(createHorsesTable);
    
    console.log("Creating matches table...");
    await sql.unsafe(createMatchesTable);
    
    console.log("Creating messages table...");
    await sql.unsafe(createMessagesTable);
    
    console.log("Creating conversations table...");
    await sql.unsafe(createConversationsTable);
    
    console.log("Creating sessions table...");
    await sql.unsafe(createSessionsTable);
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    // Close the database connection
    await sql.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});