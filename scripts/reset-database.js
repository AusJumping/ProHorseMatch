// Reset Database Script
// This script completely erases the database and resets it to fresh state
// It removes all horses, users, matches, messages, and conversations

// Import necessary modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('Starting full database reset...');

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the persistent storage file
const dataPath = path.join(__dirname, '..', '.data');
const persistentStoragePath = path.join(dataPath, 'persistent_storage.json');

// Check if the data directory exists
if (!fs.existsSync(dataPath)) {
  console.log('Creating .data directory...');
  fs.mkdirSync(dataPath, { recursive: true });
}

// Create a fresh empty database structure
const emptyDatabase = {
  horses: {},
  users: {},
  matches: {},
  messages: {},
  conversations: {},
  horseId: 1,
  userId: 1,
  matchId: 1,
  messageId: 1,
  conversationId: 1,
  seeded: false
};

try {
  // Write the empty database to the persistent storage file
  fs.writeFileSync(persistentStoragePath, JSON.stringify(emptyDatabase, null, 2));
  console.log('Database has been completely reset!');
  console.log('All data including horses, users, matches, messages, and conversations has been removed.');
  console.log('The next time the server starts, you will have a fresh database.');
} catch (error) {
  console.error('Error resetting database:', error);
  process.exit(1);
}

// Success!
console.log('Database reset completed successfully.');