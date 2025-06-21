import type { Express, Response, Request } from "express";
import express from "express";

// Extend Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}
import { createServer, type Server } from "http";
import { storage, MemStorage, resetStorageToEmpty } from "./storage";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import Stripe from "stripe";
import cookieParser from "cookie-parser";
import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinary";
import { 
  insertHorseSchema, 
  insertUserSchema,
  insertSellingUserSchema, 
  insertSearchingUserSchema, 
  insertMatchSchema, 
  insertMessageSchema,
  insertConversationSchema,
  type InsertMessage,
  type InsertConversation,
  disciplines,
  sexes,
  colours,
  breeds,
  characteristics,
  countries,
  jumpingLevels,
  dressageLevels,
  eventingLevels
} from "@shared/schema";

// Ensure we have test users available but NOT test horses
// We remove the default horses completely from our application
(async () => {
  console.log("Setting up test users only (no default horses)...");
  try {
    // Remove all horses owned by user ID 1 (problematic seed horses)
    if (storage instanceof MemStorage) {
      const internalHorsesMap = storage.getInternalHorsesMap();
      if (internalHorsesMap) {
        console.log("Checking for seed horses with owner_id: 1 to prevent them from appearing...");
        const horsesToRemove = [];
        
        // Find all problematic horses (owned by user 1)
        internalHorsesMap.forEach((horse) => {
          if (horse.owner_id === 1) {
            horsesToRemove.push(horse.id);
            console.log(`Found problematic horse: ${horse.name} (ID: ${horse.id}) to remove`);
          }
        });
        
        // Delete all problematic horses
        for (const horseId of horsesToRemove) {
          internalHorsesMap.delete(horseId);
          console.log(`Removed problematic horse with ID ${horseId}`);
        }
        
        if (horsesToRemove.length > 0) {
          console.log(`Successfully removed ${horsesToRemove.length} problematic horses`);
        } else {
          console.log("No problematic horses found - system is clean");
        }
      }
    }
    
    // Check if the owner user exists
    const ownerEmail = "owner@example.com";
    let owner = await storage.getUserByEmail(ownerEmail);
    
    if (!owner) {
      console.log(`Creating test owner user: ${ownerEmail}`);
      owner = await storage.createUser({
        email: ownerEmail,
        password: "password123",
        business_name: "Elite Sporthorses",
        contact_name: "John Smith",
        is_selling: true,
        is_searching: false,
        name: null
      });
      console.log("Created owner:", owner);
    } else {
      console.log("Test owner already exists:", owner);
    }
    
    // Check if the customer user exists
    const customerEmail = "customer@example.com";
    let customer = await storage.getUserByEmail(customerEmail);
    
    if (!customer) {
      console.log(`Creating test customer user: ${customerEmail}`);
      customer = await storage.createUser({
        email: customerEmail,
        password: "password123",
        name: "Sarah Thompson",
        is_searching: true,
        is_selling: false,
        location_country: "Australia",
        preferred_disciplines: ["Jumping"],
        currency: "AUD"
      });
      console.log("Created customer:", customer);
    } else {
      console.log("Test customer already exists:", customer);
    }
  } catch (error) {
    console.error("Error setting up test users:", error);
  }
})();
import MemoryStore from "memorystore";

// Extend Express Session
declare module "express-session" {
  interface SessionData {
    userId?: number;
    userType?: string;
  }
}

const SessionStore = MemoryStore(session);

