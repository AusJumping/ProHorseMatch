// A simple one-time script to reassign all horses to user ID 3
import { storage } from '../server/storage.js';

async function reassignHorses() {
  try {
    console.log('Starting horse reassignment...');
    
    // Get all horses
    const horses = await storage.getHorses();
    console.log(`Found ${horses.length} horses to reassign`);
    
    // The user ID we want to assign all horses to (owner@example.com)
    const ownerUserId = 3;
    
    // Verify owner exists and has selling permission
    const owner = await storage.getUserById(ownerUserId);
    if (!owner) {
      console.error('Owner with ID 3 not found!');
      return;
    }
    
    if (!owner.is_selling) {
      console.error('User does not have selling permission!');
      return;
    }
    
    console.log(`Reassigning all horses to owner: ${owner.email} (ID: ${ownerUserId})`);
    
    // Update each horse to be owned by this user
    let successCount = 0;
    for (const horse of horses) {
      try {
        console.log(`Reassigning horse: ${horse.name} (ID: ${horse.id}) from owner ${horse.owner_id} to ${ownerUserId}`);
        await storage.updateHorse(horse.id, { owner_id: ownerUserId });
        successCount++;
      } catch (err) {
        console.error(`Failed to reassign horse ${horse.id}: ${err.message}`);
      }
    }
    
    console.log(`Successfully reassigned ${successCount} out of ${horses.length} horses to owner ID ${ownerUserId}`);
  } catch (err) {
    console.error('Error in horse reassignment script:', err);
  }
}

// Run the function
reassignHorses();