// Script to update existing horses in the database with new level values
const { db } = require("../server/db");
const { horses } = require("../shared/schema");
const { eq } = require("drizzle-orm");

// New level mappings
const jumpingLevelsNew = ["Children", "Junior", "Amateur", "Young Rider", "Mini Prix", "Grand Prix"];
const dressageLevelsNew = ["Preliminary", "Novice", "Elementary", "Medium", "Advanced", "Prix St. Georges", "Intermediate I", "Intermediate II", "Grand Prix"];
const eventingLevelsNew = ["EvA60", "EvA80", "EvA95", "1*", "2*", "3*", "4*", "5*"];

// Function to get a random item from an array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Main function to update horses
async function updateHorseLevels() {
    try {
        console.log("Starting horse level update...");
        
        // Get all horses
        const allHorses = await db.select().from(horses);
        console.log(`Found ${allHorses.length} horses to update`);
        
        // Update each horse
        for (const horse of allHorses) {
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
            await db.update(horses)
                .set({ levels: newLevels })
                .where(eq(horses.id, horse.id));
            
            console.log(`Updated horse ${horse.id} (${horse.name}) with levels: ${newLevels.join(", ")}`);
        }
        
        console.log("Horse level update completed successfully!");
    } catch (error) {
        console.error("Error updating horse levels:", error);
    } finally {
        process.exit(0);
    }
}

// Run the update function
updateHorseLevels();