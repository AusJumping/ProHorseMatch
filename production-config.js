// Production configuration for cPanel deployment
export const productionConfig = {
  // Database configuration
  database: {
    // You'll need to update this with your cPanel database details
    host: 'localhost', // Usually localhost on shared hosting
    database: 'your_database_name', // Your cPanel database name
    user: 'your_db_username', // Your cPanel database user
    password: 'your_db_password', // Your cPanel database password
    port: 3306, // Usually 3306 for MySQL
  },
  
  // Server configuration
  server: {
    port: process.env.PORT || 3000, // cPanel will assign the port
    host: '0.0.0.0', // Bind to all interfaces
  },
  
  // Security settings
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'your-secure-session-secret-here',
    cookieSecure: true, // HTTPS only in production
    cookieSameSite: 'lax',
    cookieHttpOnly: true,
  },
  
  // File paths for cPanel
  paths: {
    uploads: './uploads', // Local uploads directory
    static: './public', // Static files directory
  }
};