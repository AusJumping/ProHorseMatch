// Script to update all horses to belong to owner@example.com account
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('Starting horse ownership update...');

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the persistent storage file
const dataPath = path.join(__dirname, '..', '.data');
const persistentStoragePath = path.join(dataPath, 'persistent_storage.json');

// Check if the data directory and file exist
if (!fs.existsSync(dataPath) || !fs.existsSync(persistentStoragePath)) {
  console.error('Database storage file not found!');
  process.exit(1);
}

try {
  // Read the current database
  const dbData = JSON.parse(fs.readFileSync(persistentStoragePath, 'utf8'));
  
  console.log('Current database loaded.');
  console.log(`Found ${Object.keys(dbData.horses).length} horses in database.`);
  
  // Get current horses
  const horses = dbData.horses;
  let updateCount = 0;
  
  // Update all horses to have owner_id: 4 (owner@example.com)
  for (const horseId in horses) {
    const horse = horses[horseId];
    console.log(`Updating horse: ${horse.name} (ID: ${horse.id}) from owner ${horse.owner_id} to owner 4`);
    horse.owner_id = 4;
    updateCount++;
  }
  
  // Save the updated database
  fs.writeFileSync(persistentStoragePath, JSON.stringify(dbData, null, 2));
  
  console.log(`Successfully updated ${updateCount} horses to belong to owner@example.com (ID: 4).`);
} catch (error) {
  console.error('Error updating horse ownership:', error);
  process.exit(1);
}

console.log('Horse ownership update completed successfully.');