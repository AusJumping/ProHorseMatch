/**
 * Add Sample Horses Script
 * 
 * This script adds sample horses to the specified user account.
 * It's useful for seeing how your account looks with horses in it.
 */

const { storage } = require('../server/storage');

async function addSampleHorsesForUser(userId) {
  try {
    console.log(`Adding sample horses for user ID: ${userId}`);
    
    // Make sure user exists and is a seller
    const user = await storage.getUserById(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return { success: false, message: "User not found" };
    }
    
    // Update user to be a seller if they're not already
    if (!user.is_selling) {
      await storage.updateUser(userId, { is_selling: true });
      console.log(`Updated user ${userId} to be a seller`);
    }
    
    // Sample horse data
    const sampleHorses = [
      {
        name: "Pegasus",
        location_country: "Australia", 
        currency: "AUD",
        owner_id: userId,
        disciplines: ["Jumping"],
        levels: ["1.10m"],
        breeds: ["Warmblood"],
        age: 8,
        sex: "Gelding",
        price_min: 30000,
        price_max: 35000,
        photos: ["https://images.unsplash.com/photo-1534307250431-ef2530a9d8c5"],
        height_hands: 16.2,
        height_cm: 168,
        sire: "Cornet Obolensky",
        dam: "Diamant's Girl",
        dam_sire: "Diamant de Semilly",
        characteristics: ["Brave", "Careful"],
        description: "Talented jumper with a great temperament"
      },
      {
        name: "Thunder",
        location_country: "Australia",
        currency: "AUD",
        owner_id: userId,
        disciplines: ["Dressage"],
        levels: ["Elementary"],
        breeds: ["Hanoverian"],
        age: 6,
        sex: "Stallion",
        price_min: 40000,
        price_max: 45000,
        photos: ["https://images.unsplash.com/photo-1551884831-bbf3cdc6469e"],
        height_hands: 17,
        height_cm: 173,
        sire: "Totilas",
        dam: "Dancing Queen",
        dam_sire: "De Niro",
        characteristics: ["Expressive", "Powerful"],
        description: "Impressive young dressage prospect with three excellent gaits"
      }
    ];
    
    // Add horses to database
    const createdHorses = [];
    for (const horse of sampleHorses) {
      try {
        const createdHorse = await storage.createHorse(horse);
        createdHorses.push(createdHorse);
        console.log(`Created sample horse "${horse.name}" for user ${userId}`);
      } catch (err) {
        console.error(`Failed to create horse "${horse.name}":`, err);
      }
    }
    
    return { 
      success: true, 
      message: `Successfully added ${createdHorses.length} sample horses`,
      horses: createdHorses
    };
  } catch (error) {
    console.error("Error adding sample horses:", error);
    return { success: false, message: "Failed to add sample horses" };
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node add-sample-horses.js <userId>');
    process.exit(1);
  }
  
  const userId = parseInt(process.argv[2]);
  
  if (isNaN(userId)) {
    console.error('Error: User ID must be a number');
    process.exit(1);
  }
  
  console.log(`Adding sample horses for user ID: ${userId}`);
  
  try {
    const result = await addSampleHorsesForUser(userId);
    
    if (result.success) {
      console.log(result.message);
      console.log(`Added horses: ${result.horses.map(h => h.name).join(', ')}`);
    } else {
      console.error(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Unhandled error:', error);
  }
  
  process.exit(0);
}

main();