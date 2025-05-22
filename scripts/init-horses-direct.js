// Direct database initialization for horse listings
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Configure Neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;

// Load environment variables
dotenv.config();

console.log('Starting direct horse initialization...');

// Define sample horses (owner_id will be 1 since that's what was assigned in the database)
const sampleHorses = [
  {
    name: "Midnight Star",
    owner_id: 1, // Based on previous script output, owner@example.com has ID 1
    location_country: "Australia",
    location_radius_km: 150,
    disciplines: ["Jumping", "Eventing"],
    levels: ["Amateur", "1*"],
    breeds: ["Warmblood"],
    age: 8,
    height_hands: 16.2,
    height_cm: 168,
    sex: "Gelding",
    sire: "Cornet Obolensky",
    dam: "Diamond Star",
    dam_sire: "Diamant de Semilly",
    characteristics: ["Forward", "Brave", "Careful"],
    price: 30000,
    currency: "AUD",
    description: "Talented jumper with excellent technique. Has competed successfully at 1.20m level.",
    photos: ["/horse-images/horse1-1.jpg", "/horse-images/horse1-2.jpg"],
    videos: ["/horse-videos/horse1.mp4"]
  },
  {
    name: "Royal Dancer",
    owner_id: 1,
    location_country: "Australia",
    location_radius_km: 100,
    disciplines: ["Dressage"],
    levels: ["Prix St. Georges", "Intermediate I"],
    breeds: ["Dutch Warmblood"],
    age: 10,
    height_hands: 17.0,
    height_cm: 173,
    sex: "Mare",
    sire: "Jazz",
    dam: "Royal Grace",
    dam_sire: "Rubinstein",
    characteristics: ["Sensitive", "Elegant", "Forward"],
    price: 52500,
    currency: "AUD",
    description: "Elegant dressage mare with impressive movement and presence. Currently competing at PSG level.",
    photos: ["/horse-images/horse2-1.jpg", "/horse-images/horse2-2.jpg"],
    videos: ["/horse-videos/horse2.mp4"]
  },
  {
    name: "Golden Boy",
    owner_id: 1,
    location_country: "Australia",
    location_radius_km: 200,
    disciplines: ["Eventing"],
    levels: ["1*", "2*"],
    breeds: ["Thoroughbred"],
    age: 7,
    height_hands: 16.0,
    height_cm: 163,
    sex: "Gelding",
    sire: "High Chaparral",
    dam: "Golden Lady",
    dam_sire: "Galileo",
    characteristics: ["Bold", "Brave", "Honest"],
    price_min: 30000,
    price_max: 40000,
    currency: "AUD",
    description: "Talented and brave eventer with excellent cross-country ability. Currently competing at 1* level.",
    photos: ["/horse-images/horse3-1.jpg", "/horse-images/horse3-2.jpg"],
    videos: ["/horse-videos/horse3.mp4"]
  },
  {
    name: "Diamond Jubilee",
    owner_id: 1,
    location_country: "Australia",
    location_radius_km: 150,
    disciplines: ["Jumping"],
    levels: ["Junior", "Amateur"],
    breeds: ["Warmblood"],
    age: 6,
    height_hands: 16.1,
    height_cm: 165,
    sex: "Mare",
    sire: "Diamant de Semilly",
    dam: "Jubilee Queen",
    dam_sire: "Corland",
    characteristics: ["Careful", "Scope", "Forward"],
    price_min: 35000,
    price_max: 45000,
    currency: "AUD",
    description: "Young talented mare with excellent jumping technique and scope. Perfect for junior or amateur rider.",
    photos: ["/horse-images/horse4-1.jpg", "/horse-images/horse4-2.jpg"],
    videos: ["/horse-videos/horse4.mp4"]
  },
  {
    name: "Maestro",
    owner_id: 1,
    location_country: "Australia",
    location_radius_km: 120,
    disciplines: ["Dressage"],
    levels: ["Elementary", "Medium"],
    breeds: ["Hanoverian"],
    age: 9,
    height_hands: 16.3,
    height_cm: 170,
    sex: "Gelding",
    sire: "Millennium",
    dam: "Dancing Queen",
    dam_sire: "De Niro",
    characteristics: ["Calm", "Schoolmaster", "Honest"],
    price_min: 30000,
    price_max: 40000,
    currency: "AUD",
    description: "Schoolmaster dressage gelding, perfect for an ambitious amateur. Competed successfully at Medium level.",
    photos: ["/horse-images/horse5-1.jpg", "/horse-images/horse5-2.jpg"],
    videos: ["/horse-videos/horse5.mp4"]
  }
];

// Direct database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initHorses() {
  try {
    console.log('Checking database connection...');
    const connectionTest = await pool.query('SELECT NOW()');
    console.log(`Database connection successful! Server time: ${connectionTest.rows[0].now}`);

    // Use the existing table structure - we'll check the current schema
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'horses'
      )
    `;
    
    const tableExists = await pool.query(checkTableQuery);
    
    if (!tableExists.rows[0].exists) {
      console.log('Horses table does not exist, creating it...');
      
      // Create table with the correct schema
      const createTableQuery = `
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
          price INTEGER NOT NULL,
          currency TEXT NOT NULL,
          description TEXT,
          photos TEXT[] NOT NULL,
          videos TEXT[],
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      await pool.query(createTableQuery);
      console.log('Horses table created.');
    } else {
      console.log('Horses table already exists.');
    }
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Check if there are existing horses
    const existingHorses = await pool.query('SELECT COUNT(*) FROM horses');
    console.log(`Found ${existingHorses.rows[0].count} existing horses in the database.`);
    
    if (parseInt(existingHorses.rows[0].count) > 0) {
      console.log('Clearing existing horse records to avoid duplicates...');
      await pool.query('DELETE FROM horses');
      console.log('Existing horse records cleared.');
    }
    
    // Insert each horse
    for (const horse of sampleHorses) {
      const result = await pool.query(`
        INSERT INTO horses (
          owner_id, name, location_country, location_radius_km, 
          disciplines, levels, breeds, age, height_hands, height_cm,
          sex, sire, dam, dam_sire, characteristics,
          price_min, price_max, currency, description, photos, videos
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING id
      `, [
        horse.owner_id, 
        horse.name,
        horse.location_country,
        horse.location_radius_km,
        horse.disciplines,
        horse.levels,
        horse.breeds,
        horse.age,
        horse.height_hands,
        horse.height_cm,
        horse.sex,
        horse.sire,
        horse.dam,
        horse.dam_sire,
        horse.characteristics,
        horse.price_min,
        horse.price_max,
        horse.currency,
        horse.description,
        horse.photos,
        horse.videos
      ]);
      
      console.log(`Added horse: ${horse.name} with ID: ${result.rows[0].id}`);
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    console.log(`Successfully added ${sampleHorses.length} horses to the database.`);
  } catch (error) {
    // Rollback in case of error
    await pool.query('ROLLBACK');
    console.error('Error initializing horses:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the initialization
initHorses().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});