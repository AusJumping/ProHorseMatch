//direct-update-levels.js
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neon to work with websockets
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// New level mappings
const jumpingLevelsNew = ["Children", "Junior", "Amateur", "Young Rider", "Mini Prix", "Grand Prix"];
const dressageLevelsNew = ["Preliminary", "Novice", "Elementary", "Medium", "Advanced", "Prix St. Georges", "Intermediate I", "Intermediate II", "Grand Prix"];
const eventingLevelsNew = ["EvA60", "EvA80", "EvA95", "1*", "2*", "3*", "4*", "5*"];

// Function to get a random item from an array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function updateHorseLevels() {
  console.log("Starting horse level update...");
  
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable not set");
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Get all horses
    const result = await pool.query('SELECT * FROM horses');
    const horses = result.rows;
    console.log(`Found ${horses.length} horses to update`);
    
    // Update each horse
    for (const horse of horses) {
      // Identify which disciplines this horse has
      const horseDisciplines = horse.disciplines || [];
      
      // Create new levels array based on the horse's disciplines
      const newLevels = [];
      
      if (horseDisciplines.includes("Jumping")) {
        // Add 1-2 random jumping levels
        const numLevels = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numLevels; i++) {
          const level = getRandomItem(jumpingLevelsNew);
          if (!newLevels.includes(level)) {
            newLevels.push(level);
          }
        }
      }
      
      if (horseDisciplines.includes("Dressage")) {
        // Add 1-2 random dressage levels
        const numLevels = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numLevels; i++) {
          const level = getRandomItem(dressageLevelsNew);
          if (!newLevels.includes(level)) {
            newLevels.push(level);
          }
        }
      }
      
      if (horseDisciplines.includes("Eventing")) {
        // Add 1-2 random eventing levels
        const numLevels = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numLevels; i++) {
          const level = getRandomItem(eventingLevelsNew);
          if (!newLevels.includes(level)) {
            newLevels.push(level);
          }
        }
      }
      
      // If no disciplines or no new levels, add a default
      if (newLevels.length === 0) {
        newLevels.push(getRandomItem(jumpingLevelsNew));
      }
      
      // Update the horse in the database
      await pool.query(
        'UPDATE horses SET levels = $1 WHERE id = $2',
        [newLevels, horse.id]
      );
      
      console.log(`Updated horse ${horse.id} (${horse.name}) with levels: ${newLevels.join(", ")}`);
    }
    
    console.log("Horse level update completed successfully!");
  } catch (error) {
    console.error("Error updating horse levels:", error);
  } finally {
    await pool.end();
  }
}

// Run the update function
updateHorseLevels();