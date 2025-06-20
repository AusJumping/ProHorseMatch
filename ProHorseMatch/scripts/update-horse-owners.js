// Script to update all horses to belong to owner@example.com account (ID: 4)
// Also correctly recreates the horses with all necessary details
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

// Define the horses with names from your request
const predefinedHorses = [
  {
    id: 9,
    name: 'Snow',
    owner_id: 4,
    location_country: 'Australia',
    location_radius_km: 100,
    price_min: 30000,
    price_max: 45000,
    currency: 'AUD',
    disciplines: ['Jumping', 'Eventing'],
    levels: ['1.20m', '1*'],
    breeds: ['Thoroughbred'],
    age: 10,
    sex: 'Gelding',
    height_hands: 16,
    height_cm: 163,
    temperament: 'Calm',
    description: 'Beautiful white gelding with excellent jumping ability.',
    pedigree: 'By White Lightning out of Snow Queen',
    videos: [],
    characteristics: ['Brave', 'Careful', 'Athletic'],
    photos: [
      'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
    created_at: new Date()
  },
  {
    id: 10,
    name: 'Flame',
    owner_id: 4,
    location_country: 'Australia',
    location_radius_km: 100,
    price_min: 55000,
    price_max: 75000,
    currency: 'AUD',
    disciplines: ['Dressage'],
    levels: ['Advanced'],
    breeds: ['Warmblood'],
    age: 14,
    sex: 'Mare',
    height_hands: 15.1,
    height_cm: 155,
    temperament: 'Spirited',
    description: 'Elegant chestnut mare with exceptional movement and presence.',
    pedigree: 'By Fireworks out of Dancing Queen',
    videos: [],
    characteristics: ['Forward', 'Expressive', 'Sensitive'],
    photos: [
      'https://images.unsplash.com/photo-1566251037378-5e04e3bec343?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
    created_at: new Date()
  },
  {
    id: 11,
    name: 'Misty',
    owner_id: 4,
    location_country: 'Australia',
    location_radius_km: 100,
    price_min: 25000,
    price_max: 35000,
    currency: 'AUD',
    disciplines: ['Eventing'],
    levels: ['1*', '2*'],
    breeds: ['Irish Sport Horse'],
    age: 13,
    sex: 'Mare',
    height_hands: 16,
    height_cm: 163,
    temperament: 'Bold',
    description: 'Reliable and brave eventing mare with excellent cross-country experience.',
    pedigree: 'By Morning Fog out of Irish Lass',
    videos: [],
    characteristics: ['Brave', 'Reliable', 'Athletic'],
    photos: [
      'https://images.unsplash.com/photo-1551884831-bbf3cdc6469e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
    created_at: new Date()
  },
  {
    id: 12,
    name: 'Midnight',
    owner_id: 4,
    location_country: 'Australia',
    location_radius_km: 100,
    price_min: 15000,
    price_max: 22000,
    currency: 'AUD',
    disciplines: ['Dressage', 'Jumping'],
    levels: ['Novice', '1.00m'],
    breeds: ['Welsh Cob'],
    age: 16,
    sex: 'Gelding',
    height_hands: 13.1,
    height_cm: 135,
    temperament: 'Kind',
    description: 'Perfect children\'s pony, bombproof and well-trained.',
    pedigree: 'By Black Star out of Welsh Lady',
    videos: [],
    characteristics: ['Bombproof', 'Kind', 'Steady'],
    photos: [
      'https://images.unsplash.com/photo-1569470144685-470246e54ac4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
    created_at: new Date()
  },
  {
    id: 13,
    name: 'Goldie',
    owner_id: 4,
    location_country: 'Australia',
    location_radius_km: 100,
    price_min: 40000,
    price_max: 55000,
    currency: 'AUD',
    disciplines: ['Jumping'],
    levels: ['1.30m', '1.40m'],
    breeds: ['Dutch Warmblood'],
    age: 11,
    sex: 'Gelding',
    height_hands: 15.3,
    height_cm: 160,
    temperament: 'Bold',
    description: 'Competitive show jumper with careful technique and plenty of scope.',
    pedigree: 'By Golden Boy out of Dutch Diamond',
    videos: [],
    characteristics: ['Brave', 'Careful', 'Competitive'],
    photos: [
      'https://images.unsplash.com/photo-1553284965-fa99c8749230?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ],
    created_at: new Date()
  }
];

try {
  // Read the current database
  const dbData = JSON.parse(fs.readFileSync(persistentStoragePath, 'utf8'));
  
  console.log('Current database loaded.');
  
  // Update horses map with our predefined horses
  const horsesMap = {};
  predefinedHorses.forEach(horse => {
    horsesMap[horse.id] = horse;
  });
  
  // Replace horses object with our updated one
  dbData.horses = horsesMap;
  
  // Save the updated database
  fs.writeFileSync(persistentStoragePath, JSON.stringify(dbData, null, 2));
  
  console.log(`Successfully added ${predefinedHorses.length} horses to owner@example.com (ID: 4).`);
} catch (error) {
  console.error('Error updating horse ownership:', error);
  process.exit(1);
}

console.log('Horse ownership update completed successfully.');