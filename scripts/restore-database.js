#!/usr/bin/env node

/**
 * Database Restoration Script
 * 
 * This script restores the database from a backup file
 * in case of deployment issues or data loss.
 */

import { pool } from '../server/db.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptForBackupFile() {
  const backupDir = path.resolve(process.cwd(), 'backups');
  
  if (!fs.existsSync(backupDir)) {
    console.error('No backups directory found!');
    return null;
  }
  
  const backupFiles = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('prohorsematch-backup-') && file.endsWith('.json'))
    .sort()
    .reverse(); // Most recent first
  
  if (backupFiles.length === 0) {
    console.error('No backup files found!');
    return null;
  }
  
  console.log('Available backups:');
  backupFiles.forEach((file, i) => {
    console.log(`[${i + 1}] ${file}`);
  });
  
  return new Promise(resolve => {
    rl.question('Enter the number of the backup to restore (or press Enter for the most recent): ', (answer) => {
      const index = parseInt(answer) - 1 || 0;
      if (index >= 0 && index < backupFiles.length) {
        resolve(path.join(backupDir, backupFiles[index]));
      } else {
        console.log('Invalid selection, using the most recent backup');
        resolve(path.join(backupDir, backupFiles[0]));
      }
    });
  });
}

async function confirmRestore() {
  return new Promise(resolve => {
    rl.question('WARNING: This will overwrite current database data. Continue? (y/n): ', (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function restoreDatabase() {
  console.log('Starting database restoration process...');
  
  try {
    const backupFile = await promptForBackupFile();
    if (!backupFile) {
      console.log('Restoration cancelled - no backup file available');
      return;
    }
    
    const confirmed = await confirmRestore();
    if (!confirmed) {
      console.log('Restoration cancelled by user');
      return;
    }
    
    console.log(`Restoring from backup: ${backupFile}`);
    
    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const tables = Object.keys(backupData);
    
    console.log(`Found ${tables.length} tables in backup`);
    
    // Start a transaction
    await pool.query('BEGIN');
    
    // Restore each table
    for (const table of tables) {
      console.log(`Restoring table: ${table}`);
      
      // Clear existing data
      await pool.query(`DELETE FROM "${table}"`);
      
      // Get records to insert
      const records = backupData[table];
      
      if (records.length === 0) {
        console.log(`  - Table ${table} is empty, skipping`);
        continue;
      }
      
      // Get column names from first record
      const columns = Object.keys(records[0]);
      
      // Insert records in batches
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        // Generate placeholder values
        const valuePlaceholders = batch.map((_, recordIndex) => {
          return `(${columns.map((_, colIndex) => `$${recordIndex * columns.length + colIndex + 1}`).join(', ')})`;
        }).join(', ');
        
        // Flatten values for insertion
        const values = batch.flatMap(record => columns.map(col => record[col]));
        
        // Insert batch
        await pool.query(
          `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${valuePlaceholders}`,
          values
        );
      }
      
      console.log(`  - ${records.length} records restored to ${table}`);
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    console.log('Restoration completed successfully!');
    
  } catch (error) {
    console.error('Database restoration failed:', error);
    
    // Rollback transaction on error
    try {
      await pool.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    
  } finally {
    rl.close();
    await pool.end();
  }
}

// Run the restoration
restoreDatabase().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});