import type { Express, Response, Request } from "express";
import { createServer, type Server } from "http";
import { storage, MemStorage, resetStorageToEmpty } from "./storage";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertHorseSchema, 
  insertUserSchema,
  insertSellingUserSchema, 
  insertSearchingUserSchema, 
  insertMatchSchema, 
  insertMessageSchema,
  disciplines,
  sexes,
  breeds,
  characteristics,
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
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";

// Extend Express Session
declare module "express-session" {
  interface SessionData {
    userId?: number;
    userType?: string;
  }
}

const SessionStore = MemoryStore(session);

// Configure multer storage
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    // Make sure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Configure upload middleware
const upload = multer({
  storage: storage_config,
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
  // Configure session middleware
  const isProduction = process.env.NODE_ENV === "production";
  
  // Serve static files from the uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  
  app.use(
    session({
      cookie: { 
        maxAge: 86400000, // 24 hours
        secure: isProduction, // Only use secure in production
        httpOnly: true,
        sameSite: isProduction ? 'strict' : 'lax'
      }, 
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "proHorseMatchSecret",
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
      console.log("Login attempt:", req.body);
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
      
      // Save session explicitly
      await new Promise<void>((resolve) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
          } else {
            console.log("Session saved successfully");
          }
          resolve();
        });
      });
      
      return res.json({ 
        id: user.id,
        name: user.name,
        business_name: user.business_name,
        contact_name: user.contact_name,
        email: user.email,
        is_searching: user.is_searching,
        is_selling: user.is_selling
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
      return res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    console.log("Auth check - Session:", {
      sessionId: req.sessionID,
      userId: req.session.userId,
      sessionContent: req.session
    });
    
    if (!req.session.userId) {
      console.log("Auth check failed - Not authenticated");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      console.log(`Auth check - Looking up user with ID ${req.session.userId}`);
      const user = await storage.getUserById(req.session.userId);
      
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
  
  // Middleware to check if a user is authenticated
  const isAuthenticated = (req: any, res: Response, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
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
      
      // Create a sample horse
      const sampleHorse = {
        owner_id: 3, // Hardcoded to the owner user created during initialization
        name: "Maestro",
        location_country: "Australia",
        location_radius_km: 0,
        disciplines: ["Jumping", "Dressage"],
        levels: ["1.30m", "Medium"],
        breeds: ["Dutch Warmblood"],
        age: 8,
        height_hands: 16.2,
        height_cm: 168,
        sex: "Gelding",
        sire: "Jazz",
        dam: "Mariposa",
        dam_sire: "Ferro",
        characteristics: ["Talented", "Gentle"],
        price: 45000,
        currency: "AUD",
        description: "Talented gelding with excellent temperament and scope. Perfect for ambitious amateur or young rider.",
        photos: [
          "https://images.unsplash.com/photo-1598974357809-112ca5eaa0b2?q=80&w=2574",
          "https://images.unsplash.com/photo-1551884831-bbf3cdc6469e?q=80&w=2574"
        ],
        videos: []
      };
      
      // Create the horse
      const createdHorse = await storage.createHorse(sampleHorse);
      console.log("Created sample horse:", createdHorse);
      
      return res.status(201).json({
        message: "Successfully created sample horse for persistence testing",
        horse: createdHorse
      });
    } catch (error) {
      console.error("Create sample horse error:", error);
      return res.status(500).json({
        message: "Failed to create sample horse",
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
          price: 35000,
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
          price: 45000,
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
      
      // Convert query params to filters
      const filters: any = {};
      
      // Only add filter parameters if they have values to avoid filtering by empty values
      if (req.query.disciplines && Array.isArray(req.query.disciplines) ? req.query.disciplines.length > 0 : req.query.disciplines) {
        filters.disciplines = Array.isArray(req.query.disciplines) 
          ? req.query.disciplines 
          : [req.query.disciplines];
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
      
      if (req.query.min_price && req.query.min_price !== '0' && req.query.min_price !== 'null') {
        filters.price_min = parseInt(req.query.min_price as string);
      }
      
      if (req.query.max_price && req.query.max_price !== '999999999' && req.query.max_price !== 'null') {
        filters.price_max = parseInt(req.query.max_price as string);
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
  app.get("/api/horses/owner", isAuthenticated, async (req, res) => {
    try {
      // Get the user with their roles
      const user = await storage.getUserById(req.session.userId);
      
      console.log(`GET /api/horses/owner - user:`, user);
      
      // Check if the user has selling permission
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only users with selling permission can access their horses" });
      }
      
      const ownerId = req.session.userId;
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
  app.post("/api/matches", isAuthenticated, async (req, res) => {
    try {
      // Get the user with their roles
      const user = await storage.getUserById(req.session.userId);
      
      if (!user || !user.is_searching) {
        return res.status(403).json({ message: "Only users with searching permission can create matches" });
      }
      
      const validatedData = insertMatchSchema.parse(req.body);
      
      // Ensure customer_id matches the logged-in customer
      if (validatedData.customer_id !== req.session.userId) {
        return res.status(403).json({ message: "Cannot create match for another user" });
      }
      
      const match = await storage.createMatch(validatedData);
      return res.status(201).json(match);
    } catch (error) {
      console.error("Create match error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  app.get("/api/matches", isAuthenticated, async (req, res) => {
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

  // Message routes
  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      
      // Get the user with their roles
      const user = await storage.getUserById(req.session.userId);
      
      if (!user) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Ensure sender_type and ID match the logged-in user's roles
      const isSenderCustomer = validatedData.sender_type === "customer";
      const isSenderOwner = validatedData.sender_type === "owner";
      
      if (
        (isSenderCustomer && (!user.is_searching || validatedData.customer_id !== req.session.userId)) ||
        (isSenderOwner && (!user.is_selling || validatedData.owner_id !== req.session.userId))
      ) {
        return res.status(403).json({ message: "Sender type and ID must match your account roles" });
      }
      
      const message = await storage.createMessage(validatedData);
      return res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  app.get("/api/messages/:customerId/:ownerId/:horseId", isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const ownerId = parseInt(req.params.ownerId);
      const horseId = parseInt(req.params.horseId);
      
      // Get the user with their roles
      const user = await storage.getUserById(req.session.userId);
      
      if (!user) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Ensure the logged-in user is part of the conversation
      if (
        (user.is_searching && customerId !== req.session.userId) ||
        (user.is_selling && ownerId !== req.session.userId)
      ) {
        return res.status(403).json({ message: "Cannot access messages of other users" });
      }
      
      const messages = await storage.getMessagesByConversationId(customerId, ownerId, horseId);
      return res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      return res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Conversation routes
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      // Get the user with their roles
      const user = await storage.getUserById(req.session.userId);
      
      if (!user) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      let conversations = [];
      
      // Users can access conversations based on their active roles
      if (user.is_searching) {
        const customerConversations = await storage.getConversationsByCustomerId(req.session.userId);
        conversations = [...conversations, ...customerConversations];
      }
      
      if (user.is_selling) {
        const ownerConversations = await storage.getConversationsByOwnerId(req.session.userId);
        conversations = [...conversations, ...ownerConversations];
      }
      
      if (conversations.length === 0 && !user.is_searching && !user.is_selling) {
        return res.status(403).json({ message: "No active roles to access conversations" });
      }
      
      // Enrich conversations with horse and user data
      const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
        const horse = await storage.getHorseById(conv.horse_id);
        let otherParty;
        
        // Determine other party based on conversation context
        const isUserCustomer = conv.customer_id === req.session.userId;
        
        if (isUserCustomer) {
          otherParty = await storage.getOwnerById(conv.owner_id);
        } else {
          otherParty = await storage.getCustomerById(conv.customer_id);
        }
        
        return {
          ...conv,
          horse: horse ? {
            id: horse.id,
            name: horse.name,
            photos: horse.photos,
            price: horse.price,
            currency: horse.currency,
            breeds: horse.breeds,
            age: horse.age,
            sex: horse.sex
          } : null,
          otherParty: otherParty ? {
            id: otherParty.id,
            name: req.session.userType === "customer" ? otherParty.business_name : otherParty.name,
            type: req.session.userType === "customer" ? "owner" : "customer"
          } : null
        };
      }));
      
      return res.json(enrichedConversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      return res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  // Utility routes - for the app constants
  app.get("/api/constants", (req, res) => {
    try {
      // Use the constants imported at the top of the file
      return res.json({
        disciplines,
        sexes,
        breeds,
        characteristics,
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
