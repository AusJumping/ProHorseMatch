import type { Express, Response, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import cookieParser from "cookie-parser";
import multer from "multer";
import { login, logout, getCurrentUser, requireAuth } from "./auth";
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
  jumpingLevels,
  dressageLevels,
  eventingLevels
} from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(cookieParser());

  // Authentication routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", getCurrentUser);

  // Registration routes
  app.post("/api/auth/register/owner", async (req, res) => {
    try {
      const result = insertSellingUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser({
        ...result.data,
        is_selling: true,
        is_searching: false
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register/customer", async (req, res) => {
    try {
      const result = insertSearchingUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser({
        ...result.data,
        is_selling: false,
        is_searching: true
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Protected horse routes
  app.get("/api/horses", async (req, res) => {
    try {
      const horses = await storage.getHorses();
      res.json(horses);
    } catch (error) {
      console.error("Error fetching horses:", error);
      res.status(500).json({ message: "Failed to fetch horses" });
    }
  });

  app.get("/api/horses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const horse = await storage.getHorseById(id);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      res.json(horse);
    } catch (error) {
      console.error("Error fetching horse:", error);
      res.status(500).json({ message: "Failed to fetch horse" });
    }
  });

  app.post("/api/horses", requireAuth, upload.array('images', 10), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const horseData = JSON.parse(req.body.horseData);
      
      const result = insertHorseSchema.safeParse({
        ...horseData,
        owner_id: userId
      });

      if (!result.success) {
        return res.status(400).json({ message: "Invalid horse data", errors: result.error.errors });
      }

      let imageUrls: string[] = [];
      
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const imageUrl = await uploadToCloudinary(file.buffer, file.originalname);
            imageUrls.push(imageUrl);
          } catch (uploadError) {
            console.error("Image upload error:", uploadError);
          }
        }
      }

      const horse = await storage.createHorse({
        ...result.data,
        images: imageUrls,
        videos: []
      });

      res.json(horse);
    } catch (error) {
      console.error("Error creating horse:", error);
      res.status(500).json({ message: "Failed to create horse" });
    }
  });

  // User profile routes
  app.get("/api/user/profile", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Matches routes
  app.get("/api/matches", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const matches = await storage.getMatchesByCustomerId(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.post("/api/matches", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { horse_id, is_liked } = req.body;

      const match = await storage.createMatch({
        customer_id: userId,
        horse_id: parseInt(horse_id),
        is_liked: is_liked
      });

      res.json(match);
    } catch (error) {
      console.error("Error creating match:", error);
      res.status(500).json({ message: "Failed to create match" });
    }
  });

  // Messages routes
  app.get("/api/conversations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let conversations;
      if (user.is_selling) {
        conversations = await storage.getConversationsByOwnerId(userId);
      } else {
        conversations = await storage.getConversationsByCustomerId(userId);
      }

      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id/messages", requireAuth, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversationById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await storage.getMessagesByConversationId(
        conversation.customer_id,
        conversation.owner_id,
        conversation.horse_id
      );

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const user = await storage.getUserById(userId);
      const senderType = user?.is_selling ? 'owner' : 'customer';

      const message = await storage.createMessage({
        customer_id: conversation.customer_id,
        owner_id: conversation.owner_id,
        horse_id: conversation.horse_id,
        content,
        sender_type: senderType
      });

      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Data endpoints
  app.get("/api/data/disciplines", (req, res) => {
    res.json(disciplines);
  });

  app.get("/api/data/sexes", (req, res) => {
    res.json(sexes);
  });

  app.get("/api/data/colours", (req, res) => {
    res.json(colours);
  });

  app.get("/api/data/breeds", (req, res) => {
    res.json(breeds);
  });

  app.get("/api/data/characteristics", (req, res) => {
    res.json(characteristics);
  });

  app.get("/api/data/jumping-levels", (req, res) => {
    res.json(jumpingLevels);
  });

  app.get("/api/data/dressage-levels", (req, res) => {
    res.json(dressageLevels);
  });

  app.get("/api/data/eventing-levels", (req, res) => {
    res.json(eventingLevels);
  });

  const httpServer = createServer(app);
  return httpServer;
}