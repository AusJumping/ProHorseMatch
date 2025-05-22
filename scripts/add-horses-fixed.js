// Direct database initialization for horse listings with correct schema
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Configure Neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;

// Load environment variables
dotenv.config();

console.log('Starting horse data initialization with correct schema...');

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
    price: 30000, // Single price field instead of min/max
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
    price: 50000, // Single price field
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
    price: 35000, // Single price field
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
    price: 40000, // Single price field
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
    price: 35000, // Single price field
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

async function addHorses() {
  try {
    console.log('Checking database connection...');
    const connectionTest = await pool.query('SELECT NOW()');
    console.log(`Database connection successful! Server time: ${connectionTest.rows[0].now}`);

    // Check if horses table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'horses'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('Horses table does not exist. Please create the table first.');
      return;
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
    
    // Get the actual column names from the database to ensure we're using the right schema
    const columnInfo = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'horses'
      ORDER BY ordinal_position
    `);
    
    const columns = columnInfo.rows.map(row => row.column_name);
    console.log('Actual database columns:', columns);
    
    // Insert each horse
    for (const horse of sampleHorses) {
      // Prepare values that match the actual schema
      const values = [];
      const placeholders = [];
      const fields = [];
      
      let paramIndex = 1;
      
      // Build the INSERT statement dynamically based on the actual schema
      Object.entries(horse).forEach(([key, value]) => {
        if (columns.includes(key)) {
          fields.push(key);
          placeholders.push(`$${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });
      
      const insertQuery = `
        INSERT INTO horses (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING id
      `;
      
      try {
        const result = await pool.query(insertQuery, values);
        console.log(`Added horse: ${horse.name} with ID: ${result.rows[0].id}`);
      } catch (err) {
        console.error(`Error adding horse ${horse.name}:`, err.message);
        throw err;
      }
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    console.log(`Successfully added ${sampleHorses.length} horses to the database.`);
  } catch (error) {
    // Rollback in case of error
    await pool.query('ROLLBACK');
    console.error('Error adding horses:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the initialization
addHorses().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});