// Configure multer for memory storage (we'll upload to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug all POST requests to /api/messages
  app.use((req, res, next) => {
    if (req.method === 'POST' && req.url === '/api/messages') {
      console.log("=== INTERCEPTED POST /api/messages ===");
      console.log("Request headers:", req.headers);
      console.log("Request body:", req.body);
    }
    next();
  });

  // Initialize Stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('Missing STRIPE_SECRET_KEY - Payment features will not work');
  }
  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
    : null;
  // Configure session middleware
  const isProduction = process.env.NODE_ENV === "production";
  
  // Serve static files from the uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  
  // Add cookie parser middleware
  app.use(cookieParser());
  
  app.use(
    session({
      cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer sessions
        secure: false, // Setting to false for development and easier testing
        httpOnly: true,
        sameSite: 'lax' // Always use lax to improve session persistence across redirects
      }, 
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
        stale: false, // Don't auto-expire sessions
      }),
      resave: true, // Force session to be saved back to the store
      saveUninitialized: true, // Save uninitialized sessions
      secret: process.env.SESSION_SECRET || "proHorseMatchSecret",
      // Add rolling: true to update the cookie expiration on every response
      rolling: true
    })
  );

  // Auth routes
  app.post("/api/auth/register/customer", async (req, res) => {
    try {
      const validatedData = insertSearchingUserSchema.parse(req.body);
      
      // Check if email is already taken
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // In a real app, we would hash the password here
      const user = await storage.createUser({
        ...validatedData,
        is_searching: true
      });
      
      // Set user session
      req.session.userId = user.id;
      
      return res.status(201).json({ 
        id: user.id,
        name: user.name,
        email: user.email,
        is_searching: true,
        is_selling: false
      });
    } catch (error) {
      console.error("Register searching user error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  app.post("/api/auth/register/owner", async (req, res) => {
    try {
      const validatedData = insertSellingUserSchema.parse(req.body);
      
      // Check if email is already taken
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // In a real app, we would hash the password here
      const user = await storage.createUser({
        ...validatedData,
        is_selling: true
      });
      
      // Set user session
      req.session.userId = user.id;
      
      return res.status(201).json({ 
        id: user.id,
        business_name: user.business_name,
        contact_name: user.contact_name,
        email: user.email,
        is_searching: false,
        is_selling: true
      });
    } catch (error) {
      console.error("Register selling user error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("=== LOGIN REQUEST START ===");
      console.log("Login attempt:", req.body);
      console.log("Request headers:", {
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        referer: req.headers.referer
      });
      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log("Login failed - Missing required fields");
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      console.log("Login attempt for:", email);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log("Login failed - User not found:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (user.password !== password) {
        console.log("Login failed - Invalid password for user:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log("Login successful - Setting user session:", {
        id: user.id,
        is_searching: user.is_searching,
        is_selling: user.is_selling,
        sessionId: req.sessionID
      });
      
      req.session.userId = user.id;
      
      // Create a simple auth token instead of relying on sessions
      const authToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      // Store auth token mapping in memory (simple approach for development)
      if (!global.authTokens) {
        global.authTokens = new Map();
      }
      global.authTokens.set(authToken, {
        userId: user.id,
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      });
      
      console.log("Created auth token:", authToken);
      
      // Set multiple cookies to ensure one works
      res.cookie('auth_token', authToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false, // Allow frontend access
        secure: false,
        sameSite: 'lax',
        path: '/'
      });
      
      // Also set as header for immediate use
      res.setHeader('X-Auth-Token', authToken);
      res.setHeader('Access-Control-Expose-Headers', 'X-Auth-Token');
      
      console.log("=== RESPONSE DEBUG ===");
      console.log("Setting auth token header:", authToken);
      console.log("Response headers:", res.getHeaders());
      
      // Return full user data including subscription info AND auth token
      return res.json({
        id: user.id,
        name: user.name,
        business_name: user.business_name,
        contact_name: user.contact_name,
        email: user.email,
        is_searching: user.is_searching,
        is_selling: user.is_selling,
        stripe_customer_id: user.stripe_customer_id,
        stripe_subscription_id: user.stripe_subscription_id,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        subscription_end_date: user.subscription_end_date,
        auth_token: authToken // Include token directly in response body
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.clearCookie("auth_token");
      return res.json({ message: "Logged out successfully" });
    });
  });

  // Helper function to validate auth token
  const validateAuthToken = (token: string): number | null => {
    try {
      const [userId, timestamp, hash] = token.split(':');
      const expectedHash = Buffer.from(`${userId}${timestamp}proHorseMatch`).toString('base64');
      
      if (hash === expectedHash) {
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (tokenAge < maxAge) {
          return parseInt(userId);
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  app.get("/api/auth/me", async (req, res) => {
    // Check for auth token in multiple places
    let authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc: any, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      authToken = cookies.auth_token;
    }
    
    console.log("Auth check - Token debug:", {
      authToken: authToken ? authToken.substring(0, 10) + '...' : 'none',
      authHeader: req.headers.authorization,
      cookies: req.headers.cookie,
      hasGlobalTokens: !!global.authTokens,
      tokenCount: global.authTokens ? global.authTokens.size : 0
    });
    
    if (!authToken || !global.authTokens) {
      console.log("Auth check failed - No token or token store");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const tokenData = global.authTokens.get(authToken);
    if (!tokenData || tokenData.expires < Date.now()) {
      console.log("Auth check failed - Invalid or expired token");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = tokenData.userId;
    
    try {
      console.log(`Auth check - Looking up user with ID ${userId}`);
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create profile object based on user roles
      const profile: any = {};
      
      if (user.is_searching) {
        // Add searching-specific profile data
        profile.location_country = user.location_country;
        profile.location_radius_km = user.location_radius_km;
        profile.preferred_disciplines = user.preferred_disciplines;
        profile.preferred_levels = user.preferred_levels;
        profile.preferred_breeds = user.preferred_breeds;
        profile.age_range_min = user.age_range_min;
        profile.age_range_max = user.age_range_max;
        profile.height_range_min = user.height_range_min;
        profile.height_range_max = user.height_range_max;
        profile.preferred_sexes = user.preferred_sexes;
        profile.breeding_preferences = user.breeding_preferences;
        profile.preferred_characteristics = user.preferred_characteristics;
        profile.price_range_min = user.price_range_min;
        profile.price_range_max = user.price_range_max;
        profile.currency = user.currency;
      }
      
      return res.json({ 
        id: user.id,
        name: user.name,
        business_name: user.business_name,
        contact_name: user.contact_name,
        email: user.email,
        is_searching: user.is_searching,
        is_selling: user.is_selling,
        profile
      });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  // Middleware to check if a user is authenticated (session-based)
  const isAuthenticated = (req: any, res: Response, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Middleware to check if a user is authenticated (token-based)
  const isTokenAuthenticated = async (req: any, res: Response, next: any) => {
    console.log(`Token auth check for ${req.method} ${req.path}`);
    
    // Check for auth token in multiple places
    let authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc: any, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      authToken = cookies.auth_token;
    }
    
    console.log("Token auth debug:", {
      authToken: authToken ? authToken.substring(0, 10) + '...' : 'none',
      authHeader: req.headers.authorization,
      hasGlobalTokens: !!global.authTokens,
      tokenCount: global.authTokens ? global.authTokens.size : 0
    });
    
    if (!authToken || !global.authTokens) {
      console.log("Token auth failed - No token or token store");
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const tokenData = global.authTokens.get(authToken);
    if (!tokenData || tokenData.expires < Date.now()) {
      console.log("Token auth failed - Invalid or expired token");
      return res.status(401).json({ message: "Authentication required" });
    }
    
    console.log(`Token auth success for user ${tokenData.userId}`);
    // Add user info to request for use in route handlers
    req.userId = tokenData.userId;
    next();
  };
  
  // Admin routes
  app.delete("/api/admin/delete-all-horses", isAuthenticated, async (req, res) => {
    try {
      console.log("Delete all horses request received");
      
      // Get user to verify they are a seller
      const userId = req.session.userId;
      const user = await storage.getUserById(userId);
      
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only sellers can perform this action" });
      }
      
      // Get all horses
      const horses = await storage.getHorses();
      
      // Delete each horse
      let deletedCount = 0;
      for (const horse of horses) {
        const success = await storage.deleteHorse(horse.id);
        if (success) deletedCount++;
      }
      
      console.log(`Deleted ${deletedCount} horses`);
      
      return res.status(200).json({ 
        message: `Successfully deleted ${deletedCount} horses`, 
        deletedCount 
      });
    } catch (error) {
      console.error("Delete all horses error:", error);
      return res.status(500).json({ message: "Failed to delete horses" });
    }
  });
  
  // Delete specific horses (Maestro, Bella, Cassini)
  app.delete("/api/admin/delete-specific-horses", isAuthenticated, async (req, res) => {
    try {
      console.log("Delete specific horses request received");
      
      // Get user to verify they are a seller
      const userId = req.session.userId;
      console.log("Current user ID:", userId);
      
      const user = await storage.getUserById(userId);
      console.log("User found:", user ? "Yes" : "No", user ? `(is_selling: ${user.is_selling})` : "");
      
      if (!user || !user.is_selling) {
        console.log("User doesn't have seller permissions");
        return res.status(403).json({ message: "Only sellers can perform this action" });
      }
      
      // Get all horses
      const horses = await storage.getHorses();
      console.log(`Found ${horses.length} total horses in database`);
      
      // Target specific horse names
      const targetNames = ['Maestro', 'Bella', 'Cassini'];
      
      console.log("Looking for horses with names:", targetNames);
      const horseSummary = horses.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id }));
      console.log("All horses:", JSON.stringify(horseSummary));
      
      // Delete specific horses (regardless of owner)
      let deletedCount = 0;
      let deletedHorses = [];
      
      for (const horse of horses) {
        if (targetNames.includes(horse.name)) {
          console.log(`Attempting to delete horse: ${horse.name} (ID: ${horse.id})`);
          try {
            const success = await storage.deleteHorse(horse.id);
            if (success) {
              deletedCount++;
              deletedHorses.push(horse.name);
              console.log(`Successfully deleted horse: ${horse.name} (ID: ${horse.id})`);
            } else {
              console.log(`Failed to delete horse: ${horse.name} (ID: ${horse.id})`);
            }
          } catch (deleteError) {
            console.error(`Error deleting horse ${horse.name}:`, deleteError);
          }
        }
      }
      
      console.log(`Deleted ${deletedCount} specified horses:`, deletedHorses);
      
      // Return the result
      return res.status(200).json({ 
        message: `Successfully deleted ${deletedCount} horses`, 
        deletedCount,
        deletedHorses
      });
    } catch (error) {
      console.error("Delete specific horses error:", error);
      return res.status(500).json({ message: "Failed to delete specific horses" });
    }
  });
  
  // Delete horse by ID - direct method
  app.delete("/api/admin/delete-horse/:id", isAuthenticated, async (req, res) => {
    try {
      console.log("Delete horse by ID request received");
      
      // Get the horse ID from the request params
      const horseId = parseInt(req.params.id);
      console.log(`Attempting to delete horse with ID: ${horseId}`);
      
      // Get user to verify they are a seller
      const userId = req.session.userId;
      console.log("Current user ID:", userId);
      
      const user = await storage.getUserById(userId);
      console.log("User found:", user ? "Yes" : "No", user ? `(is_selling: ${user.is_selling})` : "");
      
      if (!user || !user.is_selling) {
        console.log("User doesn't have seller permissions");
        return res.status(403).json({ message: "Only sellers can perform this action" });
      }
      
      // Get the horse to delete
      const horse = await storage.getHorseById(horseId);
      
      if (!horse) {
        console.log(`Horse with ID ${horseId} not found`);
        return res.status(404).json({ message: "Horse not found" });
      }
      
      console.log(`Found horse with ID ${horseId}: ${JSON.stringify({
        id: horse.id,
        name: horse.name,
        owner_id: horse.owner_id
      })}`);
      
      // Delete the horse
      const success = await storage.deleteHorse(horseId);
      
      if (success) {
        console.log(`Successfully deleted horse with ID ${horseId}`);
        return res.status(200).json({ 
          message: `Successfully deleted horse ${horse.name}`, 
          deletedHorse: {
            id: horse.id,
            name: horse.name
          }
        });
      } else {
        console.log(`Failed to delete horse with ID ${horseId}`);
        return res.status(500).json({ message: "Failed to delete horse" });
      }
    } catch (error) {
      console.error("Delete horse by ID error:", error);
      return res.status(500).json({ message: "Failed to delete horse" });
    }
  });
  
  // Reset database but keep specific user's horses
  app.delete("/api/admin/reset-database", isAuthenticated, async (req, res) => {
    try {
      console.log("Reset database request received");
      
      // Get user to verify they are a seller
      const userId = req.session.userId;
      console.log("Current user ID:", userId);
      
      const user = await storage.getUserById(userId);
      console.log("User found:", user ? "Yes" : "No", user ? `(is_selling: ${user.is_selling})` : "");
      
      if (!user || !user.is_selling) {
        console.log("User doesn't have seller permissions");
        return res.status(403).json({ message: "Only sellers can perform this action" });
      }
      
      // Special direct method for MemStorage
      if (storage instanceof MemStorage) {
        console.log("Using direct MemStorage reset method");
        
        try {
          // Get all horses
          const allHorses = await storage.getHorses();
          console.log(`Found ${allHorses.length} total horses in database`);
          
          // Filter for user's horses (id 3)
          const userHorses = allHorses.filter(h => h.owner_id === 3);
          console.log(`Found ${userHorses.length} horses owned by user ID 3: ${JSON.stringify(userHorses.map(h => ({ id: h.id, name: h.name })))}`);
          
          // Count problematic horses
          const problematicHorses = allHorses.filter(h => h.owner_id === 1);
          const problematicHorseNames = problematicHorses.map(h => h.name);
          console.log(`Found ${problematicHorses.length} problematic horses: ${problematicHorseNames.join(", ")}`);
          
          // Create a completely new horses Map
          const newHorsesMap = new Map();
          
          // Re-add only user's horses
          let preservedCount = 0;
          for (const horse of userHorses) {
            newHorsesMap.set(horse.id, horse);
            preservedCount++;
            console.log(`Preserved horse: ${horse.name} (ID: ${horse.id})`);
          }
          
          // Get direct access to the internal map
          const oldMap = (storage as MemStorage).getInternalHorsesMap();
          if (!oldMap) {
            console.error("Could not access internal horses map");
            return res.status(500).json({ message: "Failed to access storage" });
          }
          
          const oldSize = oldMap.size;
          console.log(`Old map size: ${oldSize}`);
          
          // Clear the old map
          console.log("Clearing old map...");
          oldMap.clear();
          console.log(`Map size after clear: ${oldMap.size}`);
          
          // Add all preserved horses back
          console.log("Re-adding preserved horses...");
          for (const horse of userHorses) {
            oldMap.set(horse.id, horse);
            console.log(`Re-added horse: ${horse.name} (ID: ${horse.id})`);
          }
          
          // Verify the operation
          console.log(`Map size after re-adding: ${oldMap.size}`);
          
          // Double check that only horses with owner_id 3 remain
          const allHorsesAfterReset = await storage.getHorses();
          console.log(`Horses after reset: ${JSON.stringify(allHorsesAfterReset.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id })))}`);
          
          // Verify no problematic horses remain
          const problematicHorsesAfterReset = allHorsesAfterReset.filter(h => h.owner_id === 1);
          if (problematicHorsesAfterReset.length > 0) {
            console.error(`ERROR: Still found ${problematicHorsesAfterReset.length} problematic horses after reset!`);
          } else {
            console.log(`SUCCESS: No problematic horses remain after reset.`);
          }
          
          console.log(`Database reset complete. Removed ${oldSize - preservedCount} horses, preserved ${preservedCount} horses.`);
          
          return res.status(200).json({
            success: true,
            message: `Database reset successful. Removed all problematic horses (${problematicHorseNames.join(", ")}) and preserved your horses.`,
            removedCount: oldSize - preservedCount,
            preservedCount,
            removedHorses: problematicHorseNames
          });
        } catch (innerError) {
          console.error("Error during map operations:", innerError);
          return res.status(500).json({ 
            success: false,
            message: "Failed during database reset operation",
            error: innerError.toString()
          });
        }
      } else {
        // For other storage types (should implement similar functionality)
        return res.status(501).json({ 
          success: false,
          message: "Reset functionality not implemented for this storage type" 
        });
      }
    } catch (error) {
      console.error("Reset database error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to reset database", 
        error: error.toString() 
      });
    }
  });
  
  // Completely clear the database and start fresh
  app.post("/api/admin/clean-database", isAuthenticated, async (req, res) => {
    try {
      console.log("Clean database request received - COMPLETE RESET");
      
      // Get user to verify they are a seller
      const userId = req.session.userId;
      console.log("Current user ID:", userId);
      
      const user = await storage.getUserById(userId);
      console.log("User found:", user ? "Yes" : "No", user ? `(is_selling: ${user.is_selling})` : "");
      
      if (!user || !user.is_selling) {
        console.log("User doesn't have seller permissions");
        return res.status(403).json({ message: "Only sellers can perform this action" });
      }
      
      // Use our enhanced storage reset functionality
      try {
        // Get all horses first for logging
        const allHorses = await storage.getHorses();
        console.log(`Found ${allHorses.length} total horses in database to delete`);
        
        // Document all horses before clearing
        const allHorsesSummary = allHorses.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id }));
        console.log(`Horses before clearing: ${JSON.stringify(allHorsesSummary)}`);
        
        // Use the reset function from storage.ts
        const success = resetStorageToEmpty();
        
        if (!success) {
          return res.status(501).json({ 
            success: false,
            message: "Clean database functionality not implemented for this storage type" 
          });
        }
        
        console.log("CLEARING ENTIRE DATABASE...");
        
        // Verify the operation
        const allHorsesAfterClear = await storage.getHorses();
        console.log(`Horses after clear: ${JSON.stringify(allHorsesAfterClear.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id })))}`);
        
        if (allHorsesAfterClear.length === 0) {
          console.log("SUCCESS: Database completely cleared");
          
          return res.status(200).json({
            success: true,
            message: `Database completely cleared. Removed all ${allHorses.length} horses.`,
            removedCount: allHorses.length
          });
        } else {
          console.error(`ERROR: Database still contains ${allHorsesAfterClear.length} horses after clear!`);
          return res.status(500).json({
            success: false,
            message: `Failed to completely clear database. ${allHorsesAfterClear.length} horses still remain.`
          });
        }
      } catch (innerError) {
        console.error("Error during database clear:", innerError);
        return res.status(500).json({ 
          success: false,
          message: "Failed during database clear operation",
          error: innerError.toString()
        });
      }
    } catch (error) {
      console.error("Clean database error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to clean database", 
        error: error.toString() 
      });
    }
  });
  
  // Completely rebuild the database from scratch
  app.post("/api/admin/rebuild-database", isAuthenticated, async (req, res) => {
    try {
      console.log("Rebuild database request received");
      
      // Get user to verify they are a seller
      const userId = req.session.userId;
      console.log("Current user ID:", userId);
      
      const user = await storage.getUserById(userId);
      console.log("User found:", user ? "Yes" : "No", user ? `(is_selling: ${user.is_selling})` : "");
      
      if (!user || !user.is_selling) {
        console.log("User doesn't have seller permissions");
        return res.status(403).json({ message: "Only sellers can perform this action" });
      }
      
      // Special direct method for MemStorage
      if (storage instanceof MemStorage) {
        console.log("Using direct MemStorage rebuild method");
        
        try {
          // Get all horses
          const allHorses = await storage.getHorses();
          console.log(`Found ${allHorses.length} total horses in database`);
          
          // Filter for the current user's horses ONLY
          const userHorses = allHorses.filter(h => h.owner_id === userId);
          console.log(`Found ${userHorses.length} horses owned by user ID ${userId}: ${JSON.stringify(userHorses.map(h => ({ id: h.id, name: h.name })))}`);
          
          // Get direct access to the internal map
          const horsesMap = (storage as MemStorage).getInternalHorsesMap();
          if (!horsesMap) {
            console.error("Could not access internal horses map");
            return res.status(500).json({ message: "Failed to access storage" });
          }
          
          // Save the original size
          const originalSize = horsesMap.size;
          console.log(`Original database size: ${originalSize} horses`);
          
          // Document all horses before clearing
          const allHorsesBeforeReset = Array.from(horsesMap.values());
          const allHorsesSummary = allHorsesBeforeReset.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id }));
          console.log(`Horses before rebuild: ${JSON.stringify(allHorsesSummary)}`);
          
          // Problematic horses summary
          const problematicHorses = allHorsesBeforeReset.filter(h => h.owner_id === 1);
          console.log(`Found ${problematicHorses.length} problematic horses owned by user 1`);
          
          // Clear the entire map - FULL RESET
          console.log("CLEARING ENTIRE DATABASE...");
          horsesMap.clear();
          console.log(`Database size after clear: ${horsesMap.size}`);
          
          // ONLY Add back the current user's horses
          let restoredCount = 0;
          for (const horse of userHorses) {
            horsesMap.set(horse.id, horse);
            restoredCount++;
            console.log(`Restored horse: ${horse.name} (ID: ${horse.id}, Owner: ${horse.owner_id})`);
          }
          
          // Verify the operation
          console.log(`Final database size after rebuild: ${horsesMap.size}`);
          
          // Double check what horses remain in the database
          const allHorsesAfterRebuild = await storage.getHorses();
          console.log(`Horses after rebuild: ${JSON.stringify(allHorsesAfterRebuild.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id })))}`);
          
          // Verify no other horses remain (especially problematic ones)
          const remainingHorsesNotOwnedByUser = allHorsesAfterRebuild.filter(h => h.owner_id !== userId);
          if (remainingHorsesNotOwnedByUser.length > 0) {
            console.error(`ERROR: Found ${remainingHorsesNotOwnedByUser.length} horses not owned by user ${userId} after rebuild!`);
          } else {
            console.log(`SUCCESS: Only horses owned by user ${userId} remain in the database.`);
          }
          
          console.log(`Database rebuild complete. Removed ${originalSize - restoredCount} horses, preserved ${restoredCount} horses.`);
          
          return res.status(200).json({
            success: true,
            message: `Database successfully rebuilt from scratch with only your horses.`,
            removedCount: originalSize - restoredCount,
            preservedCount: restoredCount
          });
        } catch (innerError) {
          console.error("Error during database rebuild:", innerError);
          return res.status(500).json({ 
            success: false,
            message: "Failed during database rebuild operation",
            error: innerError.toString()
          });
        }
      } else {
        // For other storage types (should implement similar functionality)
        return res.status(501).json({ 
          success: false,
          message: "Rebuild functionality not implemented for this storage type" 
        });
      }
    } catch (error) {
      console.error("Rebuild database error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to rebuild database", 
        error: error.toString() 
      });
    }
  });
  
  // Test route to create a sample horse without authentication (for testing persistence only)
  app.post("/api/test/create-sample-horse", async (req, res) => {
    try {
      console.log("Test create sample horse request received");
      console.log("Request body:", req.body);
      
      // Always ensure owner_id is set to 3 (the test owner account)
      const horseData = { 
        ...req.body,
        owner_id: 3  // Force owner_id to be 3
      };
      
      console.log("Creating horse with data:", horseData);
      
      // Create the horse
      const createdHorse = await storage.createHorse(horseData);
      console.log("Created sample horse:", createdHorse);
      
      // If there is an active session, make sure to preserve it
      if (req.session && req.session.userId) {
        req.session.touch();
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session after test horse creation:", err);
          } else {
            console.log("Session successfully saved after test horse creation");
          }
        });
      }
      
      return res.status(201).json({
        message: "Successfully created horse",
        horse: createdHorse
      });
    } catch (error) {
      console.error("Create horse error:", error);
      return res.status(500).json({
        message: "Failed to create horse",
        error: error.toString()
      });
    }
  });
  
  // Add sample horses
  app.post("/api/admin/add-sample-horses", isAuthenticated, async (req, res) => {
    try {
      // Get user to verify they are a seller
      const userId = req.session.userId;
      const user = await storage.getUserById(userId);
      
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only sellers can perform this action" });
      }
      
      // Create sample horses
      const sampleHorses = [
        {
          owner_id: userId,
          name: "Pegasus",
          location_country: "Australia",
          location_radius_km: 0,
          disciplines: ["Jumping"],
          levels: ["Young Rider"],
          breeds: ["Warmblood"],
          age: 8,
          height_hands: 16.2,
          height_cm: 168,
          sex: "Gelding",
          sire: "Cornet Obolensky",
          dam: "Diamant's Girl",
          dam_sire: "Diamant de Semilly",
          characteristics: ["Brave", "Careful"],
          price_min: 30000,
          price_max: 35000,
          currency: "AUD",
          description: "Talented jumper with a great temperament",
          photos: [
            "https://www.australianjumping.com.au/wp-content/uploads/2025/05/images.jpeg",
            "https://www.australianjumping.com.au/wp-content/uploads/2025/05/images-1.jpeg"
          ],
          videos: []
        },
        {
          owner_id: userId,
          name: "Thunder",
          location_country: "Australia",
          location_radius_km: 0,
          disciplines: ["Dressage"],
          levels: ["Elementary"],
          breeds: ["Hanoverian"],
          age: 6,
          height_hands: 17,
          height_cm: 173,
          sex: "Stallion",
          sire: "Totilas",
          dam: "Dancing Queen",
          dam_sire: "De Niro",
          characteristics: ["Expressive", "Powerful"],
          price_min: 40000,
          price_max: 45000,
          currency: "AUD",
          description: "Impressive young dressage prospect with three excellent gaits",
          photos: [
            "https://www.australianjumping.com.au/wp-content/uploads/2025/05/images.jpeg",
            "https://www.australianjumping.com.au/wp-content/uploads/2025/05/images-1.jpeg"
          ],
          videos: []
        }
      ];
      
      // Add horses to the database
      const createdHorses = [];
      for (const horse of sampleHorses) {
        const createdHorse = await storage.createHorse(horse);
        createdHorses.push(createdHorse);
      }
      
      return res.status(201).json({ 
        message: `Successfully added ${createdHorses.length} sample horses`,
        horses: createdHorses
      });
    } catch (error) {
      console.error("Add sample horses error:", error);
      return res.status(500).json({ message: "Failed to add sample horses", error: error.toString() });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verify user can only update their own account
      const sessionUserId = typeof req.session.userId === 'string' ? 
        parseInt(req.session.userId) : req.session.userId;
        
      if (userId !== sessionUserId) {
        return res.status(403).json({ message: "You can only update your own account" });
      }
      
      const { is_searching, is_selling } = req.body;
      
      // Validate that at least one role is enabled
      if (is_searching === false && is_selling === false) {
        return res.status(400).json({ message: "You must have at least one role enabled" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        is_searching,
        is_selling
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Horse routes
  app.get("/api/horses", async (req, res) => {
    try {
      console.log("GET /api/horses - query params:", req.query);
      
      // Log all query parameters to understand exactly what's being sent
      const allParams = Object.entries(req.query).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join(', ');
      console.log("All query parameters:", allParams);
      
      // Convert query params to filters
      const filters: any = {};
      
      // Only add filter parameters if they have values to avoid filtering by empty values
      if (req.query.disciplines && Array.isArray(req.query.disciplines) ? req.query.disciplines.length > 0 : req.query.disciplines) {
        filters.disciplines = Array.isArray(req.query.disciplines) 
          ? req.query.disciplines 
          : [req.query.disciplines];
      }
      
      if (req.query.levels && Array.isArray(req.query.levels) ? req.query.levels.length > 0 : req.query.levels) {
        filters.levels = Array.isArray(req.query.levels) 
          ? req.query.levels 
          : [req.query.levels];
      }
      
      if (req.query.breeds && Array.isArray(req.query.breeds) ? req.query.breeds.length > 0 : req.query.breeds) {
        filters.breeds = Array.isArray(req.query.breeds) 
          ? req.query.breeds 
          : [req.query.breeds];
      }
      
      if (req.query.sexes && Array.isArray(req.query.sexes) ? req.query.sexes.length > 0 : req.query.sexes) {
        filters.sexes = Array.isArray(req.query.sexes) 
          ? req.query.sexes 
          : [req.query.sexes];
      }
      
      if (req.query.location_country && req.query.location_country !== 'null') {
        filters.location_country = req.query.location_country as string;
      }
      
      // Handle price filters
      if (req.query.min_price && req.query.min_price !== '0' && req.query.min_price !== 'null') {
        filters.price_min = parseInt(req.query.min_price as string);
      }
      
      if (req.query.max_price && req.query.max_price !== '999999999' && req.query.max_price !== 'null') {
        filters.price_max = parseInt(req.query.max_price as string);
      }
      
      // Handle age filters - convert from string directly
      if (req.query.max_age) {
        const maxAge = parseInt(req.query.max_age as string);
        if (!isNaN(maxAge) && maxAge !== 999) {
          filters.age_max = maxAge;
          console.log("Setting age_max filter to:", maxAge);
        }
      }
      
      if (req.query.min_age) {
        const minAge = parseInt(req.query.min_age as string);
        if (!isNaN(minAge) && minAge !== 0) {
          filters.age_min = minAge;
          console.log("Setting age_min filter to:", minAge);
        }
      }
      
      // Handle height filters - convert from string directly
      if (req.query.max_height) {
        const maxHeight = parseFloat(req.query.max_height as string);
        if (!isNaN(maxHeight) && maxHeight !== 999) {
          filters.height_max = maxHeight;
          console.log("Setting height_max filter to:", maxHeight);
        }
      }
      
      if (req.query.min_height) {
        const minHeight = parseFloat(req.query.min_height as string);
        if (!isNaN(minHeight) && minHeight !== 0) {
          filters.height_min = minHeight;
          console.log("Setting height_min filter to:", minHeight);
        }
      }
      
      console.log("GET /api/horses - parsed filters:", filters);
      
      const horses = await storage.getHorsesByFilters(filters);
      console.log(`GET /api/horses - returning ${horses.length} horses`);
      return res.json(horses);
    } catch (error) {
      console.error("Get horses error:", error);
      return res.status(500).json({ message: "Failed to get horses" });
    }
  });
  
  // Get horses by owner ID (for owner's profile)
  app.get("/api/horses/owner", isTokenAuthenticated, async (req, res) => {
    try {
      // Get the user with their roles
      const user = await storage.getUserById(req.userId);
      
      console.log(`GET /api/horses/owner - user:`, user);
      
      // Check if the user has selling permission
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only users with selling permission can access their horses" });
      }
      
      const ownerId = req.userId;
      console.log(`GET /api/horses/owner - searching for owner_id:`, ownerId);
      
      // Get all horses first for debugging
      const allHorses = await storage.getHorses();
      console.log(`GET /api/horses/owner - all horses:`, allHorses.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id })));
      
      const filters = { owner_id: ownerId };
      
      const horses = await storage.getHorsesByFilters(filters);
      console.log(`GET /api/horses/owner - filtered horses:`, horses.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id })));
      
      return res.json(horses);
    } catch (error) {
      console.error("Get owner horses error:", error);
      return res.status(500).json({ message: "Failed to get horses" });
    }
  });

  app.get("/api/horses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const horse = await storage.getHorseById(id);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      return res.json(horse);
    } catch (error) {
      console.error("Get horse error:", error);
      return res.status(500).json({ message: "Failed to get horse" });
    }
  });

  app.post("/api/horses", isAuthenticated, async (req, res) => {
    try {
      // Get the user with their roles
      const user = await storage.getUserById(req.session.userId);
      
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only users with selling permission can create horses" });
      }
      
      const validatedData = insertHorseSchema.parse(req.body);
      
      // Ensure owner_id matches the logged-in owner
      if (validatedData.owner_id !== req.session.userId) {
        return res.status(403).json({ message: "Cannot create horse for another owner" });
      }
      
      const horse = await storage.createHorse(validatedData);
      
      // Force session save to maintain login state
      req.session.touch();
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session after horse creation:", err);
        } else {
          console.log("Session successfully saved after horse creation");
        }
      });
      
      return res.status(201).json(horse);
    } catch (error) {
      console.error("Create horse error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });
  
  // Update a horse
  app.put("/api/horses/:id", isAuthenticated, async (req, res) => {
    try {
      // Get the user with their roles
      const user = await storage.getUserById(req.session.userId);
      
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only users with selling permission can update horses" });
      }
      
      const id = parseInt(req.params.id);
      
      // Get the horse first to check ownership
      const horse = await storage.getHorseById(id);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      // Ensure owner can only update their own horses
      if (horse.owner_id !== req.session.userId) {
        return res.status(403).json({ message: "Cannot update another owner's horse" });
      }
      
      // Log the incoming data for debugging
      console.log("Update horse - request body:", req.body);
      
      // Validate the update data
      const validatedData = {
        ...req.body,
        owner_id: horse.owner_id, // Ensure owner_id cannot be changed
        id: horse.id // Ensure id cannot be changed
      };
      
      // Update the horse using the storage method
      const updatedHorse = await storage.updateHorse(id, validatedData);
      
      if (!updatedHorse) {
        return res.status(500).json({ message: "Failed to update horse" });
      }
      
      console.log("Horse updated successfully:", updatedHorse);
      return res.json(updatedHorse);
    } catch (error) {
      console.error("Update horse error:", error);
      return res.status(400).json({ message: "Failed to update horse" });
    }
  });
  
  // Delete a horse
  app.delete("/api/horses/:id", isAuthenticated, async (req, res) => {
    try {
      // Get the user with their roles
      const user = await storage.getUserById(req.session.userId);
      
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only users with selling permission can delete horses" });
      }
      
      const id = parseInt(req.params.id);
      const horse = await storage.getHorseById(id);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      // Ensure owner can only delete their own horses
      if (horse.owner_id !== req.session.userId) {
        return res.status(403).json({ message: "Cannot delete another owner's horse" });
      }
      
      // Delete the horse using the storage method
      const deleted = await storage.deleteHorse(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete horse" });
      }
      
      return res.json({ message: "Horse deleted successfully" });
    } catch (error) {
      console.error("Delete horse error:", error);
      return res.status(500).json({ message: "Failed to delete horse" });
    }
  });

  // Match routes
  app.post("/api/matches", isTokenAuthenticated, async (req, res) => {
    try {
      // Get the user
      const user = await storage.getUserById(req.userId);
      
      if (!user) {
        return res.status(403).json({ message: "User not found" });
      }
      
      // Allow any authenticated user to create matches
      // regardless of their user type (selling or searching)
      
      const validatedData = insertMatchSchema.parse(req.body);
      
      // Ensure customer_id matches the logged-in user
      if (validatedData.customer_id !== req.userId) {
        return res.status(403).json({ message: "Cannot create match for another user" });
      }
      
      // Check if a match already exists for this user and horse
      const existingMatches = await storage.getMatchesByCustomerId(req.userId);
      const matchExists = existingMatches.some(match => 
        match.horse_id === validatedData.horse_id
      );
      
      if (matchExists) {
        const existingMatch = existingMatches.find(match => 
          match.horse_id === validatedData.horse_id
        );
        
        // If match exists, update it instead of creating a new one
        const updatedMatch = await storage.updateMatch(existingMatch!.id, { is_liked: validatedData.is_liked });
        return res.status(200).json(updatedMatch);
      }
      
      // Create a new match if none exists
      const match = await storage.createMatch(validatedData);
      return res.status(201).json(match);
    } catch (error) {
      console.error("Create match error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });
  
  // Get user's matches
  app.get("/api/matches", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const matches = await storage.getMatchesByCustomerId(userId);
      return res.json(matches);
    } catch (error) {
      console.error("Get matches error:", error);
      return res.status(500).json({ message: "Failed to fetch matches" });
    }
  });
  
  // Update match (used to toggle like/unlike)
  app.patch("/api/matches/:id", isTokenAuthenticated, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const userId = req.userId;
      
      // Get the match to check ownership
      const match = await storage.getMatchById(matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Ensure user owns this match
      if (match.customer_id !== userId) {
        return res.status(403).json({ message: "Cannot update match that belongs to another user" });
      }
      
      // Update the match with new data
      const updatedMatch = await storage.updateMatch(matchId, req.body);
      return res.json(updatedMatch);
    } catch (error) {
      console.error("Update match error:", error);
      return res.status(500).json({ message: "Failed to update match" });
    }
  });

  app.get("/api/matches/by-role", isAuthenticated, async (req, res) => {
    try {
      let matches;
      
      // Get the user with their roles
      const user = await storage.getUserById(req.session.userId);
      
      if (!user) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      if (user.is_searching) {
        // User is a customer/searcher
        matches = await storage.getMatchesByCustomerId(req.session.userId);
      } else if (user.is_selling) {
        // User is a seller/owner
        const horses = await storage.getHorses();
        const ownerHorses = horses.filter(horse => horse.owner_id === req.session.userId);
        
        matches = [];
        for (const horse of ownerHorses) {
          const horseMatches = await storage.getMatchesByHorseId(horse.id);
          matches.push(...horseMatches);
        }
      } else {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      return res.json(matches);
    } catch (error) {
      console.error("Get matches error:", error);
      return res.status(500).json({ message: "Failed to get matches" });
    }
  });




  // Payment routes - Stripe integration
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const { horseId, amount } = req.body;
      
      if (!horseId || !amount) {
        return res.status(400).json({ message: "Horse ID and amount are required" });
      }
      
      // Get the horse to verify it exists and get its details
      const horse = await storage.getHorseById(horseId);
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      // Create a payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: horse.currency.toLowerCase() || "aud",
        metadata: {
          horse_id: horseId.toString(),
          horse_name: horse.name,
          price_min: horse.price_min.toString(),
          price_max: horse.price_max.toString()
        },
      });
      
      // Return the client secret to the client
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Failed to create payment intent",
        error: error.message 
      });
    }
  });
  
  // Stripe subscription endpoint
  app.post("/api/create-subscription", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const { plan } = req.body;
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let customerId = user.stripe_customer_id;
      
      // Create a customer if one doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || user.business_name || "Horse Match Customer"
        });
        
        customerId = customer.id;
        await storage.updateUserSubscription(userId, { stripe_customer_id: customerId });
      }
      
      // Create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Update user subscription info
      await storage.updateUserSubscription(userId, {
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_plan: plan
      });
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ 
        message: "Failed to create subscription", 
        error: error.message 
      });
    }
  });
  
  // Handle beta subscriptions (no payment required)
  app.post("/api/subscription/beta", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { planId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (!planId || !planId.startsWith('beta-')) {
        return res.status(400).json({ message: "Invalid beta plan" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Determine user permissions based on the plan type
      let updatedUserData: any = {
        stripe_subscription_id: `beta-${Date.now()}`, // Create a unique ID for the beta subscription
        subscription_status: 'active',
        subscription_plan: planId,
        subscription_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      };
      
      // Update user roles based on subscription type
      if (planId === 'beta-seller') {
        // Seller plan gets both selling and searching permissions
        await storage.updateUser(userId, {
          is_selling: true,
          is_searching: true
        });
        console.log(`Updated user ${userId} with beta-seller permissions (selling: true, searching: true)`);
      } else if (planId === 'beta-searching') {
        // Searching plan only gets searching permissions
        await storage.updateUser(userId, {
          is_selling: false,
          is_searching: true
        });
        console.log(`Updated user ${userId} with beta-searching permissions (selling: false, searching: true)`);
      }
      
      // Update user with beta subscription info
      await storage.updateUserSubscription(userId, updatedUserData);
      
      res.json({
        success: true,
        message: "Beta subscription activated",
        planId: planId
      });
    } catch (error: any) {
      console.error("Error creating beta subscription:", error);
      res.status(500).json({ 
        message: "Failed to activate beta subscription", 
        error: error.message 
      });
    }
  });
  
  // Get subscription status
  app.get("/api/subscription", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      console.log(`GET /api/subscription - userId: ${userId}`);
      
      if (!userId) {
        console.log("GET /api/subscription - No userId in session");
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const user = await storage.getUserById(userId);
      console.log(`GET /api/subscription - user found:`, user ? {
        id: user.id,
        email: user.email,
        stripe_subscription_id: user.stripe_subscription_id,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        subscription_end_date: user.subscription_end_date
      } : 'null');
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.stripe_subscription_id) {
        console.log("GET /api/subscription - No subscription found for user");
        return res.json({ hasSubscription: false });
      }
      
      // For beta subscriptions or when Stripe is not available, use local data
      const isBetaSubscription = user.stripe_subscription_id.startsWith('beta-');
      
      if (isBetaSubscription || !stripe) {
        console.log(`Using local subscription data for user ${userId} with ${isBetaSubscription ? 'beta subscription' : 'no Stripe config'}`);
        
        // Return subscription info from local user data
        return res.json({
          hasSubscription: true,
          subscriptionId: user.stripe_subscription_id,
          status: user.subscription_status || 'active',
          planId: user.subscription_plan || (isBetaSubscription ? 'beta-seller' : 'standard'),
          currentPeriodEnd: user.subscription_end_date ? Math.floor(new Date(user.subscription_end_date).getTime() / 1000) : Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000),
        });
      }
      
      try {
        // Try to get the latest subscription status from Stripe
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        
        // Update local subscription status
        await storage.updateUserSubscription(userId, {
          subscription_status: subscription.status,
          subscription_end_date: new Date(subscription.current_period_end * 1000)
        });
        
        return res.json({
          hasSubscription: true,
          subscriptionId: user.stripe_subscription_id,
          status: subscription.status,
          planId: subscription.items.data[0].price.id,
          currentPeriodEnd: subscription.current_period_end,
        });
      } catch (stripeError) {
        console.error("Stripe API error:", stripeError);
        
        // Fallback to local subscription data if Stripe API fails
        console.log(`Falling back to local subscription data for user ${userId} due to Stripe API error`);
        
        return res.json({
          hasSubscription: true,
          subscriptionId: user.stripe_subscription_id,
          status: user.subscription_status || 'active',
          planId: user.subscription_plan || 'standard',
          currentPeriodEnd: user.subscription_end_date ? Math.floor(new Date(user.subscription_end_date).getTime() / 1000) : Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000),
          stripeError: true
        });
      }
    } catch (error: any) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ 
        message: "Error retrieving subscription information",
        error: error.message
      });
    }
  });
  
  // Cancel subscription
  app.post("/api/cancel-subscription", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user || !user.stripe_subscription_id) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      // Cancel the subscription at period end
      const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
        cancel_at_period_end: true
      });
      
      // Update user subscription status
      await storage.updateUserSubscription(userId, {
        subscription_status: subscription.status
      });
      
      res.json({
        success: true,
        message: "Subscription will be canceled at the end of the billing period",
        currentPeriodEnd: subscription.current_period_end
      });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ 
        message: "Error canceling subscription",
        error: error.message 
      });
    }
  });

  // Utility routes - for the app constants
  app.get("/api/constants", (req, res) => {
    try {
      // Use the constants imported at the top of the file
      return res.json({
        disciplines,
        sexes,
        colours,
        breeds,
        characteristics,
        countries,
        levels: {
          Jumping: jumpingLevels,
          Dressage: dressageLevels,
          Eventing: eventingLevels
        }
      });
    } catch (error) {
      console.error("Get constants error:", error);
      return res.status(500).json({ message: "Failed to get constants" });
    }
  });
  
  // File upload endpoint
  app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Get file path relative to public directory
      const relativePath = req.file.path.replace(/^.*[\\\/]public/, '');
      const fileUrl = relativePath;
      
      res.json({ 
        url: fileUrl,
        fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'video'
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ error: "File upload failed" });
    }
  });
  
  // Admin endpoint to delete all horses
  app.delete("/api/admin/horses", isAuthenticated, async (req, res) => {
    try {
      // Only allow for logged-in sellers
      const user = await storage.getUserById(req.session.userId);
      
      console.log(`DELETE /api/admin/horses - Requested by user:`, user);
      
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only users with selling permission can perform this operation" });
      }
      
      // Get all horses first
      const allHorses = await storage.getHorses();
      console.log(`DELETE /api/admin/horses - Found ${allHorses.length} horses to delete`);
      
      // Keep track of deleted horses
      const deletedHorses = [];
      
      // Delete each horse
      for (const horse of allHorses) {
        console.log(`DELETE /api/admin/horses - Deleting horse ${horse.id} (${horse.name})`);
        const success = await storage.deleteHorse(horse.id);
        if (success) {
          deletedHorses.push({ id: horse.id, name: horse.name });
        } else {
          console.error(`DELETE /api/admin/horses - Failed to delete horse ${horse.id}`);
        }
      }
      
      // Verify the deletion by getting horses again
      const horsesAfter = await storage.getHorses();
      
      return res.json({ 
        message: `Successfully deleted ${deletedHorses.length} horses`,
        deletedHorses,
        remainingHorses: horsesAfter.length
      });
    } catch (error) {
      console.error("Delete horses error:", error);
      return res.status(500).json({ message: "Failed to delete horses" });
    }
  });
  
  // Temporary admin endpoint to reassign horses to current user
  app.post("/api/admin/reassign-horses", isAuthenticated, async (req, res) => {
    try {
      // Only allow for logged-in sellers
      const user = await storage.getUserById(req.session.userId);
      
      console.log(`POST /api/admin/reassign-horses - user:`, user);
      
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only users with selling permission can reassign horses" });
      }
      
      // Get source owner ID from request body or default to 1 (the original owner)
      const sourceOwnerId = req.body.sourceOwnerId || 1;
      const targetUserId = req.session.userId;
      
      console.log(`POST /api/admin/reassign-horses - transferring from owner ${sourceOwnerId} to ${targetUserId}`);
      
      // Get all horses first
      const allHorses = await storage.getHorses();
      console.log(`POST /api/admin/reassign-horses - all horses before reassignment:`, 
        allHorses.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id })));
      
      // Find horses from the source owner
      const horsesToTransfer = allHorses.filter(h => h.owner_id === sourceOwnerId);
      console.log(`POST /api/admin/reassign-horses - found ${horsesToTransfer.length} horses to transfer from owner ${sourceOwnerId}`);
      
      if (horsesToTransfer.length === 0) {
        return res.status(404).json({ 
          message: `No horses found for owner ${sourceOwnerId}`,
          allHorses: allHorses.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id }))
        });
      }
      
      // Update each horse to be owned by the current user
      const updatedHorses = [];
      for (const horse of horsesToTransfer) {
        console.log(`POST /api/admin/reassign-horses - updating horse ${horse.id} (${horse.name}) from owner ${horse.owner_id} to ${targetUserId}`);
        const updatedHorse = await storage.updateHorse(horse.id, { owner_id: targetUserId });
        if (updatedHorse) {
          updatedHorses.push(updatedHorse);
          console.log(`POST /api/admin/reassign-horses - horse ${horse.id} updated successfully, new owner_id: ${updatedHorse.owner_id}`);
        } else {
          console.error(`POST /api/admin/reassign-horses - failed to update horse ${horse.id}`);
        }
      }
      
      // Verify the transfer by getting horses again
      const horsesAfter = await storage.getHorses();
      console.log(`POST /api/admin/reassign-horses - all horses after reassignment:`, 
        horsesAfter.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id })));
      
      // Check the user's horses specifically
      const userHorsesAfter = horsesAfter.filter(h => h.owner_id === targetUserId);
      console.log(`POST /api/admin/reassign-horses - user ${targetUserId} now has ${userHorsesAfter.length} horses`);
      
      return res.json({ 
        message: `Successfully reassigned ${updatedHorses.length} horses from user ${sourceOwnerId} to user ${targetUserId}`,
        horses: updatedHorses.map(h => ({ id: h.id, name: h.name })),
        userHorses: userHorsesAfter.map(h => ({ id: h.id, name: h.name }))
      });
    } catch (error) {
      console.error("Reassign horses error:", error);
      return res.status(500).json({ message: "Failed to reassign horses" });
    }
  });

  // Subscription API endpoints
  app.post('/api/subscription', isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Missing required field: planId" });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Price IDs for each plan
      const prices = {
        basic: 'price_basic', // Replace with actual Stripe price IDs
        pro: 'price_pro',
        premium: 'price_premium'
      };
      
      // For testing without real price IDs
      const priceAmounts = {
        basic: 1999, // $19.99
        pro: 4999,   // $49.99
        premium: 9999 // $99.99
      };
      
      // Create or retrieve a customer
      let customerId = user.stripe_customer_id;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || user.business_name || "Customer",
          metadata: {
            userId: user.id.toString()
          }
        });
        
        customerId = customer.id;
        
        // Save the customer ID to the user
        await storage.updateUserSubscription(userId, {
          stripe_customer_id: customerId
        });
      }
      
      // Get the amount based on the plan or use a default
      let amount = 1999; // Default to $19.99 if plan not found
      if (planId === 'basic') {
        amount = 1999; // $19.99
      } else if (planId === 'pro') {
        amount = 4999; // $49.99
      } else if (planId === 'premium') {
        amount = 9999; // $99.99
      }
      
      // Create a subscription
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        customer: customerId,
        setup_future_usage: 'off_session',
        metadata: {
          userId: user.id.toString(),
          planId: planId
        }
      });
      
      // Return the client secret
      res.json({
        clientSecret: paymentIntent.client_secret,
        customerId
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ 
        message: "Error creating subscription",
        error: error.message 
      });
    }
  });
  
  // Handle webhook from Stripe for subscription events
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      let event;
      
      // Verify the webhook signature
      if (endpointSecret) {
        try {
          event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
          console.error(`Webhook signature verification failed:`, err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      } else {
        event = JSON.parse(req.body.toString());
      }
      
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const userId = paymentIntent.metadata.userId;
          const planId = paymentIntent.metadata.planId;
          
          if (userId && planId) {
            // Update user subscription status
            const subscriptionEndDate = new Date();
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
            
            await storage.updateUserSubscription(parseInt(userId), {
              stripe_subscription_id: paymentIntent.id,
              subscription_status: 'active',
              subscription_plan: planId,
              subscription_end_date: subscriptionEndDate
            });
          }
          break;
          
        case 'customer.subscription.updated':
          const subscription = event.data.object;
          // Handle subscription update
          break;
          
        case 'customer.subscription.deleted':
          const cancelledSubscription = event.data.object;
          // Handle subscription cancellation
          const customerIdFromSub = cancelledSubscription.customer;
          
          // Find user with this customer ID
          // This would require a method to get user by stripe customer ID
          // For now, use the metadata
          if (cancelledSubscription.metadata && cancelledSubscription.metadata.userId) {
            await storage.updateUserSubscription(parseInt(cancelledSubscription.metadata.userId), {
              subscription_status: 'cancelled'
            });
          }
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.send({ received: true });
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ 
        message: "Error handling webhook",
        error: error.message 
      });
    }
  });
  
  // Cancel a subscription
  app.delete('/api/subscription', isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const userId = req.session.userId;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.stripe_subscription_id) {
        return res.status(400).json({ message: "No active subscription found" });
      }
      
      // Cancel the subscription at the end of the current period
      await stripe.subscriptions.update(user.stripe_subscription_id, {
        cancel_at_period_end: true
      });
      
      // Update user record
      await storage.updateUserSubscription(userId, {
        subscription_status: 'cancelling'
      });
      
      res.json({ success: true, message: "Subscription will be cancelled at the end of the current billing period" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ 
        message: "Error cancelling subscription",
        error: error.message 
      });
    }
  });
  
  // Create a one-time donation payment
  app.post('/api/create-donation', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const { amount, currency = 'usd' } = req.body;
      
      if (!amount || amount < 1) {
        return res.status(400).json({ message: "Invalid donation amount" });
      }
      
      // Create a payment intent specifically for donations
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        description: 'Donation to Pro Horse Match',
        metadata: {
          type: 'donation',
          // Add user ID if authenticated
          ...(req.session && req.session.userId ? { userId: req.session.userId.toString() } : {})
        },
        // Enable automatic payment methods for a smoother checkout experience
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      console.log(`Donation payment intent created: ${paymentIntent.id} for amount ${amount}`);
      
      // Return the client secret which is needed for the frontend to complete the payment
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: amount
      });
    } catch (error) {
      console.error("Error creating donation payment:", error);
      res.status(500).json({ 
        message: "Error creating donation payment",
        error: error.message 
      });
    }
  });

  // Update customer preferences
  app.patch("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      
      // Verify user can only update their own profile
      if (customerId !== req.session.userId) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      // Get the user to verify they exist and have searching permissions
      const user = await storage.getUserById(customerId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.is_searching) {
        return res.status(403).json({ message: "Only users with searching permission can update preferences" });
      }
      
      console.log("PATCH /api/customers/:id - request body:", req.body);
      
      // Update the customer using the storage method
      const updatedCustomer = await storage.updateCustomer(customerId, req.body);
      
      console.log("Customer preferences updated successfully:", updatedCustomer);
      return res.json(updatedCustomer);
    } catch (error) {
      console.error("Update customer preferences error:", error);
      return res.status(400).json({ message: error.message || "Failed to update preferences" });
    }
  });

  // Upload image to Cloudinary
  app.post('/api/upload-image', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, 'horses');
      
      res.json({
        url: result.secure_url,
        public_id: result.public_id
      });
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      res.status(500).json({ 
        message: "Error uploading image",
        error: error.message 
      });
    }
  });

  // Delete image from Cloudinary
  app.delete('/api/delete-image/:public_id', isAuthenticated, async (req, res) => {
    try {
      const { public_id } = req.params;
      
      if (!public_id) {
        return res.status(400).json({ message: "No public_id provided" });
      }

      // Delete from Cloudinary
      const result = await deleteFromCloudinary(public_id);
      
      res.json({
        success: true,
        result: result
      });
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
      res.status(500).json({ 
        message: "Error deleting image",
        error: error.message 
      });
    }
  });

  // Delete Conversation Endpoint
  app.delete("/api/conversations/:id", isTokenAuthenticated, async (req: any, res: Response) => {
    console.log("🗑️ DELETE CONVERSATION ENDPOINT HIT - conversationId:", req.params.id);
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.userId;
      
      console.log("DELETE CONVERSATION: userId:", userId, "conversationId:", conversationId);

      // Verify user has access to this conversation
      const conversation = await storage.getConversationById(conversationId);
      console.log("DELETE CONVERSATION: Found conversation:", conversation);
      
      if (!conversation || (conversation.customer_id !== userId && conversation.owner_id !== userId)) {
        console.log("DELETE CONVERSATION: Access denied");
        return res.status(403).json({ message: "Access denied" });
      }

      // Delete the conversation (this will also delete associated messages)
      const deleted = await storage.deleteConversation(conversationId);
      console.log("DELETE CONVERSATION: Deletion result:", deleted);

      if (deleted) {
        console.log("DELETE CONVERSATION: Success!");
        res.json({ success: true });
      } else {
        console.log("DELETE CONVERSATION: Not found");
        res.status(404).json({ message: "Conversation not found" });
      }
    } catch (error) {
      console.error("DELETE CONVERSATION ERROR:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // =============================================================================
  // MESSAGING ROUTES - Added carefully to avoid breaking existing functionality
  // =============================================================================

  // Get all conversations for the current user
  app.get("/api/conversations", isTokenAuthenticated, async (req: any, res: Response) => {
    console.log(`🔥🔥🔥 CONVERSATIONS ENDPOINT HIT - DEBUG MODE ACTIVATED 🔥🔥🔥`);
    try {
      console.log(`🔥 CONVERSATIONS ROUTE START: Request received for user session`);
      
      // Disable caching to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      const userId = req.userId;
      console.log(`CONVERSATIONS ROUTE: Session userId: ${userId}`);
      
      const user = await storage.getUserById(userId);
      console.log(`CONVERSATIONS ROUTE: User lookup result:`, user);
      
      if (!user) {
        console.log(`CONVERSATIONS ROUTE: User not found for userId ${userId}`);
        return res.status(401).json({ message: "User not found" });
      }

      // Get conversations where user is either customer or owner
      console.log(`CONVERSATIONS ROUTE: Fetching conversations for user ${userId}`);
      
      // Test database connection first
      try {
        const allConversationsTest = await storage.getConversations();
        console.log(`CONVERSATIONS ROUTE: Total conversations in DB: ${allConversationsTest.length}`);
      } catch (error) {
        console.error(`CONVERSATIONS ROUTE: Error getting all conversations:`, error);
      }
      
      let customerConversations = [];
      let ownerConversations = [];
      
      try {
        console.log(`CONVERSATIONS ROUTE: About to call getConversationsByCustomerId(${userId})`);
        customerConversations = await storage.getConversationsByCustomerId(userId);
        console.log(`CONVERSATIONS ROUTE: Customer conversations result:`, customerConversations);
      } catch (error) {
        console.error(`CONVERSATIONS ROUTE: Error getting customer conversations:`, error);
      }
      
      try {
        console.log(`CONVERSATIONS ROUTE: About to call getConversationsByOwnerId(${userId})`);
        ownerConversations = await storage.getConversationsByOwnerId(userId);
        console.log(`CONVERSATIONS ROUTE: Owner conversations result:`, ownerConversations);
      } catch (error) {
        console.error(`CONVERSATIONS ROUTE: Error getting owner conversations:`, error);
      }
      
      // Combine and deduplicate conversations
      const allConversations = [...customerConversations, ...ownerConversations];
      const uniqueConversations = allConversations.filter((conv, index, self) => 
        index === self.findIndex((c) => c.id === conv.id)
      );
      
      console.log(`Final conversations for user ${userId}:`, uniqueConversations);
      const conversations = uniqueConversations;

      // Enhance conversations with horse details
      const conversationsWithHorses = await Promise.all(
        conversations.map(async (conversation) => {
          const horse = await storage.getHorseById(conversation.horse_id);
          return {
            ...conversation,
            horse
          };
        })
      );

      res.json(conversationsWithHorses);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ 
        message: "Failed to fetch conversations",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get messages for a specific conversation
  app.get("/api/conversations/:customerId/:ownerId/:horseId/messages", isTokenAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
      const customerId = parseInt(req.params.customerId);
      const ownerId = parseInt(req.params.ownerId);
      const horseId = parseInt(req.params.horseId);

      // Verify user has access to this conversation
      if (userId !== customerId && userId !== ownerId) {
        return res.status(403).json({ message: "Access denied to this conversation" });
      }

      const messages = await storage.getMessagesByConversationId(customerId, ownerId, horseId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ 
        message: "Failed to fetch messages",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Send a new message
  app.post("/api/messages", isTokenAuthenticated, async (req: any, res: Response) => {
    console.log("=== MESSAGE ENDPOINT HIT ===");
    try {
      const userId = req.session.userId;
      console.log("POST /api/messages - Request body:", req.body);
      const { customer_id, owner_id, horse_id, content } = req.body;

      // Validate required fields
      if (!customer_id || !owner_id || !horse_id || !content?.trim()) {
        console.log("Missing fields - customer_id:", customer_id, "owner_id:", owner_id, "horse_id:", horse_id, "content:", content);
        return res.status(400).json({ 
          message: "Missing required fields: customer_id, owner_id, horse_id and content are required" 
        });
      }

      // Verify user has permission to send this message
      if (userId !== parseInt(customer_id) && userId !== parseInt(owner_id)) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Determine sender type
      const sender_type = userId === parseInt(customer_id) ? "customer" : "owner";

      const messageData = {
        customer_id: parseInt(customer_id),
        owner_id: parseInt(owner_id),
        horse_id: parseInt(horse_id),
        content: content.trim(),
        sender_type
      };

      console.log("Creating message with data:", messageData);

      // Create the message
      const newMessage = await storage.createMessage(messageData);

      // Find or create conversation
      let conversation = await storage.getConversationsByCustomerId(parseInt(customer_id))
        .then(conversations => conversations.find(c => 
          c.owner_id === parseInt(owner_id) && c.horse_id === parseInt(horse_id)
        ));

      if (!conversation) {
        console.log("Creating new conversation");
        conversation = await storage.createConversation({
          customer_id: parseInt(customer_id),
          owner_id: parseInt(owner_id),
          horse_id: parseInt(horse_id)
        });
      }

      // Update conversation last message time and increment unread count
      const currentUnreadCount = conversation.unread_count || 0;
      await storage.updateConversation(conversation.id, {
        last_message_time: new Date(),
        last_message_id: newMessage.id,
        unread_count: currentUnreadCount + 1
      });

      console.log("Message created successfully:", newMessage.id);
      res.json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ 
        message: "Failed to send message. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create or get conversation endpoint
  app.post("/api/conversations", isTokenAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
      const { customer_id, owner_id, horse_id } = req.body;

      console.log("Creating conversation with:", { customer_id, owner_id, horse_id, userId });

      // Validate required fields
      if (!customer_id || !owner_id || !horse_id) {
        return res.status(400).json({ 
          message: "Missing required fields: customer_id, owner_id, and horse_id are required" 
        });
      }

      // Check if conversation already exists
      const existingConversations = await storage.getConversations();
      const existingConversation = existingConversations.find(conv => 
        conv.customer_id === customer_id && 
        conv.owner_id === owner_id && 
        conv.horse_id === horse_id
      );

      if (existingConversation) {
        console.log("Found existing conversation:", existingConversation.id);
        return res.json(existingConversation);
      }

      // Create new conversation
      const newConversation = await storage.createConversation({
        customer_id,
        owner_id,
        horse_id,
      });

      console.log("Created new conversation:", newConversation.id);
      res.json(newConversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Mark conversation as read (reset unread count)
  app.patch("/api/conversations/:conversationId/read", isTokenAuthenticated, async (req: any, res: Response) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const userId = req.session.userId;

      // Get the conversation to verify ownership
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Verify user has access to this conversation
      if (userId !== conversation.customer_id && userId !== conversation.owner_id) {
        return res.status(403).json({ message: "Access denied to this conversation" });
      }

      // Reset unread count when user views conversation
      const updatedConversation = await storage.updateConversation(conversationId, { unread_count: 0 });
      res.json(updatedConversation);
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      res.status(500).json({ 
        message: "Failed to mark conversation as read",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Mark messages as read
  app.patch("/api/messages/:messageId/read", isTokenAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
      const messageId = parseInt(req.params.messageId);

      const message = await storage.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Verify user has access to this message
      if (userId !== message.customer_id && userId !== message.owner_id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedMessage = await storage.updateMessage(messageId, { is_read: true });
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ 
        message: "Failed to mark message as read",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get unread message count
  app.get("/api/messages/unread", isTokenAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Get all messages for this user and count unread ones
      const allMessages = await storage.getMessages();
      const userMessages = allMessages.filter(msg => 
        (msg.customer_id === userId || msg.owner_id === userId) && 
        !msg.is_read &&
        msg.sender_type !== (user.is_selling ? "owner" : "customer") // Don't count own messages
      );

      res.json({ count: userMessages.length });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ 
        message: "Failed to get unread count",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
