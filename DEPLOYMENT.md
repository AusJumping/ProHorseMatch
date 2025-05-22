# ProHorseMatch Deployment Guide

This document provides instructions for deploying the ProHorseMatch application to production.

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Verified all frontend routes work correctly
- [ ] Tested user authentication flows (login, register, etc.)
- [ ] Confirmed database connections are properly configured
- [ ] Checked that all API endpoints are responding correctly
- [ ] Ensured environment variables are properly set
- [ ] Verified media uploading and storage functionality

## Environment Variables

The following environment variables are required in production:

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session management
- `NODE_ENV`: Set to "production"
- `STRIPE_SECRET_KEY`: Stripe secret key for payment processing
- `VITE_STRIPE_PUBLIC_KEY`: Stripe public key (client-side)

## Deployment Steps

1. **Database Preparation**
   - Run the database initialization script:
     ```
     node scripts/init-deployment-db.js
     ```
   - This will ensure all tables and columns exist in the production database

2. **Build the Application**
   - Build the frontend and backend for production:
     ```
     npm run build
     ```
   - Verify the build output in the `dist` directory

3. **Start the Application**
   - Start the application in production mode:
     ```
     npm run start
     ```
   - The server will start on port 5000 and serve both the API and client

## Post-Deployment Verification

After deployment, check that:

- [ ] The application loads correctly at the deployed URL
- [ ] Users can register and log in
- [ ] Searches and filters work properly
- [ ] Horse listings display correctly
- [ ] Messaging functions work
- [ ] Payments and subscriptions function properly

## Troubleshooting

If you encounter issues after deployment:

1. **API Errors**
   - Check server logs for specific error messages
   - Verify that all environment variables are set correctly
   - Ensure the database is accessible from the deployment environment

2. **Frontend Issues**
   - Check browser console for JavaScript errors
   - Verify that the build process completed successfully
   - Ensure that API endpoints are accessible from the client

3. **Database Issues**
   - Run the database initialization script again
   - Check database connection credentials
   - Verify that all required tables exist in the database

## Deployment Enhancement Tips

- Consider setting up a CI/CD pipeline for automated testing and deployment
- Implement database backups and restoration procedures
- Create monitoring and logging solutions to track application health
- Set up automated alerts for critical errors or performance issues