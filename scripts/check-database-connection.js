// Database connection check and diagnostic script
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Main function to check database connection
async function checkDatabaseConnection() {
  console.log('Starting database connection check...');
  
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set!');
    process.exit(1);
  }
  
  console.log('DATABASE_URL is set. Attempting to connect...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Check connection by running a simple query
    const result = await pool.query('SELECT NOW()');
    console.log(`Database connection successful! Server time: ${result.rows[0].now}`);
    
    // Get tables information
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      console.log(`Found ${tablesResult.rows.length} tables in the database:`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
    }
    
    // Check users table specifically
    try {
      const usersResult = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`Users table exists with ${usersResult.rows[0].count} records.`);
      
      // Print user IDs and emails (for debugging)
      const userDetailsResult = await pool.query('SELECT id, email, is_selling, subscription_status FROM users');
      console.log('\nUser accounts in database:');
      userDetailsResult.rows.forEach(user => {
        console.log(`ID: ${user.id}, Email: ${user.email}, Is Selling: ${user.is_selling}, Subscription: ${user.subscription_status}`);
      });
    } catch (error) {
      console.error('Error checking users table:', error.message);
      console.log('The users table may not exist or has a different structure.');
    }
    
    // Check horses table specifically
    try {
      const horsesResult = await pool.query('SELECT COUNT(*) FROM horses');
      console.log(`Horses table exists with ${horsesResult.rows[0].count} records.`);
      
      if (parseInt(horsesResult.rows[0].count) > 0) {
        // Print some horse details (for debugging)
        const horseDetailsResult = await pool.query('SELECT id, name, owner_id FROM horses LIMIT 5');
        console.log('\nSample horses in database:');
        horseDetailsResult.rows.forEach(horse => {
          console.log(`ID: ${horse.id}, Name: ${horse.name}, Owner ID: ${horse.owner_id}`);
        });
      }
    } catch (error) {
      console.error('Error checking horses table:', error.message);
      console.log('The horses table may not exist or has a different structure.');
    }
    
  } catch (error) {
    console.error('Database connection failed!', error);
    console.error('Error details:', error.message);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the check
checkDatabaseConnection().catch(error => {
  console.error('Unexpected error in database connection check:', error);
  process.exit(1);
});