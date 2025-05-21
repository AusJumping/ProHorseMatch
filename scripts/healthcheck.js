#!/usr/bin/env node

/**
 * Application Health Check Script
 * 
 * This script can be run to verify that all components of the application
 * are functioning correctly, particularly after deployment.
 */

import { pool } from '../server/db.js';
import fs from 'fs';
import path from 'path';
import http from 'http';

const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds timeout for API checks

// Utility for colored console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green :
               type === 'warning' ? colors.yellow :
               type === 'error' ? colors.red :
               type === 'heading' ? colors.cyan :
               colors.reset;
  
  console.log(`${color}${message}${colors.reset}`);
}

// Check database connectivity
async function checkDatabase() {
  log('\n🔍 Checking database connection...', 'heading');
  
  try {
    const result = await pool.query('SELECT NOW() as time');
    log(`✅ Database connection successful at ${result.rows[0].time}`, 'success');
    
    // Check users table
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    log(`✅ Users table accessible - ${usersResult.rows[0].count} users found`, 'success');
    
    // Check horses table
    const horsesResult = await pool.query('SELECT COUNT(*) as count FROM horses');
    log(`✅ Horses table accessible - ${horsesResult.rows[0].count} horses found`, 'success');
    
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'error');
    return false;
  }
}

// Check for required static files
function checkStaticFiles() {
  log('\n🔍 Checking for required static files...', 'heading');
  
  const requiredFiles = [
    { path: path.resolve(process.cwd(), 'dist/public/index.html'), name: 'HTML Entry Point' },
    { path: path.resolve(process.cwd(), 'dist/index.js'), name: 'Server Bundle' }
  ];
  
  let allFilesFound = true;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file.path)) {
      log(`✅ ${file.name} found at ${file.path}`, 'success');
    } else {
      log(`❌ ${file.name} missing: ${file.path}`, 'error');
      allFilesFound = false;
    }
  }
  
  return allFilesFound;
}

// Check API endpoints
function checkApiEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: 'GET',
      timeout: HEALTH_CHECK_TIMEOUT
    };
    
    const req = http.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        log(`✅ Endpoint ${endpoint} - Status: ${res.statusCode}`, 'success');
        resolve(true);
      } else {
        log(`❌ Endpoint ${endpoint} - Status: ${res.statusCode}`, 'error');
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      log(`❌ Endpoint ${endpoint} - Error: ${error.message}`, 'error');
      resolve(false);
    });
    
    req.on('timeout', () => {
      log(`❌ Endpoint ${endpoint} - Timed out after ${HEALTH_CHECK_TIMEOUT}ms`, 'error');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

async function checkApiEndpoints() {
  log('\n🔍 Checking API endpoints...', 'heading');
  
  const endpoints = [
    '/api/constants',
    '/api/horses'
  ];
  
  const results = await Promise.all(endpoints.map(endpoint => checkApiEndpoint(endpoint)));
  return results.every(result => result);
}

// Check environment variables
function checkEnvironmentVariables() {
  log('\n🔍 Checking environment variables...', 'heading');
  
  const requiredVars = [
    { name: 'DATABASE_URL', description: 'PostgreSQL connection string' },
    { name: 'NODE_ENV', description: 'Environment mode' },
    { name: 'STRIPE_SECRET_KEY', description: 'Stripe secret key' },
    { name: 'VITE_STRIPE_PUBLIC_KEY', description: 'Stripe public key' }
  ];
  
  let allVarsPresent = true;
  
  for (const variable of requiredVars) {
    if (process.env[variable.name]) {
      log(`✅ ${variable.name} is set`, 'success');
    } else {
      log(`⚠️ ${variable.name} (${variable.description}) is not set`, 'warning');
      allVarsPresent = false;
    }
  }
  
  return allVarsPresent;
}

// Run all health checks
async function runHealthCheck() {
  log('🏥 STARTING APPLICATION HEALTH CHECK', 'heading');
  log('======================================', 'heading');
  
  const dbOk = await checkDatabase();
  const filesOk = checkStaticFiles();
  const apiOk = await checkApiEndpoints();
  const envVarsOk = checkEnvironmentVariables();
  
  log('\n📊 HEALTH CHECK SUMMARY', 'heading');
  log('======================================', 'heading');
  log(`Database: ${dbOk ? '✅ OK' : '❌ FAILED'}`, dbOk ? 'success' : 'error');
  log(`Static Files: ${filesOk ? '✅ OK' : '❌ FAILED'}`, filesOk ? 'success' : 'error');
  log(`API Endpoints: ${apiOk ? '✅ OK' : '❌ FAILED'}`, apiOk ? 'success' : 'error');
  log(`Environment Variables: ${envVarsOk ? '✅ OK' : '⚠️ WARNING'}`, envVarsOk ? 'success' : 'warning');
  
  const overallHealth = dbOk && filesOk && apiOk;
  
  log('\n🏁 OVERALL HEALTH: ' + (overallHealth ? '✅ GOOD' : '❌ ISSUES DETECTED'), overallHealth ? 'success' : 'error');
  
  if (!overallHealth) {
    log('\nPlease check the issues above before proceeding with deployment.', 'warning');
  } else {
    log('\nAll critical systems are operational! The application is ready for deployment.', 'success');
  }
  
  // Close database connection
  await pool.end();
}

runHealthCheck().catch(error => {
  log(`Unhandled error in health check: ${error.message}`, 'error');
  process.exit(1);
});