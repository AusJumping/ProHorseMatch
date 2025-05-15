import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, MemStorage } from "./storage";
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

// Ensure we have test users available (For development only)
(async () => {
  console.log("Setting up test users...");
  try {
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  const isProduction = process.env.NODE_ENV === "production";
  
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
      // Convert query params to filters
      const filters: any = {};
      
      if (req.query.disciplines) {
        filters.disciplines = Array.isArray(req.query.disciplines) 
          ? req.query.disciplines 
          : [req.query.disciplines];
      }
      
      if (req.query.breeds) {
        filters.breeds = Array.isArray(req.query.breeds) 
          ? req.query.breeds 
          : [req.query.breeds];
      }
      
      if (req.query.sex) {
        filters.sex = req.query.sex as string;
      }
      
      if (req.query.location_country) {
        filters.location_country = req.query.location_country as string;
      }
      
      if (req.query.min_price || req.query.max_price) {
        filters.price = parseInt(req.query.max_price as string);
      }
      
      const horses = await storage.getHorsesByFilters(filters);
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
      
      // Check if the user has selling permission
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only users with selling permission can access their horses" });
      }
      
      const ownerId = req.session.userId;
      const filters = { owner_id: ownerId };
      
      const horses = await storage.getHorsesByFilters(filters);
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
