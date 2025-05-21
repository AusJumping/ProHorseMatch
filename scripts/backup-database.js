#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * This script creates a backup of the database before deployment
 * to ensure data safety during the deployment process.
 */

import { pool } from '../server/db.js';
import fs from 'fs';
import path from 'path';

async function backupDatabase() {
  console.log('Starting database backup process...');
  
  try {
    // Create backups directory if it doesn't exist
    const backupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Generate timestamp for the backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilePath = path.join(backupDir, `prohorsematch-backup-${timestamp}.json`);
    
    console.log(`Creating backup at: ${backupFilePath}`);
    
    // Get all table names
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`Found ${tables.length} tables to backup`);
    
    // Create backup object to store all table data
    const backup = {};
    
    // Backup each table
    for (const table of tables) {
      console.log(`Backing up table: ${table}`);
      
      const dataResult = await pool.query(`SELECT * FROM "${table}"`);
      backup[table] = dataResult.rows;
      
      console.log(`  - ${dataResult.rows.length} records saved`);
    }
    
    // Write backup to file
    fs.writeFileSync(backupFilePath, JSON.stringify(backup, null, 2));
    
    console.log(`Backup completed successfully!`);
    console.log(`Backup saved to: ${backupFilePath}`);
    
  } catch (error) {
    console.error('Database backup failed:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the backup
backupDatabase().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});