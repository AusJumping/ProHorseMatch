#!/bin/bash

# ProHorseMatch Deployment Package Creator
echo "Creating deployment package for ProHorseMatch..."

# Create deployment directory
mkdir -p deployment-package

# Copy essential files and directories
echo "Copying application files..."
cp -r server deployment-package/
cp -r client deployment-package/
cp -r shared deployment-package/
cp -r scripts deployment-package/
cp -r public deployment-package/

# Copy configuration files
cp package.json deployment-package/
cp package-lock.json deployment-package/
cp tsconfig.json deployment-package/
cp vite.config.ts deployment-package/
cp drizzle.config.ts deployment-package/
cp production-config.js deployment-package/

# Copy deployment guides
cp deployment-guide.md deployment-package/
cp cpanel-deployment-steps.md deployment-package/

# Create .env template
cat > deployment-package/.env.example << EOF
NODE_ENV=production
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
SESSION_SECRET=your_secure_random_string_here
EOF

# Create production start script
cat > deployment-package/start-production.js << EOF
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
EOF

# Create README for deployment
cat > deployment-package/DEPLOYMENT-README.md << EOF
# ProHorseMatch Deployment Package

This package contains all files needed to deploy ProHorseMatch to your cPanel hosting.

## Quick Start
1. Upload all files to your cPanel File Manager (public_html directory)
2. Follow the instructions in cpanel-deployment-steps.md
3. Set up your database and environment variables
4. Start the Node.js application

## Important Files
- cpanel-deployment-steps.md: Complete deployment guide
- .env.example: Environment variables template
- start-production.js: Production startup helper

## Support
Refer to deployment-guide.md for detailed instructions and troubleshooting.
EOF

echo "Deployment package created in 'deployment-package' directory"
echo "You can now upload the contents of this directory to your cPanel hosting"