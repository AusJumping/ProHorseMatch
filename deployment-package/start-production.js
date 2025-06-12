import { exec } from 'child_process';
import path from 'path';

console.log('Starting ProHorseMatch in production mode...');

// Install dependencies
exec('npm install --production', (error, stdout, stderr) => {
  if (error) {
    console.error('Error installing dependencies:', error);
    return;
  }
  
  console.log('Dependencies installed successfully');
  
  // Run database migration
  exec('npm run db:push', (error, stdout, stderr) => {
    if (error) {
      console.error('Error running database migration:', error);
      return;
    }
    
    console.log('Database migration completed');
    console.log('ProHorseMatch is ready to start!');
  });
});
