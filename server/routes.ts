import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertHorseSchema, 
  insertOwnerSchema, 
  insertCustomerSchema, 
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

  // Auth middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register/customer", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Check if email is already taken
      const existingUser = await storage.getCustomerByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // In a real app, we would hash the password here
      const customer = await storage.createCustomer(validatedData);
      
      // Set user session
      req.session.userId = customer.id;
      req.session.userType = "customer";
      
      return res.status(201).json({ 
        id: customer.id,
        name: customer.name,
        email: customer.email,
        type: "customer"
      });
    } catch (error) {
      console.error("Register customer error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  app.post("/api/auth/register/owner", async (req, res) => {
    try {
      const validatedData = insertOwnerSchema.parse(req.body);
      
      // Check if email is already taken
      const existingUser = await storage.getOwnerByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // In a real app, we would hash the password here
      const owner = await storage.createOwner(validatedData);
      
      // Set user session
      req.session.userId = owner.id;
      req.session.userType = "owner";
      
      return res.status(201).json({ 
        id: owner.id,
        business_name: owner.business_name,
        contact_name: owner.contact_name,
        email: owner.email,
        type: "owner"
      });
    } catch (error) {
      console.error("Register owner error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt:", req.body);
      const { email, password, userType } = req.body;
      
      if (!email || !password || !userType) {
        console.log("Login failed - Missing required fields");
        return res.status(400).json({ message: "Email, password and user type are required" });
      }
      
      if (userType === "customer") {
        console.log("Login attempt as customer:", email);
        const customer = await storage.getCustomerByEmail(email);
        
        if (!customer) {
          console.log("Login failed - Customer not found:", email);
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        if (customer.password !== password) {
          console.log("Login failed - Invalid password for customer:", email);
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        console.log("Login successful - Setting customer session:", {
          id: customer.id,
          type: "customer",
          sessionId: req.sessionID
        });
        
        req.session.userId = customer.id;
        req.session.userType = "customer";
        
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
          id: customer.id,
          name: customer.name,
          email: customer.email,
          type: "customer"
        });
      } else if (userType === "owner") {
        console.log("Login attempt as owner:", email);
        const owner = await storage.getOwnerByEmail(email);
        
        if (!owner) {
          console.log("Login failed - Owner not found:", email);
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        if (owner.password !== password) {
          console.log("Login failed - Invalid password for owner:", email);
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        console.log("Login successful - Setting owner session:", {
          id: owner.id,
          type: "owner",
          sessionId: req.sessionID
        });
        
        req.session.userId = owner.id;
        req.session.userType = "owner";
        
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
          id: owner.id,
          business_name: owner.business_name,
          contact_name: owner.contact_name,
          email: owner.email,
          type: "owner"
        });
      } else {
        console.log("Login failed - Invalid user type:", userType);
        return res.status(400).json({ message: "Invalid user type" });
      }
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
      userType: req.session.userType,
      sessionContent: req.session
    });
    
    if (!req.session.userId || !req.session.userType) {
      console.log("Auth check failed - Not authenticated");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      console.log(`Auth check - Looking up ${req.session.userType} with ID ${req.session.userId}`);
      if (req.session.userType === "customer") {
        const customer = await storage.getCustomerById(req.session.userId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        
        return res.json({ 
          id: customer.id,
          name: customer.name,
          email: customer.email,
          type: "customer",
          profile: {
            location_country: customer.location_country,
            location_radius_km: customer.location_radius_km,
            preferred_disciplines: customer.preferred_disciplines,
            preferred_levels: customer.preferred_levels,
            preferred_breeds: customer.preferred_breeds,
            age_range_min: customer.age_range_min,
            age_range_max: customer.age_range_max,
            height_range_min: customer.height_range_min,
            height_range_max: customer.height_range_max,
            preferred_sexes: customer.preferred_sexes,
            breeding_preferences: customer.breeding_preferences,
            preferred_characteristics: customer.preferred_characteristics,
            price_range_min: customer.price_range_min,
            price_range_max: customer.price_range_max,
            currency: customer.currency
          }
        });
      } else if (req.session.userType === "owner") {
        const owner = await storage.getOwnerById(req.session.userId);
        if (!owner) {
          return res.status(404).json({ message: "Owner not found" });
        }
        
        return res.json({ 
          id: owner.id,
          business_name: owner.business_name,
          contact_name: owner.contact_name,
          email: owner.email,
          type: "owner"
        });
      }
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Failed to get user" });
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
  app.get("/api/horses/owner", requireAuth, async (req, res) => {
    try {
      if (req.session.userType !== "owner") {
        return res.status(403).json({ message: "Only owners can access their horses" });
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

  app.post("/api/horses", requireAuth, async (req, res) => {
    try {
      if (req.session.userType !== "owner") {
        return res.status(403).json({ message: "Only owners can create horses" });
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
  app.put("/api/horses/:id", requireAuth, async (req, res) => {
    try {
      if (req.session.userType !== "owner") {
        return res.status(403).json({ message: "Only owners can update horses" });
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
      
      return res.json(updatedHorse);
    } catch (error) {
      console.error("Update horse error:", error);
      return res.status(400).json({ message: "Failed to update horse" });
    }
  });
  
  // Delete a horse
  app.delete("/api/horses/:id", requireAuth, async (req, res) => {
    try {
      if (req.session.userType !== "owner") {
        return res.status(403).json({ message: "Only owners can delete horses" });
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
  app.post("/api/matches", requireAuth, async (req, res) => {
    try {
      if (req.session.userType !== "customer") {
        return res.status(403).json({ message: "Only customers can create matches" });
      }
      
      const validatedData = insertMatchSchema.parse(req.body);
      
      // Ensure customer_id matches the logged-in customer
      if (validatedData.customer_id !== req.session.userId) {
        return res.status(403).json({ message: "Cannot create match for another customer" });
      }
      
      const match = await storage.createMatch(validatedData);
      return res.status(201).json(match);
    } catch (error) {
      console.error("Create match error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  app.get("/api/matches", requireAuth, async (req, res) => {
    try {
      let matches;
      
      if (req.session.userType === "customer") {
        matches = await storage.getMatchesByCustomerId(req.session.userId);
      } else if (req.session.userType === "owner") {
        // For owners, get all matches for their horses
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
  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      
      // Ensure sender_type and ID match the logged-in user
      if (
        (req.session.userType === "customer" && 
         (validatedData.sender_type !== "customer" || validatedData.customer_id !== req.session.userId)) ||
        (req.session.userType === "owner" && 
         (validatedData.sender_type !== "owner" || validatedData.owner_id !== req.session.userId))
      ) {
        return res.status(403).json({ message: "Sender type and ID must match your account" });
      }
      
      const message = await storage.createMessage(validatedData);
      return res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  app.get("/api/messages/:customerId/:ownerId/:horseId", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const ownerId = parseInt(req.params.ownerId);
      const horseId = parseInt(req.params.horseId);
      
      // Ensure the logged-in user is part of the conversation
      if (
        (req.session.userType === "customer" && customerId !== req.session.userId) ||
        (req.session.userType === "owner" && ownerId !== req.session.userId)
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
  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      let conversations;
      
      if (req.session.userType === "customer") {
        conversations = await storage.getConversationsByCustomerId(req.session.userId);
      } else if (req.session.userType === "owner") {
        conversations = await storage.getConversationsByOwnerId(req.session.userId);
      } else {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Enrich conversations with horse and user data
      const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
        const horse = await storage.getHorseById(conv.horse_id);
        let otherParty;
        
        if (req.session.userType === "customer") {
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
