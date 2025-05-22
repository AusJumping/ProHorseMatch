// Script to migrate horses to the PostgreSQL database for ProHorseMatch
import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import ws from 'ws';

// Configure Neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;

// Load environment variables
dotenv.config();

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

console.log('Starting horse migration to PostgreSQL database...');

// Define horse data with standard Australian owner ID (3)
const horsesToMigrate = [
  {
    name: "Midnight Star",
    owner_id: 3, // Will be linked to owner@example.com
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
    price_min: 25000,
    price_max: 35000,
    currency: "AUD",
    description: "Talented jumper with excellent technique. Has competed successfully at 1.20m level.",
    photos: ["/horse-images/horse1-1.jpg", "/horse-images/horse1-2.jpg"],
    videos: ["/horse-videos/horse1.mp4"]
  },
  {
    name: "Royal Dancer",
    owner_id: 3,
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
    price_min: 45000,
    price_max: 60000,
    currency: "AUD",
    description: "Elegant dressage mare with impressive movement and presence. Currently competing at PSG level.",
    photos: ["/horse-images/horse2-1.jpg", "/horse-images/horse2-2.jpg"],
    videos: ["/horse-videos/horse2.mp4"]
  },
  {
    name: "Golden Boy",
    owner_id: 3,
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
    owner_id: 3,
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
    owner_id: 3,
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

// Function to check if target user exists in the database
async function checkOwnerExists(ownerId) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_selling = true',
      [ownerId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking owner existence:', error);
    return false;
  }
}

// Function to migrate horses to the database
async function migrateHorses() {
  try {
    // First check if owner exists
    const ownerExists = await checkOwnerExists(3);
    
    if (!ownerExists) {
      console.error('Owner with ID 3 not found or does not have selling permission. Cannot migrate horses.');
      console.log('You may need to create the owner account first with proper selling permissions.');
      process.exit(1);
    }
    
    console.log('Owner verification successful. Beginning horse migration...');
    
    // Begin a transaction
    await pool.query('BEGIN');
    
    // Insert each horse
    for (const horse of horsesToMigrate) {
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
      
      console.log(`Migrated horse: ${horse.name} with ID: ${result.rows[0].id}`);
    }
    
    // Commit the transaction
    await pool.query('COMMIT');
    
    console.log(`Successfully migrated ${horsesToMigrate.length} horses to the database.`);
  } catch (error) {
    // Rollback in case of error
    await pool.query('ROLLBACK');
    console.error('Error migrating horses:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Execute the migration
migrateHorses().catch(error => {
  console.error('Unexpected error in migration script:', error);
  process.exit(1);
});