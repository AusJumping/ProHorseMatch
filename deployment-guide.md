# ProHorseMatch Deployment Guide

## Prerequisites
- cPanel hosting with Node.js support
- MySQL/PostgreSQL database access
- Domain pointed to hosting server

## Files to Upload
1. All project files except `node_modules/`
2. Database migration files
3. Environment variables configuration

## Environment Variables Needed
```
DATABASE_URL=your_production_database_url
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NODE_ENV=production
```

## Deployment Steps

### 1. Database Setup
- Create production database in cPanel
- Run migration scripts to create tables
- Update DATABASE_URL in environment

### 2. File Upload
- Upload all project files via File Manager or FTP
- Exclude node_modules folder
- Set proper file permissions

### 3. Dependencies Installation
- Access Terminal in cPanel
- Run: `npm install --production`
- Install TypeScript globally: `npm install -g typescript tsx`

### 4. Build Process
- Run: `npm run build` (if build script exists)
- Ensure all TypeScript files are compiled

### 5. Server Configuration
- Set Node.js version (18+ recommended)
- Configure startup file: `server/index.ts`
- Set environment variables in Node.js settings

### 6. SSL Certificate
- Enable SSL/HTTPS for secure connections
- Update any hardcoded HTTP URLs to HTTPS

### 7. Testing
- Test all functionality after deployment
- Verify database connections
- Check file uploads to Cloudinary
- Test payment processing

## Post-Deployment Checklist
- [ ] Website loads correctly
- [ ] User registration/login works
- [ ] Horse listings display properly
- [ ] Image uploads function
- [ ] Payment processing works
- [ ] Database operations complete successfully
- [ ] SSL certificate active
- [ ] All API endpoints responding

## Common Issues
- **Database Connection:** Verify DATABASE_URL format
- **File Permissions:** Set 755 for directories, 644 for files
- **Node.js Version:** Ensure compatibility (18+)
- **Environment Variables:** Double-check all values
- **SSL Issues:** Verify certificate installation

## Final URL
Once deployed successfully, your live URL will be:
https://prohorsematch.com

Provide this URL to your mobile app developer.