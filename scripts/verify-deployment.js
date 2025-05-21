#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * This script runs pre-deployment checks to ensure the application
 * is ready for production deployment.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Utility function for colored console output
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

// Start the verification process
log('🔍 STARTING DEPLOYMENT VERIFICATION', 'heading');
log('======================================', 'heading');

// Check 1: Ensure build script is correctly configured
log('\n📦 Checking build configuration...');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

if (packageJson.scripts.build && packageJson.scripts.start) {
  log('✅ Build and start scripts are configured in package.json', 'success');
} else {
  log('❌ Build or start scripts missing in package.json', 'error');
  process.exit(1);
}

// Check 2: Verify necessary environment variables
log('\n🔐 Checking environment variables...');
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = [];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
});

if (missingVars.length === 0) {
  log('✅ All required environment variables are set', 'success');
} else {
  log(`⚠️ Missing environment variables: ${missingVars.join(', ')}`, 'warning');
  log('These will need to be set in the deployment environment', 'warning');
}

// Check 3: Verify dependencies
log('\n📚 Checking dependencies...');
try {
  const output = execSync('npm ls --depth=0', { stdio: ['pipe', 'pipe', 'pipe'] }).toString();
  log('✅ Dependencies check passed', 'success');
} catch (error) {
  log('⚠️ Some dependencies may have issues. This could potentially affect deployment.', 'warning');
}

// Check 4: Verify TypeScript compilation
log('\n🔧 Checking TypeScript compilation...');
try {
  execSync('npm run check', { stdio: 'inherit' });
  log('✅ TypeScript compilation check passed', 'success');
} catch (error) {
  log('❌ TypeScript compilation failed. This will cause deployment issues.', 'error');
  process.exit(1);
}

// Check 5: Test the build process
log('\n🏗️ Testing build process...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  
  // Verify the build output
  if (fs.existsSync('./dist/public') && fs.existsSync('./dist/index.js')) {
    log('✅ Build completed successfully', 'success');
  } else {
    log('❌ Build completed but expected output files are missing', 'error');
    process.exit(1);
  }
} catch (error) {
  log('❌ Build process failed. This will prevent deployment.', 'error');
  process.exit(1);
}

// All checks passed!
log('\n🚀 DEPLOYMENT VERIFICATION SUCCESSFUL', 'heading');
log('=======================================', 'heading');
log('Your application is ready for deployment!', 'success');
log('Make sure to set all required environment variables in your deployment environment.', 'info');