import express, { type Express, Response, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, generateToken } from "./auth";
import { insertSearchingUserSchema, insertSellingUserSchema } from "../shared/schema";

interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // CORS middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Authentication middleware wrapper
  const isAuthenticated = (req: any, res: Response, next: any) => {
    return authenticateToken(req, res, next);
  };

  // Register customer endpoint
  app.post("/api/auth/register/customer", async (req, res) => {
    try {
      const validatedData = insertSearchingUserSchema.parse(req.body);
      
      // Check if email is already taken
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const user = await storage.createUser({
        ...validatedData,
        is_searching: true
      });
      
      // Generate JWT token
      const token = generateToken(user.id, user.email);
      
      return res.status(201).json({ 
        id: user.id,
        name: user.name,
        email: user.email,
        is_searching: true,
        is_selling: false,
        token: token
      });
    } catch (error: any) {
      console.error("Register searching user error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  // Register owner endpoint
  app.post("/api/auth/register/owner", async (req, res) => {
    try {
      const validatedData = insertSellingUserSchema.parse(req.body);
      
      // Check if email is already taken
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const user = await storage.createUser({
        ...validatedData,
        is_selling: true
      });
      
      // Generate JWT token
      const token = generateToken(user.id, user.email);
      
      return res.status(201).json({ 
        id: user.id,
        business_name: user.business_name,
        contact_name: user.contact_name,
        email: user.email,
        is_searching: false,
        is_selling: true,
        token: token
      });
    } catch (error: any) {
      console.error("Register selling user error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = generateToken(user.id, user.email);
      
      // Return full user data including subscription info and token
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
        token: token
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  // Logout endpoint (JWT-based - client handles token removal)
  app.post("/api/auth/logout", (req, res) => {
    return res.json({ message: "Logged out successfully" });
  });

  // Get current user endpoint
  app.get("/api/auth/me", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
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
        subscription_end_date: user.subscription_end_date
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get horses endpoint
  app.get("/api/horses", async (req, res) => {
    try {
      const horses = await storage.getHorses();
      return res.json(horses);
    } catch (error: any) {
      console.error("Get horses error:", error);
      return res.status(500).json({ message: "Failed to get horses" });
    }
  });

  // Get horse by ID endpoint
  app.get("/api/horses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const horse = await storage.getHorseById(id);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      return res.json(horse);
    } catch (error: any) {
      console.error("Get horse error:", error);
      return res.status(500).json({ message: "Failed to get horse" });
    }
  });

  return httpServer;
}