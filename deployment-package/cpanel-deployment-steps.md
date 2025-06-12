# cPanel Deployment Steps for ProHorseMatch

## Step 1: Prepare Your cPanel Environment

### A. Create Database
1. Log into cPanel
2. Go to "MySQL Databases" or "PostgreSQL Databases"
3. Create new database: `prohorse_main`
4. Create database user with full privileges
5. Note down: database name, username, password

### B. Enable Node.js
1. Find "Node.js" or "Node.js App" in cPanel
2. Create new Node.js app
3. Set Node.js version to 18+ 
4. Set application root: `/public_html`
5. Set startup file: `server/index.js`

## Step 2: Upload Files

### Files to Upload (via File Manager or FTP):
```
/public_html/
├── server/
├── client/
├── shared/
├── scripts/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── drizzle.config.ts
├── production-config.js
└── deployment-guide.md
```

### EXCLUDE these folders:
- `node_modules/`
- `.git/`
- `dist/`

## Step 3: Database Setup

### Create DATABASE_URL
Format: `postgresql://username:password@localhost:5432/database_name`
Or for MySQL: `mysql://username:password@localhost:3306/database_name`

### Run Database Migration
1. Access Terminal in cPanel
2. Navigate to your app directory: `cd public_html`
3. Install dependencies: `npm install`
4. Run migration: `npm run db:push`

## Step 4: Environment Variables

### Set in Node.js App Environment Variables:
```
NODE_ENV=production
DATABASE_URL=your_database_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
SESSION_SECRET=your_secure_random_string
```

## Step 5: Build and Start

### In Terminal:
```bash
cd public_html
npm install --production
npm run build
```

### Start the Application:
- In Node.js App section, click "Start"
- Your app will be available at: https://prohorsematch.com

## Step 6: SSL Certificate
1. Go to "SSL/TLS" in cPanel
2. Enable "Force HTTPS Redirect"
3. Install SSL certificate (Let's Encrypt is usually free)

## Step 7: Test Everything
- Visit https://prohorsematch.com
- Test user registration/login
- Test horse listings
- Test image uploads
- Test messaging system

## Troubleshooting Common Issues

### App Won't Start:
- Check Node.js logs in cPanel
- Verify DATABASE_URL format
- Ensure all environment variables are set

### Database Connection Failed:
- Verify database credentials
- Check if database exists
- Ensure user has proper permissions

### 404 Errors:
- Check if files uploaded correctly
- Verify startup file path in Node.js settings
- Ensure proper file permissions (755 for directories, 644 for files)

### Images Not Loading:
- Verify Cloudinary credentials
- Check file upload permissions
- Test Cloudinary API connection

## Final Step
Once everything works, provide this URL to your designer:
**https://prohorsematch.com**