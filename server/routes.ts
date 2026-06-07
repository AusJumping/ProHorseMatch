import type { Express, Response, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage, MemStorage, resetStorageToEmpty } from "./storage";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import Stripe from "stripe";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinary";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendMessageNotificationEmail, sendHorseListingNotification, sendNewConversationNotificationEmail, sendConversationReminderEmail, sendSubscriptionReminderEmail, sendPushNotificationAnnouncementEmail, sendVerificationReminderEmail } from "./emailService";
import { generateVerificationToken, isTokenExpired, createTokenExpiration, createPasswordResetExpiration, generateReminderToken, hashReminderToken, createReminderTokenExpiration } from "./authUtils";
import { sendNewMatchNotification, sendNewMessageNotification, sendHorseUpdateNotification } from "./pushNotifications";
import { 
  insertHorseSchema, 
  insertUserSchema,
  insertSellingUserSchema, 
  insertSearchingUserSchema, 
  insertMatchSchema, 
  insertMessageSchema,
  insertConversationSchema,
  insertSavedSearchSchema,
  insertPushSubscriptionSchema,
  insertLoginEventSchema,
  type InsertMessage,
  type InsertConversation,
  type InsertSavedSearch,
  type SavedSearch,
  type InsertPushSubscription,
  disciplines,
  sexes,
  colours,
  breeds,
  characteristics,
  countries,
  educationLevels,
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
    
    // Check if the admin user exists
    const adminEmail = "info@australianjumping.com.au";
    let admin = await storage.getUserByEmail(adminEmail);
    
    if (!admin) {
      console.log(`Creating admin user: ${adminEmail}`);
      admin = await storage.createUser({
        email: adminEmail,
        password: "AdminPro2025!",
        username: "admin_prohorsematch",
        name: "ProHorseMatch Admin",
        business_name: "Australian Jumping Association",
        is_selling: false,
        is_searching: false,
        email_verified: true
      });
      console.log("Created admin user:", admin);
    } else {
      console.log("Admin user already exists:", admin);
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

// Declare global types for auth and reminder tokens
declare global {
  var authTokens: Map<string, { userId: number; timestamp: number; lastActivity: number; expires?: number }> | undefined;
  var reminderTokens: Map<string, { userId: number; expiresAt: Date }> | undefined;
}

const SessionStore = MemoryStore(session);

// Configure multer for memory storage (we'll upload to Cloudinary)
// Configure multer for local file storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      // Ensure the uploads directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const filename = 'file-' + uniqueSuffix + extension;
      console.log("=== FILE STORAGE ===");
      console.log("Generated filename:", filename);
      console.log("Original filename:", file.originalname);
      console.log("File mimetype:", file.mimetype);
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit (for videos)
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos with different size limits
    if (file.mimetype.startsWith('image/')) {
      // Check image size limit (5MB) - note: file.size not available in fileFilter
      // Size will be checked after upload in route handler
      cb(null, true);
    } else if (file.mimetype.startsWith('video/')) {
      // Videos can be up to 500MB (handled by multer limits)
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// Configure multer for memory storage (for Cloudinary uploads)
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit (for videos)
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos with different size limits
    if (file.mimetype.startsWith('image/')) {
      // Image size limit (5MB) will be checked after upload in route handler
      cb(null, true);
    } else if (file.mimetype.startsWith('video/')) {
      // Videos can be up to 500MB (handled by multer limits)
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize auth token store at startup
  if (!global.authTokens) {
    global.authTokens = new Map();
    console.log("Initialized auth token store at startup");
  }

  // Serve static uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

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
      
      // Require Terms and Conditions acceptance
      if (!req.body.accepted_terms) {
        return res.status(400).json({ message: "You must accept the Terms and Conditions to register" });
      }
      
      // Check if email is already taken
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Hash password before storing
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);
      
      // Generate verification token
      const verificationToken = generateVerificationToken();
      const tokenExpires = createTokenExpiration();
      
      // Beta: everyone gets both buyer + seller access. No role selection during beta.
      // TODO: When subscriptions launch, accept is_searching/is_selling from req.body (set by role selector on form)
      //       and remove the auto-activation override in the verify-email endpoint.
      const is_searching = true;
      const is_selling = true;

      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        is_searching,
        is_selling,
        name: null,
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expires: tokenExpires,
        accepted_terms: true,
        accepted_terms_at: new Date(),
        accepted_terms_version: '1.0',
        subscription_tier: 'beta_free',
      });
      
      // Send verification email
      const baseUrl = req.protocol + '://' + req.get('host');
      console.log('=== REGISTRATION EMAIL PROCESS START ===');
      console.log('User created successfully:', {
        id: user.id,
        email: user.email,
        username: user.username,
        email_verified: user.email_verified,
        verification_token: verificationToken ? 'exists' : 'missing',
        token_expires: tokenExpires
      });
      console.log('Base URL for verification:', baseUrl);
      
      const emailSent = await sendVerificationEmail({
        to: user.email,
        username: user.username,
        verificationToken: verificationToken,
        baseUrl: baseUrl
      });
      
      console.log('Email send result:', emailSent);
      if (!emailSent) {
        console.error('Failed to send verification email to:', user.email);
      } else {
        console.log('Verification email sent successfully to:', user.email);
      }
      
      return res.status(201).json({ 
        message: "Registration successful! Please check your email to verify your account.",
        email: user.email,
        username: user.username,
        requiresVerification: true
      });
    } catch (error) {
      console.error("Register searching user error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  app.post("/api/auth/register/owner", async (req, res) => {
    try {
      const validatedData = insertSellingUserSchema.parse(req.body);
      
      // Require Terms and Conditions acceptance
      if (!req.body.accepted_terms) {
        return res.status(400).json({ message: "You must accept the Terms and Conditions to register" });
      }
      
      // Check if email is already taken
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Generate verification token
      const verificationToken = generateVerificationToken();
      const tokenExpires = createTokenExpiration();
      
      // Create user with verification fields
      const user = await storage.createUser({
        ...validatedData,
        is_selling: true,
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expires: tokenExpires,
        accepted_terms: true,
        accepted_terms_at: new Date(),
        accepted_terms_version: '1.0',
        subscription_tier: 'beta_free',
      });
      
      // Send verification email
      const baseUrl = req.protocol + '://' + req.get('host');
      const emailSent = await sendVerificationEmail({
        to: user.email,
        username: user.username,
        verificationToken: verificationToken,
        baseUrl: baseUrl
      });
      
      if (!emailSent) {
        console.warn('Failed to send verification email to:', user.email);
      }
      
      return res.status(201).json({ 
        message: "Registration successful! Please check your email to verify your account.",
        email: user.email,
        username: user.username,
        business_name: user.business_name,
        requiresVerification: true
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
      
      // For existing users with plain text passwords, use direct comparison
      // For new users with hashed passwords, use bcrypt
      let passwordValid = false;
      if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        // This is a bcrypt hash
        passwordValid = await bcrypt.compare(password, user.password);
      } else {
        // This is plain text (legacy users)
        passwordValid = user.password === password;
      }
      
      if (!passwordValid) {
        console.log("Login failed - Invalid password for user:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if email is verified (skip for test users)
      if (!user.email_verified && !email.includes('@example.com')) {
        console.log("Login failed - Email not verified for user:", email);
        return res.status(403).json({ 
          message: "Please verify your email before logging in. Check your inbox for a verification link.",
          requiresVerification: true,
          email: user.email
        });
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
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000), // 365 days - users stay logged in
        lastActivity: Date.now()
      });
      
      console.log("Created auth token:", authToken);
      
      // Set multiple cookies to ensure one works (365 day expiration)
      res.cookie('auth_token', authToken, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days - users stay logged in
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
      
      // Track login event (non-blocking, safe)
      try {
        await storage.trackLoginEvent(user.id);
      } catch (trackingError) {
        console.warn("Login tracking failed (non-critical):", trackingError);
        // Login still succeeds even if tracking fails
      }
      
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
        subscription_tier: user.subscription_tier,
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

  // Forgot password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      console.log("Forgot password request for email:", email);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }
      
      // Generate reset token
      const resetToken = generateVerificationToken();
      const tokenExpires = createPasswordResetExpiration();
      
      // Store reset token in user record
      await storage.updateUser(user.id, {
        verification_token: resetToken,
        verification_token_expires: tokenExpires
      });
      
      // Send password reset email
      const baseUrl = req.protocol + '://' + req.get('host');
      
      try {
        await sendPasswordResetEmail({
          to: user.email,
          username: user.username || user.name || 'User',
          resetToken: resetToken,
          baseUrl: baseUrl
        });
        
        console.log("Password reset email sent successfully to:", user.email);
        return res.json({ message: "If the email exists, a reset link has been sent" });
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        return res.status(500).json({ message: "Failed to send reset email" });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset password endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      console.log("Password reset request with token:", token.substring(0, 16) + '...');
      
      // Find user by reset token
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        console.log("Password reset failed - Invalid token");
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Check if token has expired
      if (user.verification_token_expires && isTokenExpired(user.verification_token_expires)) {
        console.log("Password reset failed - Token expired for user:", user.email);
        return res.status(400).json({ message: "Reset token has expired" });
      }
      
      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Update user password and clear reset token
      await storage.updateUser(user.id, {
        password: hashedPassword,
        verification_token: null,
        verification_token_expires: null
      });
      
      console.log("Password reset successful for user:", user.email);
      return res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Email unsubscribe endpoint
  app.post("/api/unsubscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }
      await storage.setUserUnsubscribed(email);
      console.log('User unsubscribed from emails:', email);
      return res.status(200).json({ message: "Successfully unsubscribed" });
    } catch (error) {
      console.error("Unsubscribe error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Email verification endpoints
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      console.log('=== EMAIL VERIFICATION REQUEST ===');
      console.log('Query params:', req.query);
      console.log('Request headers:', {
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        referer: req.headers.referer
      });
      
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        console.log('Verification failed - No token provided');
        return res.status(400).json({ message: "Verification token is required" });
      }
      
      console.log('Verification token received:', token.substring(0, 16) + '...');
      
      // Find user by verification token
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        console.log('Verification failed - Invalid token:', token.substring(0, 16) + '...');
        return res.status(400).json({ 
          message: "This verification link has already been used or is invalid. If you've already verified your email, please log in with your credentials.",
          alreadyUsed: true
        });
      }
      
      console.log('User found for verification:', {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        token_expires: user.verification_token_expires
      });
      
      // Check if token has expired
      if (user.verification_token_expires && isTokenExpired(user.verification_token_expires)) {
        console.log('Verification failed - Token expired for user:', user.email);
        return res.status(400).json({ message: "Verification token has expired" });
      }
      
      // Check if already verified
      if (user.email_verified) {
        console.log('User already verified:', user.email);
        return res.status(200).json({ message: "Email already verified" });
      }
      
      console.log('Updating user verification status...');
      // Verify the user
      await storage.updateUserVerification(user.id, true, null, null);
      
      console.log('User verification updated successfully');
      
      // Auto-activate beta subscription on email verification
      if (!user.subscription_status || user.subscription_status !== 'active') {
        try {
          await storage.updateUserSubscription(user.id, {
            stripe_subscription_id: 'beta',
            subscription_status: 'active',
            subscription_plan: 'beta',
            subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          });
          await storage.updateUser(user.id, { is_selling: true, is_searching: true });
          console.log('Beta subscription auto-activated for user:', user.email);
        } catch (betaErr) {
          console.warn('Auto beta activation failed (non-critical):', betaErr);
        }
      }
      
      // Automatically log in the user after verification
      console.log('Automatically logging in user after verification...');
      
      // Regenerate session to prevent fixation
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regeneration error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      // Set session data
      req.session.userId = user.id;
      req.session.userType = user.is_selling ? 'seller' : 'customer';
      
      // Save session
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      // Create auth token (same way as login route)
      const authToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      // Store auth token mapping in memory
      if (!global.authTokens) {
        global.authTokens = new Map();
      }
      global.authTokens.set(authToken, {
        userId: user.id,
        timestamp: Date.now(),
        lastActivity: Date.now()
      });
      
      console.log('User logged in automatically, auth token created:', authToken);
      
      // NOTE: Welcome email is now sent AFTER subscription selection, not at verification
      // NOTE: Subscription reminder email is now sent 24 hours after verification if user hasn't subscribed
      // The admin batch send endpoint handles this timing check
      
      // Get updated user data
      const updatedUser = await storage.getUserById(user.id);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to retrieve user data" });
      }
      
      // Set auth token in response headers and cookie
      res.setHeader('X-Auth-Token', authToken);
      res.setHeader('Access-Control-Expose-Headers', 'X-Auth-Token');
      res.cookie('auth_token', authToken, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        sameSite: 'lax'
      });
      
      // Track login event (non-blocking, safe)
      try {
        await storage.trackLoginEvent(updatedUser.id);
      } catch (trackingError) {
        console.warn("Login tracking failed (non-critical):", trackingError);
        // Verification still succeeds even if tracking fails
      }
      
      console.log('=== EMAIL VERIFICATION COMPLETE ===');
      return res.status(200).json({ 
        message: "Email verified successfully! You are now logged in.",
        verified: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          name: updatedUser.name,
          business_name: updatedUser.business_name,
          contact_name: updatedUser.contact_name,
          is_searching: updatedUser.is_searching,
          is_selling: updatedUser.is_selling,
          stripe_customer_id: updatedUser.stripe_customer_id,
          stripe_subscription_id: updatedUser.stripe_subscription_id,
          subscription_status: updatedUser.subscription_status,
          subscription_plan: updatedUser.subscription_plan,
          subscription_end_date: updatedUser.subscription_end_date,
          auth_token: authToken
        }
      });
    } catch (error) {
      console.error("=== EMAIL VERIFICATION ERROR ===");
      console.error("Email verification error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if already verified
      if (user.email_verified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const tokenExpires = createTokenExpiration();
      
      // Update user with new token
      await storage.updateUserVerification(user.id, false, verificationToken, tokenExpires);
      
      // Send new verification email
      const baseUrl = req.protocol + '://' + req.get('host');
      const emailSent = await sendVerificationEmail({
        to: user.email,
        username: user.username,
        verificationToken: verificationToken,
        baseUrl: baseUrl
      });
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }
      
      return res.status(200).json({ 
        message: "Verification email sent! Please check your inbox."
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reminder token login endpoint (magic link for subscription page)
  app.post("/api/auth/reminder-login", async (req, res) => {
    try {
      console.log('=== REMINDER TOKEN LOGIN REQUEST ===');
      const { reminderToken } = req.body;
      
      if (!reminderToken) {
        console.log('No reminder token provided');
        return res.status(400).json({ message: "Reminder token is required" });
      }
      
      // Hash the token to look it up
      const hashedToken = hashReminderToken(reminderToken);
      console.log('Looking up hashed reminder token');
      
      // Find user by reminder token
      const user = await storage.getUserByReminderToken(hashedToken);
      if (!user) {
        console.log('Invalid or expired reminder token');
        return res.status(401).json({ message: "Invalid or expired link" });
      }
      
      // Validate user is verified
      if (!user.email_verified) {
        console.log('User email not verified');
        return res.status(401).json({ message: "Email not verified" });
      }
      
      // Delete the token (one-time use)
      await storage.deleteReminderToken(hashedToken);
      console.log('Reminder token deleted (one-time use)');
      
      // Create auth token
      const authToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      // Store auth token mapping in memory
      if (!global.authTokens) {
        global.authTokens = new Map();
      }
      global.authTokens.set(authToken, {
        userId: user.id,
        timestamp: Date.now(),
        lastActivity: Date.now()
      });
      
      console.log('User logged in via reminder token, auth token created');
      
      // Set auth token in response headers and cookie
      res.setHeader('X-Auth-Token', authToken);
      res.setHeader('Access-Control-Expose-Headers', 'X-Auth-Token');
      res.cookie('auth_token', authToken, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        sameSite: 'lax'
      });
      
      // Track login event (non-blocking, safe)
      try {
        await storage.trackLoginEvent(user.id);
      } catch (trackingError) {
        console.warn("Login tracking failed (non-critical):", trackingError);
        // Login still succeeds even if tracking fails
      }
      
      console.log('=== REMINDER TOKEN LOGIN COMPLETE ===');
      return res.status(200).json({ 
        message: "Logged in successfully!",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          business_name: user.business_name,
          contact_name: user.contact_name,
          is_searching: user.is_searching,
          is_selling: user.is_selling,
          stripe_customer_id: user.stripe_customer_id,
          stripe_subscription_id: user.stripe_subscription_id,
          subscription_status: user.subscription_status,
          subscription_plan: user.subscription_plan,
          subscription_end_date: user.subscription_end_date,
          auth_token: authToken
        }
      });
    } catch (error) {
      console.error("=== REMINDER TOKEN LOGIN ERROR ===");
      console.error("Reminder login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Helper function to validate auth token - improved stateless validation
  const validateAuthToken = (token: string): number | null => {
    try {
      // Decode the base64 token
      const decodedToken = Buffer.from(token, 'base64').toString('utf8');
      const [userId, timestamp] = decodedToken.split(':');
      
      if (!userId || !timestamp) {
        return null;
      }
      
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 365 * 24 * 60 * 60 * 1000; // 365 days - users stay logged in
      
      if (tokenAge < maxAge) {
        return parseInt(userId);
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
        acc[key] = decodeURIComponent(value);
        return acc;
      }, {});
      authToken = cookies.auth_token;
    }
    
    console.log("Auth check - Token debug:", {
      authToken: authToken ? authToken.substring(0, 10) + '...' : 'none',
      authHeader: req.headers.authorization,
      cookies: req.headers.cookie
    });
    
    if (!authToken) {
      console.log("Auth check failed - No token provided");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Use stateless token validation
    const userId = validateAuthToken(authToken);
    if (!userId) {
      console.log("Auth check failed - Invalid or expired token");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
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
        username: user.username,
        name: user.name,
        business_name: user.business_name,
        contact_name: user.contact_name,
        email: user.email,
        is_searching: user.is_searching,
        is_selling: user.is_selling,
        stripe_subscription_id: user.stripe_subscription_id,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        subscription_end_date: user.subscription_end_date,
        subscription_tier: user.subscription_tier,
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
        acc[key] = decodeURIComponent(value);
        return acc;
      }, {});
      authToken = cookies.auth_token;
    }
    
    console.log("Token auth debug:", {
      authToken: authToken ? authToken.substring(0, 10) + '...' : 'none',
      authHeader: req.headers.authorization,
      cookies: req.headers.cookie
    });
    
    if (!authToken) {
      console.log("Token auth failed - No token provided");
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Use stateless token validation instead of global storage
    const userId = validateAuthToken(authToken);
    if (!userId) {
      console.log("Token auth failed - Invalid or expired token");
      return res.status(401).json({ message: "Authentication required" });
    }
    
    console.log(`Token auth success for user ${userId}`);
    // Add user info to request for use in route handlers
    req.userId = userId;
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
      
      console.log("DEBUGGING: About to process filters, sire value:", req.query.sire);
      
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
        const maxHeightValue = req.query.max_height as string;
        if (maxHeightValue === "young_horse") {
          filters.young_horse = true;
          console.log("Setting young_horse filter to:", true);
        } else {
          const maxHeight = parseFloat(maxHeightValue);
          if (!isNaN(maxHeight) && maxHeight !== 999) {
            filters.height_max = maxHeight;
            console.log("Setting height_max filter to:", maxHeight);
          }
        }
      }
      
      if (req.query.min_height) {
        const minHeightValue = req.query.min_height as string;
        if (minHeightValue === "young_horse") {
          filters.young_horse = true;
          console.log("Setting young_horse filter to:", true);
        } else {
          const minHeight = parseFloat(minHeightValue);
          if (!isNaN(minHeight) && minHeight !== 0) {
            filters.height_min = minHeight;
            console.log("Setting height_min filter to:", minHeight);
          }
        }
      }
      
      // Handle bloodline filters
      console.log("Bloodline filter debug - sire value:", req.query.sire, "type:", typeof req.query.sire);
      console.log("Bloodline filter debug - dam_sire value:", req.query.dam_sire, "type:", typeof req.query.dam_sire);
      
      if (req.query.sire && req.query.sire !== 'null' && req.query.sire !== '') {
        filters.sire = req.query.sire as string;
        console.log("Setting sire filter to:", filters.sire);
      }
      
      if (req.query.dam_sire && req.query.dam_sire !== 'null' && req.query.dam_sire !== '') {
        filters.dam_sire = req.query.dam_sire as string;
        console.log("Setting dam_sire filter to:", filters.dam_sire);
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

  app.post("/api/horses", isTokenAuthenticated, async (req, res) => {
    try {
      console.log("=== HORSE CREATION START ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("User ID:", req.userId);
      
      // Get the user with their roles
      const user = await storage.getUserById(req.userId);
      
      if (!user || !user.is_selling) {
        console.log("Horse creation failed - User lacks selling permission");
        return res.status(403).json({ message: "Only users with selling permission can create horses" });
      }
      
      // Convert "young_horse" to null for database storage
      const requestData = { ...req.body };
      if (requestData.height_hands === "young_horse") {
        requestData.height_hands = null;
      }
      
      console.log("Validating horse data...");
      const validatedData = insertHorseSchema.parse(requestData);
      console.log("Horse data validated successfully");
      
      // Ensure owner_id matches the logged-in owner
      if (validatedData.owner_id !== req.userId) {
        console.log("Horse creation failed - Owner ID mismatch");
        return res.status(403).json({ message: "Cannot create horse for another owner" });
      }
      
      console.log("Creating horse in database...");
      console.log("Photos to save:", validatedData.photos);
      console.log("Videos to save:", validatedData.videos);
      const horse = await storage.createHorse(validatedData);
      console.log("Horse created successfully with ID:", horse.id);
      console.log("Horse photos saved:", horse.photos);
      
      // Check saved searches for this new horse and send notifications
      await checkSavedSearchesForNewHorse(horse);
      
      // Send admin notification about new horse listing
      try {
        const owner = await storage.getUserById(horse.owner_id);
        const baseUrl = 'https://pro-horse-match-info6446.replit.app';
        
        await sendHorseListingNotification({
          to: 'info@australianjumping.com.au',
          horseName: horse.name,
          ownerName: owner?.name || owner?.business_name || owner?.contact_name || owner?.username || 'Unknown',
          ownerEmail: owner?.email || 'Unknown',
          price: `${horse.price_min}${horse.price_max !== horse.price_min ? ` - ${horse.price_max}` : ''}`,
          currency: horse.currency,
          location: horse.location_country,
          disciplines: Array.isArray(horse.disciplines) ? horse.disciplines : [],
          horseUrl: `${baseUrl}/horse/${horse.id}`
        });
        console.log('Admin notification sent for new horse listing:', horse.name);
      } catch (notificationError) {
        console.error('Failed to send admin notification for new horse:', notificationError);
        // Don't fail the horse creation if notification fails
      }
      
      console.log("=== HORSE CREATION COMPLETE ===");
      return res.status(201).json(horse);
    } catch (error) {
      console.error("Create horse error:", error);
      console.log("=== HORSE CREATION FAILED ===");
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });
  
  // Update a horse
  app.put("/api/horses/:id", isTokenAuthenticated, async (req, res) => {
    try {
      // Get the user with their roles
      const user = await storage.getUserById(req.userId);
      
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only users with selling permission can update horses" });
      }
      
      const id = parseInt(req.params.id);
      
      // Get the horse first to check ownership
      const horse = await storage.getHorseById(id);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      // Ensure owner can only update their own horses (unless admin)
      const isAdmin = user.email === 'info@australianjumping.com.au';
      if (horse.owner_id !== req.userId && !isAdmin) {
        return res.status(403).json({ message: "Cannot update another owner's horse" });
      }
      
      // Log the incoming data for debugging
      console.log("=== HORSE UPDATE START ===");
      console.log("Horse ID:", id);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("Current horse photos:", horse.photos);
      console.log("New photos from request:", req.body.photos);
      
      // Convert "young_horse" to null for database storage
      const requestData = { ...req.body };
      if (requestData.height_hands === "young_horse") {
        requestData.height_hands = null;
      }
      
      // Validate the update data
      const validatedData = {
        ...requestData,
        owner_id: horse.owner_id, // Ensure owner_id cannot be changed
        id: horse.id // Ensure id cannot be changed
      };
      
      // Update the horse using the storage method
      console.log("Updating horse in database...");
      const updatedHorse = await storage.updateHorse(id, validatedData);
      
      if (!updatedHorse) {
        console.log("Horse update failed - Storage returned null");
        return res.status(500).json({ message: "Failed to update horse" });
      }
      
      console.log("Horse updated successfully with ID:", updatedHorse.id);
      console.log("Updated horse photos:", updatedHorse.photos);
      
      // Send push notifications to users who have favorited this horse
      try {
        const favorites = await storage.getMatchesByHorseId(id);
        const usersToNotify = favorites
          .filter(fav => fav.type === 'like')
          .map(fav => fav.user_id);
        
        // Determine what changed to create a meaningful notification
        let updateType = 'details';
        if (JSON.stringify(horse.photos) !== JSON.stringify(updatedHorse.photos)) {
          updateType = 'new photos added';
        } else if (horse.price_min !== updatedHorse.price_min || horse.price_max !== updatedHorse.price_max) {
          updateType = 'price updated';
        }
        
        // Send notification to each user who favorited this horse
        for (const userId of usersToNotify) {
          await sendHorseUpdateNotification(userId, updatedHorse.name, updatedHorse.id, updateType);
        }
        
        console.log(`Sent update notifications to ${usersToNotify.length} users who favorited ${updatedHorse.name}`);
      } catch (notifError) {
        console.error("Error sending update notifications:", notifError);
        // Don't fail the update if notifications fail
      }
      
      console.log("=== HORSE UPDATE COMPLETE ===");
      return res.json(updatedHorse);
    } catch (error) {
      console.error("Update horse error:", error);
      return res.status(400).json({ message: "Failed to update horse" });
    }
  });
  
  // Delete a horse with questionnaire
  app.delete("/api/horses/:id", isTokenAuthenticated, async (req, res) => {
    try {
      // Get the user with their roles
      const user = await storage.getUserById(req.userId);
      
      if (!user || !user.is_selling) {
        return res.status(403).json({ message: "Only users with selling permission can delete horses" });
      }
      
      const id = parseInt(req.params.id);
      const horse = await storage.getHorseById(id);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      // Ensure owner can only delete their own horses
      if (horse.owner_id !== req.userId) {
        return res.status(403).json({ message: "Cannot delete another owner's horse" });
      }
      
      // Extract questionnaire responses from request body
      const { soldThroughApp, soldElsewhere, unsold } = req.body;
      
      // Store the deletion response for analytics
      try {
        await storage.createHorseDeletionResponse({
          horse_id: id,
          user_id: req.userId,
          horse_name: horse.name,
          sold_through_app: soldThroughApp || false,
          sold_elsewhere: soldElsewhere || false,
          unsold: unsold || false
        });
        console.log(`Horse deletion questionnaire saved for horse ${id}: sold_through_app=${soldThroughApp}, sold_elsewhere=${soldElsewhere}, unsold=${unsold}`);
      } catch (questionnaireError) {
        console.error("Failed to save deletion questionnaire:", questionnaireError);
        // Continue with deletion even if questionnaire fails
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

  // =============================================================================
  // ADMIN HORSE MANAGEMENT ROUTES - Only accessible by admin
  // =============================================================================

  // Get all horses for admin management
  app.get("/api/admin/horses", isTokenAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUserById(req.userId);
      
      // Check if user is admin
      if (!user || user.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const horses = await storage.getHorses();
      return res.json(horses);
    } catch (error) {
      console.error("Admin get horses error:", error);
      return res.status(500).json({ message: "Failed to get horses" });
    }
  });

  // Admin update any horse
  app.put("/api/admin/horses/:id", isTokenAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUserById(req.userId);
      
      // Check if user is admin
      if (!user || user.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      
      // Get the horse first to check if it exists
      const horse = await storage.getHorseById(id);
      
      if (!horse) {
        return res.status(404).json({ message: "Horse not found" });
      }
      
      // Convert "young_horse" to null for database storage
      const requestData = { ...req.body };
      if (requestData.height_hands === "young_horse") {
        requestData.height_hands = null;
      }
      
      // Validate the update data
      const validatedData = {
        ...requestData,
        owner_id: horse.owner_id, // Ensure owner_id cannot be changed
        id: horse.id // Ensure id cannot be changed
      };
      
      const updatedHorse = await storage.updateHorse(id, validatedData);
      
      return res.json(updatedHorse);
    } catch (error) {
      console.error("Admin update horse error:", error);
      return res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  // Admin delete any horse
  app.delete("/api/admin/horses/:id", isTokenAuthenticated, async (req, res) => {
    try {
      console.log(`Admin delete horse request - horse ID: ${req.params.id}, user ID: ${req.userId}`);
      
      const user = await storage.getUserById(req.userId);
      
      // Check if user is admin
      if (!user || user.email !== 'info@australianjumping.com.au') {
        console.log(`Admin delete horse - Access denied for user: ${user?.email || 'unknown'}`);
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        console.log(`Admin delete horse - Invalid horse ID: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid horse ID" });
      }
      
      // Get the horse first to check if it exists
      const horse = await storage.getHorseById(id);
      
      if (!horse) {
        console.log(`Admin delete horse - Horse not found: ${id}`);
        return res.status(404).json({ message: "Horse not found" });
      }
      
      console.log(`Admin delete horse - Found horse: ${horse.name} (ID: ${id}), proceeding with deletion`);
      
      // Delete the horse using the storage method (which handles related records)
      const deleted = await storage.deleteHorse(id);
      
      if (!deleted) {
        console.log(`Admin delete horse - Deletion failed for horse ID: ${id}`);
        return res.status(500).json({ message: "Failed to delete horse" });
      }
      
      console.log(`Admin delete horse - Successfully deleted horse: ${horse.name} (ID: ${id})`);
      return res.json({ message: `Horse '${horse.name}' deleted successfully` });
    } catch (error) {
      console.error("Admin delete horse error:", error);
      console.error("Error stack:", error.stack);
      return res.status(500).json({ 
        message: "Failed to delete horse", 
        error: error.message 
      });
    }
  });

  // Send subscription reminder emails to all users without subscriptions (admin only)
  app.post("/api/admin/send-subscription-reminders", isTokenAuthenticated, async (req: any, res) => {
    try {
      console.log('=== BATCH SEND SUBSCRIPTION REMINDERS ===');
      
      // Check if user is admin
      const adminUser = await storage.getUserById(req.userId!);
      if (!adminUser || adminUser.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get all users
      const allUsers = await storage.getUsers();
      
      // Filter for users who:
      // 1. Have verified their email
      // 2. Don't have a subscription yet
      // 3. Account was created at least 24 hours ago (give them time to subscribe on their own)
      // 4. Haven't received a reminder in the last 24 hours (to prevent duplicates)
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const usersWithoutSubscription = allUsers.filter(user => {
        // Must have verified email and no subscription
        if (!user.email_verified || user.stripe_subscription_id) {
          return false;
        }
        
        // Skip if account was created less than 24 hours ago (give them time to subscribe)
        if (user.created_at) {
          const createdAt = new Date(user.created_at);
          if (createdAt > twentyFourHoursAgo) {
            return false; // Account too new, give them time
          }
        }
        
        // Skip if they received a reminder within the last 24 hours
        if (user.subscription_reminder_sent_at) {
          const lastSent = new Date(user.subscription_reminder_sent_at);
          if (lastSent > twentyFourHoursAgo) {
            return false; // Already sent recently
          }
        }
        
        return true;
      });
      
      console.log(`Found ${usersWithoutSubscription.length} users without subscriptions (excluding those who received reminders in last 24h)`);
      
      const results = {
        total: usersWithoutSubscription.length,
        sent: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      // Send reminder email to each user
      const baseUrl = req.protocol + '://' + req.get('host');
      
      for (const user of usersWithoutSubscription) {
        try {
          // Skip if email is invalid
          if (!user.email || typeof user.email !== 'string') {
            results.failed++;
            results.errors.push(`Invalid email for user ${user.id}`);
            console.log(`✗ Skipped user ${user.id} - invalid email`);
            continue;
          }
          
          // Generate reminder token
          const reminderToken = generateReminderToken();
          const hashedToken = hashReminderToken(reminderToken);
          const expiresAt = createReminderTokenExpiration();
          
          // Store the token
          await storage.setReminderToken(user.id, hashedToken, expiresAt);
          
          // Build subscription URL with reminder token for magic link
          const subscriptionUrl = `${baseUrl}/subscription?reminderToken=${reminderToken}`;
          
          // Send the email
          const emailSent = await sendSubscriptionReminderEmail(user.email, user.username, subscriptionUrl);
          
          if (emailSent) {
            // Update the timestamp to track when this user received the reminder
            await storage.updateUser(user.id, {
              subscription_reminder_sent_at: new Date()
            });
            
            results.sent++;
            console.log(`✓ Sent reminder to ${user.email}`);
          } else {
            results.failed++;
            results.errors.push(`Failed to send email to ${user.email}`);
            console.log(`✗ Failed to send reminder to ${user.email}`);
          }
          
          // Add delay to respect rate limits (2 requests per second = 500ms delay)
          await new Promise(resolve => setTimeout(resolve, 550));
        } catch (error) {
          results.failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Error sending to ${user.email}: ${errorMsg}`);
          console.error(`Error sending reminder to ${user.email}:`, error);
          
          // Add delay even on error to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 550));
        }
      }
      
      console.log('=== BATCH SEND COMPLETE ===');
      console.log(`Total: ${results.total}, Sent: ${results.sent}, Failed: ${results.failed}`);
      
      return res.status(200).json({
        message: `Sent ${results.sent} of ${results.total} reminder emails`,
        ...results
      });
    } catch (error) {
      console.error("Batch reminder email error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get count of users who would receive subscription reminders (admin only)
  app.get("/api/admin/subscription-reminder-count", isTokenAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const adminUser = await storage.getUserById(req.userId!);
      if (!adminUser || adminUser.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get all users
      const allUsers = await storage.getUsers();
      
      // Filter for users who would receive the reminder
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const usersWithoutSubscription = allUsers.filter(user => {
        if (!user.email_verified || user.stripe_subscription_id) {
          return false;
        }
        
        // Skip if account was created less than 24 hours ago (give them time to subscribe)
        if (user.created_at) {
          const createdAt = new Date(user.created_at);
          if (createdAt > twentyFourHoursAgo) {
            return false;
          }
        }
        
        if (user.subscription_reminder_sent_at) {
          const lastSent = new Date(user.subscription_reminder_sent_at);
          if (lastSent > twentyFourHoursAgo) {
            return false;
          }
        }
        
        return true;
      });
      
      return res.status(200).json({
        count: usersWithoutSubscription.length,
        message: `${usersWithoutSubscription.length} verified users (24h+ old) without subscriptions`
      });
    } catch (error) {
      console.error("Count subscription reminder error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send subscription reminder preview email to admin (admin only)
  app.post("/api/admin/preview-subscription-reminder", isTokenAuthenticated, async (req: any, res) => {
    try {
      console.log('=== PREVIEW SUBSCRIPTION REMINDER ===');
      
      // Check if user is admin
      const adminUser = await storage.getUserById(req.userId!);
      if (!adminUser || adminUser.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const baseUrl = req.protocol + '://' + req.get('host');
      
      // Generate a test reminder token for preview
      const reminderToken = generateReminderToken();
      const subscriptionUrl = `${baseUrl}/subscription?reminderToken=${reminderToken}`;
      
      // Send preview email to admin
      const emailSent = await sendSubscriptionReminderEmail(
        'info@australianjumping.com.au',
        adminUser.username,
        subscriptionUrl
      );
      
      if (emailSent) {
        console.log('✓ Preview subscription reminder sent to admin');
        return res.status(200).json({
          message: 'Preview email sent to info@australianjumping.com.au',
          success: true
        });
      } else {
        console.log('✗ Failed to send preview subscription reminder');
        return res.status(500).json({
          message: 'Failed to send preview email',
          success: false
        });
      }
    } catch (error) {
      console.error("Preview subscription reminder error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get count of users who would receive verification reminders (admin only)
  app.get("/api/admin/verification-reminder-count", isTokenAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const adminUser = await storage.getUserById(req.userId!);
      if (!adminUser || adminUser.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get all users
      const allUsers = await storage.getUsers();
      
      // Filter for users who haven't verified their email
      const unverifiedUsers = allUsers.filter(user => !user.email_verified);
      
      return res.status(200).json({
        count: unverifiedUsers.length,
        message: `${unverifiedUsers.length} users have not verified their email`
      });
    } catch (error) {
      console.error("Count verification reminder error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send verification reminder preview email to admin (admin only)
  app.post("/api/admin/preview-verification-reminder", isTokenAuthenticated, async (req: any, res) => {
    try {
      console.log('=== PREVIEW VERIFICATION REMINDER ===');
      
      // Check if user is admin
      const adminUser = await storage.getUserById(req.userId!);
      if (!adminUser || adminUser.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const baseUrl = req.protocol + '://' + req.get('host');
      
      // Generate a test verification token for preview
      const verificationToken = generateVerificationToken();
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
      
      // Send preview email to admin
      const emailSent = await sendVerificationReminderEmail(
        'info@australianjumping.com.au',
        adminUser.username,
        verificationUrl
      );
      
      if (emailSent) {
        console.log('✓ Preview verification reminder sent to admin');
        return res.status(200).json({
          message: 'Preview email sent to info@australianjumping.com.au',
          success: true
        });
      } else {
        console.log('✗ Failed to send preview verification reminder');
        return res.status(500).json({
          message: 'Failed to send preview email',
          success: false
        });
      }
    } catch (error) {
      console.error("Preview verification reminder error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send verification reminders to all unverified users (admin only)
  app.post("/api/admin/send-verification-reminders", isTokenAuthenticated, async (req: any, res) => {
    try {
      console.log('=== BATCH SEND VERIFICATION REMINDERS ===');
      
      // Check if user is admin
      const adminUser = await storage.getUserById(req.userId!);
      if (!adminUser || adminUser.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get all users
      const allUsers = await storage.getUsers();
      
      // Filter for users who haven't verified their email
      const unverifiedUsers = allUsers.filter(user => !user.email_verified);
      
      console.log(`Found ${unverifiedUsers.length} unverified users`);
      
      const results = {
        total: unverifiedUsers.length,
        sent: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      const baseUrl = req.protocol + '://' + req.get('host');
      
      for (const user of unverifiedUsers) {
        try {
          // Skip if email is invalid
          if (!user.email || typeof user.email !== 'string') {
            results.failed++;
            results.errors.push(`Invalid email for user ${user.id}`);
            console.log(`✗ Skipped user ${user.id} - invalid email`);
            continue;
          }
          
          // Use the user's existing verification token if available, or generate a new one
          let verificationToken = user.email_verification_token;
          if (!verificationToken) {
            verificationToken = generateVerificationToken();
            const expiresAt = createTokenExpiration();
            await storage.updateUser(user.id, {
              email_verification_token: verificationToken,
              email_verification_expires: expiresAt
            });
          }
          
          const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
          
          const emailSent = await sendVerificationReminderEmail(
            user.email,
            user.username,
            verificationUrl
          );
          
          if (emailSent) {
            results.sent++;
            console.log(`✓ Sent verification reminder to ${user.email}`);
          } else {
            results.failed++;
            results.errors.push(`Failed to send email to ${user.email}`);
            console.log(`✗ Failed to send to ${user.email}`);
          }
          
          // Add delay to respect rate limits (2 requests per second = 500ms delay)
          await new Promise(resolve => setTimeout(resolve, 550));
        } catch (error) {
          results.failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Error sending to ${user.email}: ${errorMsg}`);
          console.error(`Error sending verification reminder to ${user.email}:`, error);
          
          // Add delay even on error to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 550));
        }
      }
      
      console.log('=== BATCH SEND COMPLETE ===');
      console.log(`Total: ${results.total}, Sent: ${results.sent}, Failed: ${results.failed}`);
      
      return res.status(200).json({
        message: `Sent ${results.sent} of ${results.total} verification reminder emails`,
        ...results
      });
    } catch (error) {
      console.error("Batch send verification reminders error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send push notification announcement preview email to admin (admin only)
  app.post("/api/admin/preview-push-notification-announcement", isTokenAuthenticated, async (req: any, res) => {
    try {
      console.log('=== PREVIEW PUSH NOTIFICATION ANNOUNCEMENT ===');
      
      // Check if user is admin
      const adminUser = await storage.getUserById(req.userId!);
      if (!adminUser || adminUser.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const baseUrl = req.protocol + '://' + req.get('host');
      
      // Send preview email to admin
      const emailSent = await sendPushNotificationAnnouncementEmail({
        to: 'info@australianjumping.com.au',
        username: adminUser.username,
        helpUrl: `${baseUrl}/help`,
        profileUrl: `${baseUrl}/profile`
      });
      
      if (emailSent) {
        console.log('✓ Preview email sent to admin');
        return res.status(200).json({
          message: 'Preview email sent to info@australianjumping.com.au',
          success: true
        });
      } else {
        console.log('✗ Failed to send preview email');
        return res.status(500).json({
          message: 'Failed to send preview email',
          success: false
        });
      }
    } catch (error) {
      console.error("Preview announcement email error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send push notification announcement to all verified users (admin only)
  app.post("/api/admin/send-push-notification-announcement", isTokenAuthenticated, async (req: any, res) => {
    try {
      console.log('=== BATCH SEND PUSH NOTIFICATION ANNOUNCEMENT ===');
      
      // Check if user is admin
      const adminUser = await storage.getUserById(req.userId!);
      if (!adminUser || adminUser.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get all users
      const allUsers = await storage.getUsers();
      
      // Filter for users who have verified their email
      const verifiedUsers = allUsers.filter(user => user.email_verified);
      
      console.log(`Found ${verifiedUsers.length} verified users to send announcements to`);
      
      const results = {
        total: verifiedUsers.length,
        sent: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      const baseUrl = req.protocol + '://' + req.get('host');
      
      // Send announcement email to each verified user
      for (const user of verifiedUsers) {
        try {
          // Skip if email is invalid
          if (!user.email || typeof user.email !== 'string') {
            results.failed++;
            results.errors.push(`Invalid email for user ${user.id}`);
            console.log(`✗ Skipped user ${user.id} - invalid email`);
            continue;
          }
          
          // Send the announcement email
          const emailSent = await sendPushNotificationAnnouncementEmail({
            to: user.email,
            username: user.username,
            helpUrl: `${baseUrl}/help`,
            profileUrl: `${baseUrl}/profile`
          });
          
          if (emailSent) {
            results.sent++;
            console.log(`✓ Sent announcement to ${user.email}`);
          } else {
            results.failed++;
            results.errors.push(`Failed to send email to ${user.email}`);
            console.log(`✗ Failed to send announcement to ${user.email}`);
          }
          
          // Add delay to respect rate limits (2 requests per second = 500ms delay)
          await new Promise(resolve => setTimeout(resolve, 550));
        } catch (error) {
          results.failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Error sending to ${user.email}: ${errorMsg}`);
          console.error(`Error sending announcement to ${user.email}:`, error);
          
          // Add delay even on error to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 550));
        }
      }
      
      console.log('=== BATCH SEND COMPLETE ===');
      console.log(`Total: ${results.total}, Sent: ${results.sent}, Failed: ${results.failed}`);
      
      return res.status(200).json({
        message: `Sent ${results.sent} of ${results.total} push notification announcements`,
        ...results
      });
    } catch (error) {
      console.error("Batch announcement email error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login Analytics endpoint
  app.get("/api/admin/login-analytics", isTokenAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const currentUser = await storage.getUserById(req.userId);
      if (!currentUser || currentUser.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Fetch login analytics data
      const dau = await storage.getDailyActiveUsers();
      const wau = await storage.getWeeklyActiveUsers();
      const mau = await storage.getMonthlyActiveUsers();
      const loginTrend = await storage.getLoginTrend(30);
      const loginTrendMonthly = await storage.getLoginTrendMonthly(24); // Last 2 years
      const loginTrendAllTime = await storage.getLoginTrendAllTime(); // All historical data by month
      const loginTrendAllTimeDaily = await storage.getLoginTrendAllTimeDaily(); // All historical data by day
      
      // Fetch message analytics data
      const dailyMessages = await storage.getDailyMessages();
      const weeklyMessages = await storage.getWeeklyMessages();
      const monthlyMessages = await storage.getMonthlyMessages();
      const messageTrend = await storage.getMessageTrend(30);
      const messageTrendAllTime = await storage.getMessageTrendAllTime(); // All historical data by day
      
      // Fetch conversation analytics data
      const dailyConversations = await storage.getDailyConversations();
      const weeklyConversations = await storage.getWeeklyConversations();
      const monthlyConversations = await storage.getMonthlyConversations();
      const conversationTrend = await storage.getConversationTrend(30);
      const conversationTrendMonthly = await storage.getConversationTrendMonthly(24); // Last 2 years
      const conversationTrendAllTime = await storage.getConversationTrendAllTime(); // All historical data by month
      const conversationTrendAllTimeDaily = await storage.getConversationTrendAllTimeDaily(); // All historical data by day

      return res.status(200).json({
        dailyActiveUsers: dau,
        weeklyActiveUsers: wau,
        monthlyActiveUsers: mau,
        loginTrend,
        loginTrendMonthly,
        loginTrendAllTime,
        loginTrendAllTimeDaily,
        dailyMessages,
        weeklyMessages,
        monthlyMessages,
        messageTrend,
        messageTrendAllTime,
        dailyConversations,
        weeklyConversations,
        monthlyConversations,
        conversationTrend,
        conversationTrendMonthly,
        conversationTrendAllTime,
        conversationTrendAllTimeDaily
      });
    } catch (error) {
      console.error("Login analytics error:", error);
      return res.status(500).json({ message: "Internal server error" });
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
  app.post("/api/subscription/beta", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
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
      
      // All beta users get the same unified plan with full access
      let updatedUserData: any = {
        stripe_subscription_id: 'beta',
        subscription_status: 'active',
        subscription_plan: 'beta',
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      };

      await storage.updateUser(userId, { is_selling: true, is_searching: true });
      console.log(`Updated user ${userId} with full beta permissions`);
      
      // Update user with beta subscription info
      await storage.updateUserSubscription(userId, updatedUserData);
      
      // Send welcome email now that subscription is complete
      console.log('Sending welcome email after subscription selection...');
      const welcomeEmailSent = await sendWelcomeEmail(user.email, user.username);
      if (!welcomeEmailSent) {
        console.warn('Failed to send welcome email to:', user.email);
      } else {
        console.log('Welcome email sent successfully to:', user.email);
      }
      
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
  app.get("/api/subscription", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
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
  app.post("/api/cancel-subscription", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      
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
        educationLevels,
        countries,
        jumpingLevels,
        dressageLevels,
        eventingLevels,
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
  
  // DISABLED: Dangerous local storage endpoint that caused image persistence issues
  // This endpoint saved files to /uploads/ folder which gets cleared on restart
  // All uploads must now go through Cloudinary endpoints for persistence
  app.post("/api/upload", (req, res) => {
    console.log("❌ BLOCKED: Attempt to use deprecated local upload endpoint");
    res.status(410).json({ 
      error: "This upload endpoint is permanently disabled for data safety",
      message: "Please use /api/upload-image or /api/upload-video for permanent cloud storage",
      reason: "Local uploads were causing image loss on server restarts"
    });
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
  app.post('/api/subscription', isTokenAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Missing required field: planId" });
      }
      
      const userId = req.userId;
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
  app.post('/api/upload-image', isTokenAuthenticated, uploadMemory.single('image'), async (req, res) => {
    try {
      console.log("=== IMAGE UPLOAD START ===");
      console.log("User ID:", req.userId);
      console.log("Request headers:", {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length']
      });
      
      if (!req.file) {
        console.log("Image upload failed - No file provided");
        return res.status(400).json({ message: "No image file provided" });
      }

      console.log("File received:", {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        sizeInMB: (req.file.size / (1024 * 1024)).toFixed(2),
        buffer_length: req.file.buffer?.length
      });

      // Check image file size (5MB limit)
      const maxImageSizeMB = 5;
      const fileSizeMB = req.file.size / (1024 * 1024);
      
      if (fileSizeMB > maxImageSizeMB) {
        console.log(`Image upload failed - File too large: ${fileSizeMB.toFixed(2)}MB > ${maxImageSizeMB}MB`);
        return res.status(400).json({ 
          message: `Image file is too large. Maximum size is ${maxImageSizeMB}MB, but received ${fileSizeMB.toFixed(2)}MB.` 
        });
      }

      // Upload to Cloudinary with 'image' resource type
      console.log("Uploading to Cloudinary as image...");
      const result = await uploadToCloudinary(req.file.buffer, 'horses', 'image');
      console.log("Cloudinary upload successful:", {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type
      });
      
      console.log("=== IMAGE UPLOAD COMPLETE ===");
      res.json({
        url: result.secure_url,
        public_id: result.public_id
      });
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      console.log("=== IMAGE UPLOAD FAILED ===");
      res.status(500).json({ 
        message: "Error uploading image",
        error: error.message 
      });
    }
  });

  // Upload video to Cloudinary
  app.post('/api/upload-video', isTokenAuthenticated, uploadMemory.single('video'), async (req, res) => {
    try {
      console.log("=== VIDEO UPLOAD START ===");
      console.log("User ID:", req.userId);
      console.log("Request headers:", {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length']
      });
      
      if (!req.file) {
        console.log("Video upload failed - No file provided");
        return res.status(400).json({ message: "No video file provided" });
      }

      console.log("Video file received:", {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        sizeInMB: (req.file.size / (1024 * 1024)).toFixed(2),
        buffer_length: req.file.buffer?.length
      });

      // Check file size (500MB limit already enforced by multer)
      const maxSizeMB = 500;
      const fileSizeMB = req.file.size / (1024 * 1024);
      
      if (fileSizeMB > maxSizeMB) {
        console.log(`Video upload failed - File too large: ${fileSizeMB.toFixed(2)}MB > ${maxSizeMB}MB`);
        return res.status(400).json({ 
          message: `Video file is too large. Maximum size is ${maxSizeMB}MB, but received ${fileSizeMB.toFixed(2)}MB.` 
        });
      }

      // Upload to Cloudinary with 'video' resource type
      console.log("Uploading to Cloudinary as video...");
      const result = await uploadToCloudinary(req.file.buffer, 'horses', 'video');
      console.log("Cloudinary video upload successful:", {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        duration: result.duration,
        width: result.width,
        height: result.height
      });
      
      console.log("=== VIDEO UPLOAD COMPLETE ===");
      res.json({
        url: result.secure_url,
        public_id: result.public_id,
        duration: result.duration,
        width: result.width,
        height: result.height
      });
    } catch (error) {
      console.error("Error uploading video to Cloudinary:", error);
      console.log("=== VIDEO UPLOAD FAILED ===");
      res.status(500).json({ 
        message: "Error uploading video",
        error: error.message 
      });
    }
  });

  // Delete image from Cloudinary
  app.delete('/api/delete-image/:public_id', isTokenAuthenticated, async (req, res) => {
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
    const startTime = Date.now();
    
    try {
      
      // Set timeout to prevent hanging requests
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          console.error('Request timeout');
          res.status(408).json({ message: "Request timeout - server overloaded" });
        }
      }, 25000); // 25 second timeout
      
      // Disable caching to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      const userId = req.userId;
      
      if (!userId || isNaN(userId)) {
        clearTimeout(timeout);
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Verify user exists with error handling
      let user;
      try {
        user = await storage.getUserById(userId);
      } catch (dbError) {
        clearTimeout(timeout);
        console.error('Database error during user lookup:', dbError);
        return res.status(500).json({ message: "Database connection error" });
      }
      
      if (!user) {
        clearTimeout(timeout);
        return res.status(401).json({ message: "User not found" });
      }

      // Get conversations where user is either customer or owner
      
      // Test database connection first with timeout
      try {
        const dbHealthPromise = storage.getConversations();
        const dbHealthResult = await Promise.race([
          dbHealthPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database health check timeout')), 10000)
          )
        ]);
      } catch (error) {
        clearTimeout(timeout);
        console.error('Database health check failed:', error);
        return res.status(500).json({ message: "Database connectivity issue" });
      }
      
      let customerConversations = [];
      let ownerConversations = [];
      
      // Fetch customer conversations with error handling and timeout
      try {
        const customerPromise = storage.getConversationsByCustomerId(userId);
        customerConversations = await Promise.race([
          customerPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Customer conversations query timeout')), 8000)
          )
        ]) as any[];
      } catch (error) {
        console.error(`CONVERSATIONS ROUTE: Error getting customer conversations:`, error);
        customerConversations = []; // Continue with empty array
      }
      
      // Fetch owner conversations with error handling and timeout
      try {
        const ownerPromise = storage.getConversationsByOwnerId(userId);
        ownerConversations = await Promise.race([
          ownerPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Owner conversations query timeout')), 8000)
          )
        ]) as any[];
      } catch (error) {
        console.error(`CONVERSATIONS ROUTE: Error getting owner conversations:`, error);
        ownerConversations = []; // Continue with empty array
      }
      
      // Combine and deduplicate conversations
      const allConversations = [...customerConversations, ...ownerConversations];
      const uniqueConversations = allConversations.filter((conv, index, self) => 
        index === self.findIndex((c) => c.id === conv.id)
      );
      
      console.log(`Final conversations for user ${userId}:`, uniqueConversations);
      const conversations = uniqueConversations;

      // Enhance conversations with horse details and other user info with error handling
      let conversationsWithDetails;
      try {
        const enhancementPromises = conversations.map(async (conversation) => {
          try {
            // Get horse details with timeout
            const horsePromise = storage.getHorseById(conversation.horse_id);
            const horse = await Promise.race([
              horsePromise,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Horse query timeout')), 5000)
              )
            ]);
            
            // Get the other user's details (not the current user)
            const otherUserId = conversation.customer_id === userId ? conversation.owner_id : conversation.customer_id;
            const userPromise = storage.getUserById(otherUserId);
            const otherUser = await Promise.race([
              userPromise,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('User query timeout')), 5000)
              )
            ]);
            
            // Calculate per-user unread count
            // Only count messages that the CURRENT user has not read and did not send
            let userUnreadCount = 0;
            try {
              const messages = await storage.getMessagesByConversationId(
                conversation.customer_id, 
                conversation.owner_id, 
                conversation.horse_id
              );
              userUnreadCount = messages.filter(msg => {
                if (msg.is_read) return false;
                // Don't count messages the user sent themselves
                const userSentMessage = 
                  (msg.customer_id === userId && msg.sender_type === "customer") ||
                  (msg.owner_id === userId && msg.sender_type === "owner");
                return !userSentMessage;
              }).length;
            } catch (err) {
              console.error('Error calculating per-user unread count:', err);
              userUnreadCount = 0;
            }
            
            return {
              ...conversation,
              horse: horse || null,
              otherUser: otherUser ? {
                id: otherUser.id,
                username: otherUser.username,
                name: otherUser.name,
                business_name: otherUser.business_name,
                contact_name: otherUser.contact_name,
                is_selling: otherUser.is_selling
              } : null,
              unread_count: userUnreadCount // Override with per-user count
            };
          } catch (enhancementError) {
            console.error(`Error enhancing conversation ${conversation.id}:`, enhancementError);
            // Return basic conversation data if enhancement fails
            return {
              ...conversation,
              horse: null,
              otherUser: null
            };
          }
        });
        
        conversationsWithDetails = await Promise.all(enhancementPromises);
      } catch (error) {
        console.error("Error enhancing conversations:", error);
        // Return basic conversation data if all enhancements fail
        conversationsWithDetails = conversations.map(conv => ({
          ...conv,
          horse: null,
          otherUser: null
        }));
      }
      const duration = Date.now() - startTime;
      res.json(conversationsWithDetails);
      
    } catch (error) {
      console.error("Error fetching conversations:", error);
      const duration = Date.now() - startTime;
      res.status(500).json({ 
        message: "Failed to fetch conversations",
        error: error instanceof Error ? error.message : "Database connection issue"
      });
    }
  });

  // Get messages for a specific conversation
  app.get("/api/conversations/:customerId/:ownerId/:horseId/messages", isTokenAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.userId;
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
    try {
      const userId = req.userId;
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

      const isNewConversation = !conversation;
      let shouldSendNewConversationEmail = false;

      if (!conversation) {
        console.log("Creating new conversation");
        conversation = await storage.createConversation({
          customer_id: parseInt(customer_id),
          owner_id: parseInt(owner_id),
          horse_id: parseInt(horse_id)
        });
        shouldSendNewConversationEmail = true;
      } else {
        // Check if new conversation email was already sent
        shouldSendNewConversationEmail = !conversation.new_conversation_email_sent;
      }

      // Update conversation tracking fields
      const currentUnreadCount = conversation.unread_count || 0;
      const now = new Date();
      const updateData: any = {
        last_message_time: now,
        last_message_id: newMessage.id,
        unread_count: currentUnreadCount + 1
      };

      // Update sender's last message time for tracking response patterns
      if (sender_type === 'customer') {
        updateData.customer_last_message_time = now;
      } else {
        updateData.owner_last_message_time = now;
      }

      // Mark that new conversation email will be sent
      if (shouldSendNewConversationEmail) {
        updateData.new_conversation_email_sent = true;
      }

      await storage.updateConversation(conversation.id, updateData);

      // Send email notification to the recipient
      try {
        const senderId = userId;
        const recipientId = senderId === parseInt(customer_id) ? parseInt(owner_id) : parseInt(customer_id);
        
        // Get sender and recipient information
        const sender = await storage.getUserById(senderId);
        const recipient = await storage.getUserById(recipientId);
        const horse = await storage.getHorseById(parseInt(horse_id));
        
        if (sender && recipient && horse) {
          const isUnsubscribed = await storage.isUserUnsubscribed(recipient.email);
          if (isUnsubscribed) {
            console.log(`Skipping email notification - user ${recipient.email} has unsubscribed`);
          } else {
          console.log(`Sending ${shouldSendNewConversationEmail ? 'NEW CONVERSATION' : 'MESSAGE'} notification to:`, recipient.email);
          const baseUrl = req.protocol + '://' + req.get('host');
          const conversationUrl = `${baseUrl}/messages`;
          
          let emailSent = false;
          
          if (shouldSendNewConversationEmail) {
            // Send new conversation notification
            console.log("🎯 Sending NEW CONVERSATION notification email");
            emailSent = await sendNewConversationNotificationEmail({
              to: recipient.email,
              recipientName: recipient.username || recipient.name || 'User',
              senderName: sender.username || sender.name || 'User',
              horseName: horse.name,
              messageContent: content.trim(),
              conversationUrl: conversationUrl,
              userType: recipientId === parseInt(customer_id) ? 'customer' : 'owner'
            });
          } else {
            // Send regular message notification
            console.log("💬 Sending regular MESSAGE notification email");
            emailSent = await sendMessageNotificationEmail({
              to: recipient.email,
              recipientName: recipient.username || recipient.name || 'User',
              senderName: sender.username || sender.name || 'User',
              horseName: horse.name,
              messageContent: content.trim(),
              conversationUrl: conversationUrl
            });
          }
          
          if (emailSent) {
            console.log(`${shouldSendNewConversationEmail ? 'New conversation' : 'Message'} notification email sent successfully to:`, recipient.email);
          } else {
            console.warn(`Failed to send ${shouldSendNewConversationEmail ? 'new conversation' : 'message'} notification email to:`, recipient.email);
          }
          
          // Send push notification to recipient
          await sendNewMessageNotification(recipientId, sender.username || sender.name || 'Someone', conversation.id);
          } // end unsubscribe check
        } else {
          console.warn("Could not send email notification - missing user or horse data");
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't fail the message creation if email fails
      }

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
      const userId = req.userId;
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
      const userId = req.userId;

      // Get the conversation to verify ownership
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Verify user has access to this conversation
      if (userId !== conversation.customer_id && userId !== conversation.owner_id) {
        return res.status(403).json({ message: "Access denied to this conversation" });
      }

      // Mark all messages in this conversation as read (only those sent TO this user, not BY this user)
      const messages = await storage.getMessagesByConversationId(
        conversation.customer_id,
        conversation.owner_id,
        conversation.horse_id
      );
      
      for (const msg of messages) {
        if (!msg.is_read) {
          // Only mark as read if this user is the recipient (not the sender)
          const userSentMessage = 
            (msg.customer_id === userId && msg.sender_type === "customer") ||
            (msg.owner_id === userId && msg.sender_type === "owner");
          
          if (!userSentMessage) {
            await storage.updateMessage(msg.id, { is_read: true });
          }
        }
      }

      // Also reset the conversation's unread_count field
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
      const userId = req.userId;
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
      const userId = req.userId;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Get all messages for this user and count unread ones
      // Only count messages where the current user is the RECIPIENT, not the sender
      const allMessages = await storage.getMessages();
      const userMessages = allMessages.filter(msg => {
        // User must be part of this conversation
        const isInConversation = msg.customer_id === userId || msg.owner_id === userId;
        if (!isInConversation) return false;
        
        // Message must be unread
        if (msg.is_read) return false;
        
        // Don't count messages the user sent themselves
        // If user is the customer and sender_type is "customer", they sent it
        // If user is the owner and sender_type is "owner", they sent it
        const userSentMessage = 
          (msg.customer_id === userId && msg.sender_type === "customer") ||
          (msg.owner_id === userId && msg.sender_type === "owner");
        
        return !userSentMessage;
      });

      res.json({ count: userMessages.length });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ 
        message: "Failed to get unread count",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ===== SAVED SEARCH ROUTES =====
  
  // Get all saved searches for a user
  app.get("/api/saved-searches", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const savedSearches = await storage.getSavedSearchesByUserId(userId);
      res.json(savedSearches);
    } catch (error: any) {
      console.error("Get saved searches error:", error);
      res.status(500).json({ message: "Failed to fetch saved searches" });
    }
  });

  // Create a new saved search
  app.post("/api/saved-searches", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      
      // Validate the saved search data
      const validatedData = insertSavedSearchSchema.parse({
        ...req.body,
        user_id: userId
      });

      const savedSearch = await storage.createSavedSearch(validatedData);
      res.status(201).json(savedSearch);
    } catch (error: any) {
      console.error("Create saved search error:", error);
      res.status(400).json({ message: error.message || "Invalid saved search data" });
    }
  });

  // Update a saved search
  app.put("/api/saved-searches/:id", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const searchId = parseInt(req.params.id);
      
      // Check if the saved search belongs to the user
      const existingSearch = await storage.getSavedSearchById(searchId);
      if (!existingSearch || existingSearch.user_id !== userId) {
        return res.status(404).json({ message: "Saved search not found" });
      }

      // Validate the update data (exclude user_id from updates)
      const validatedData = insertSavedSearchSchema.partial().parse(req.body);
      
      const updatedSearch = await storage.updateSavedSearch(searchId, validatedData);
      res.json(updatedSearch);
    } catch (error: any) {
      console.error("Update saved search error:", error);
      res.status(400).json({ message: error.message || "Invalid saved search data" });
    }
  });

  // Delete a saved search
  app.delete("/api/saved-searches/:id", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const searchId = parseInt(req.params.id);
      
      // Check if the saved search belongs to the user
      const existingSearch = await storage.getSavedSearchById(searchId);
      if (!existingSearch || existingSearch.user_id !== userId) {
        return res.status(404).json({ message: "Saved search not found" });
      }

      await storage.deleteSavedSearch(searchId);
      res.json({ message: "Saved search deleted successfully" });
    } catch (error: any) {
      console.error("Delete saved search error:", error);
      res.status(500).json({ message: "Failed to delete saved search" });
    }
  });

  // Function to check saved searches against new horses and send notifications
  async function checkSavedSearchesForNewHorse(newHorse: any) {
    try {
      console.log(`Checking saved searches for new horse: ${newHorse.name}`);
      
      // Get all active saved searches with email notifications enabled
      const allSearches = await storage.getSavedSearches();
      const activeSearches = allSearches.filter(search => 
        search.is_active && search.email_notifications
      );

      console.log(`Found ${activeSearches.length} active saved searches to check`);

      for (const search of activeSearches) {
        if (await doesHorseMatchSearch(newHorse, search)) {
          console.log(`Horse ${newHorse.name} matches saved search: ${search.name}`);
          
          // Check if we've already sent a notification for this combination
          const existingNotifications = await storage.getNotificationsBySearchId(search.id);
          const alreadyNotified = existingNotifications.some(notif => notif.horse_id === newHorse.id);
          
          if (!alreadyNotified) {
            // Get user details for email
            const user = await storage.getUserById(search.user_id);
            if (user && user.email_verified) {
              await sendSearchMatchEmail(user, search, newHorse);
              
              // Send push notification for new match
              await sendNewMatchNotification(user.id, newHorse.name, newHorse.id);
              
              // Record the notification
              await storage.createSearchNotification({
                saved_search_id: search.id,
                horse_id: newHorse.id
              });
              
              console.log(`Sent email notification to ${user.email} for horse ${newHorse.name}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking saved searches for new horse:", error);
    }
  }

  // Function to check if a horse matches a saved search
  async function doesHorseMatchSearch(horse: any, search: SavedSearch): Promise<boolean> {
    console.log(`=== MATCHING HORSE ${horse.name} vs SEARCH ${search.name} (ID: ${search.id}) ===`);
    
    // Check disciplines
    if (search.disciplines && search.disciplines.length > 0) {
      const hasMatchingDiscipline = search.disciplines.some(d => 
        horse.disciplines && horse.disciplines.includes(d)
      );
      if (!hasMatchingDiscipline) {
        console.log(`  FAIL: Discipline mismatch - search: ${search.disciplines}, horse: ${horse.disciplines}`);
        return false;
      }
    }

    // Check levels
    if (search.levels && search.levels.length > 0) {
      const hasMatchingLevel = search.levels.some(l => 
        horse.levels && horse.levels.includes(l)
      );
      if (!hasMatchingLevel) return false;
    }

    // Check breeds
    if (search.breeds && search.breeds.length > 0) {
      const hasMatchingBreed = search.breeds.some(b => 
        horse.breeds && horse.breeds.includes(b)
      );
      if (!hasMatchingBreed) return false;
    }

    // Check age range
    if (search.age_min && horse.age < search.age_min) return false;
    if (search.age_max && horse.age > search.age_max) return false;

    // Check height range (convert to consistent units)
    if (search.height_min && horse.height_hands && horse.height_hands < search.height_min) return false;
    if (search.height_max && horse.height_hands && horse.height_hands > search.height_max) return false;

    // Check sexes
    if (search.sexes && search.sexes.length > 0) {
      if (!search.sexes.includes(horse.sex)) return false;
    }

    // Check characteristics
    if (search.characteristics && search.characteristics.length > 0) {
      const hasMatchingCharacteristic = search.characteristics.some(c => 
        horse.characteristics && horse.characteristics.includes(c)
      );
      if (!hasMatchingCharacteristic) return false;
    }

    // Check price range
    console.log(`  Price check - search: ${search.price_min}-${search.price_max}, horse: ${horse.price_min}-${horse.price_max}`);
    if (search.price_min && horse.price_min < search.price_min) {
      console.log(`  FAIL: Horse price ${horse.price_min} below search min ${search.price_min}`);
      return false;
    }
    if (search.price_max && horse.price_min > search.price_max) {
      console.log(`  FAIL: Horse price ${horse.price_min} above search max ${search.price_max}`);
      return false;
    }

    // Check currency
    if (search.currency && horse.currency !== search.currency) return false;

    // Check location
    if (search.location_country && horse.location_country !== search.location_country) return false;

    // Check bloodlines - sire matching (case-insensitive partial match)
    if (search.sire && search.sire.trim()) {
      const searchSire = search.sire.trim().toLowerCase();
      const horseSire = horse.sire ? horse.sire.toLowerCase() : '';
      if (!horseSire.includes(searchSire)) return false;
    }

    // Check bloodlines - dam sire matching (case-insensitive partial match)
    if (search.dam_sire && search.dam_sire.trim()) {
      const searchDamSire = search.dam_sire.trim().toLowerCase();
      const horseDamSire = horse.dam_sire ? horse.dam_sire.toLowerCase() : '';
      if (!horseDamSire.includes(searchDamSire)) return false;
    }

    console.log(`  SUCCESS: Horse ${horse.name} matches search ${search.name}`);
    return true;
  }

  // Function to send email notification for search match
  async function sendSearchMatchEmail(user: any, search: SavedSearch, horse: any) {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.log("RESEND_API_KEY not configured, skipping email notification");
        return;
      }

      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const subject = `New Horse Match: ${horse.name}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2b2b2b; color: white; padding: 20px; text-align: center;">
            <h1>ProHorseMatch</h1>
            <h2>New Horse Match Found!</h2>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear ${user.name || user.username},</p>
            
            <p>Great news! We found a horse that matches your saved search "<strong>${search.name}</strong>":</p>
            
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h3 style="color: #8B4513;">${horse.name}</h3>
              <p><strong>Age:</strong> ${horse.age} years old</p>
              <p><strong>Sex:</strong> ${horse.sex}</p>
              <p><strong>Disciplines:</strong> ${horse.disciplines?.join(', ') || 'Not specified'}</p>
              <p><strong>Levels:</strong> ${horse.levels?.join(', ') || 'Not specified'}</p>
              <p><strong>Breeds:</strong> ${horse.breeds?.join(', ') || 'Not specified'}</p>
              <p><strong>Height:</strong> ${horse.height_hands ? `${horse.height_hands}hh` : 'Not specified'}</p>
              <p><strong>Location:</strong> ${horse.location_country}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="https://pro-horse-match-info6446.replit.app/horse/${horse.id}" 
                 style="background-color: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Horse Details
              </a>
            </p>
            
            <p>Best regards,<br>The ProHorseMatch Team</p>
            
            <hr style="margin-top: 30px;">
            <p style="font-size: 12px; color: #666;">
              You received this email because you have an active saved search with email notifications enabled. 
              You can manage your saved searches in your profile settings.
            </p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'ProHorseMatch <notifications@prohorsematch.com>',
        to: user.email,
        subject: subject,
        html: html,
      });

    } catch (error) {
      console.error('Error sending search match email:', error);
    }
  }

  // Admin middleware - restrict access to specific email
  const isAdmin = async (req: any, res: Response, next: any) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(req.userId);
      if (!user || user.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required for user deletion" });
      }

      next();
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  // Admin Analytics Routes
  app.get("/api/admin/analytics", isTokenAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get user statistics
      const allUsers = await storage.getAllUsers();
      const totalUsers = allUsers.length;
      const activeSubscribers = allUsers.filter(user => user.subscription_status === 'active').length;
      const sellers = allUsers.filter(user => user.is_selling).length;
      const searchers = allUsers.filter(user => user.is_searching).length;

      // Get horse statistics
      const allHorses = await storage.getAllHorses();
      const totalHorses = allHorses.length;
      
      // Horse breakdown by discipline
      const disciplineStats = {};
      allHorses.forEach(horse => {
        if (horse.disciplines && horse.disciplines.length > 0) {
          horse.disciplines.forEach(discipline => {
            disciplineStats[discipline] = (disciplineStats[discipline] || 0) + 1;
          });
        }
      });

      // Horse breakdown by country
      const countryStats = {};
      allHorses.forEach(horse => {
        if (horse.location_country) {
          countryStats[horse.location_country] = (countryStats[horse.location_country] || 0) + 1;
        }
      });

      // Get messaging statistics
      const allMessages = await storage.getAllMessages();
      const totalMessages = allMessages.length;

      const allConversations = await storage.getAllConversations();
      const totalConversations = allConversations.length;

      // Get matches/likes statistics
      const allMatches = await storage.getAllMatches();
      const totalMatches = allMatches.length;
      const totalLikes = allMatches.filter(match => match.is_liked).length;

      // Get saved searches statistics
      const allSavedSearches = await storage.getSavedSearches();
      const totalSavedSearches = allSavedSearches.filter(search => search.is_active).length;

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUsers = allUsers.filter(user => 
        user.created_at && new Date(user.created_at) > thirtyDaysAgo
      ).length;

      const recentHorses = allHorses.filter(horse => 
        horse.created_at && new Date(horse.created_at) > thirtyDaysAgo
      ).length;

      // Get push notification statistics
      const allPushSubscriptions = await storage.getAllPushSubscriptions();
      const usersWithPushEnabled = new Set(allPushSubscriptions.map(sub => sub.user_id)).size;
      const usersWithoutPushEnabled = totalUsers - usersWithPushEnabled;

      // Subscription breakdown
      const nonSubscribers = totalUsers - activeSubscribers;

      res.json({
        users: {
          total: totalUsers,
          activeSubscribers,
          nonSubscribers,
          sellers,
          searchers,
          recentRegistrations: recentUsers
        },
        horses: {
          total: totalHorses,
          recentListings: recentHorses,
          byDiscipline: disciplineStats,
          byCountry: countryStats
        },
        engagement: {
          totalMessages,
          totalConversations,
          totalMatches,
          totalLikes,
          totalSavedSearches
        },
        growth: {
          usersLast30Days: recentUsers,
          horsesLast30Days: recentHorses
        },
        notifications: {
          usersWithPushEnabled,
          usersWithoutPushEnabled
        }
      });
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin Users List
  app.get("/api/admin/users", isTokenAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersList = users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        business_name: user.business_name,
        is_selling: user.is_selling,
        is_searching: user.is_searching,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        created_at: user.created_at,
        email_verified: user.email_verified
      }));
      
      res.json(usersList);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin Revenue Analytics
  app.get("/api/admin/revenue", isTokenAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const subscribers = users.filter(user => user.subscription_status === 'active');
      
      // Calculate revenue based on subscription plans
      let monthlyRevenue = 0;
      const planRevenue = {
        'beta-seller': 0,
        'beta-searching': 0,
        'searching': 0,
        'professional': 0,
        'elite': 0
      };

      subscribers.forEach(user => {
        // Note: This is estimated revenue based on plan types
        // You would integrate with Stripe for actual revenue data
        switch (user.subscription_plan) {
          case 'beta-seller':
          case 'beta-searching':
            // Beta plans might be free or discounted
            planRevenue[user.subscription_plan] += 0;
            break;
          case 'searching':
            planRevenue['searching'] += 19; // Searching plan price
            monthlyRevenue += 19;
            break;
          case 'professional':
            planRevenue['professional'] += 39; // Professional plan price
            monthlyRevenue += 39;
            break;
          case 'elite':
            planRevenue['elite'] += 59; // Elite plan price
            monthlyRevenue += 59;
            break;
        }
      });

      res.json({
        monthlyRevenue,
        subscriberCount: subscribers.length,
        planBreakdown: planRevenue,
        averageRevenuePerUser: subscribers.length > 0 ? monthlyRevenue / subscribers.length : 0
      });
    } catch (error) {
      console.error("Admin revenue error:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  // Admin Delete User
  app.delete("/api/admin/users/:id", isTokenAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Prevent admin from deleting themselves
      if (req.userId === userId) {
        return res.status(400).json({ message: "Cannot delete your own admin account" });
      }

      // Get user details before deletion for logging
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Admin deleting user: ${user.email} (ID: ${userId})`);

      // Delete the user and all related data
      const success = await storage.deleteUser(userId);

      if (success) {
        console.log(`Successfully deleted user: ${user.email} (ID: ${userId})`);
        return res.json({ 
          message: `Successfully deleted user ${user.email}`,
          deletedUser: {
            id: userId,
            email: user.email,
            username: user.username
          }
        });
      } else {
        console.log(`Failed to delete user: ${user.email} (ID: ${userId})`);
        return res.status(500).json({ message: "Failed to delete user" });
      }
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin Update User Email
  app.patch("/api/admin/users/:userId/password", isTokenAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { password } = req.body;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Admin updating password for user ${userId} (${user.email})`);

      const hashedPassword = await bcrypt.hash(password, saltRounds);
      await storage.updateUser(userId, { password: hashedPassword });

      console.log(`Successfully updated password for user ${userId}`);
      return res.json({ message: `Successfully updated password for ${user.username || user.email}` });
    } catch (error) {
      console.error("Admin update user password error:", error);
      res.status(500).json({ message: "Failed to update user password" });
    }
  });

  app.patch("/api/admin/users/:userId/email", isTokenAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { email } = req.body;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email address is required" });
      }

      // Get user to check if it exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the new email is already in use by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email address is already in use by another user" });
      }

      console.log(`Admin updating user ${userId} email from ${user.email} to ${email}`);

      // Update the user's email
      const success = await storage.updateUser(userId, { email });

      if (success) {
        console.log(`Successfully updated user ${userId} email to ${email}`);
        return res.json({ 
          message: `Successfully updated email for user ${user.username || 'Unknown'}`,
          updatedUser: {
            id: userId,
            email: email,
            username: user.username
          }
        });
      } else {
        console.log(`Failed to update user ${userId} email`);
        return res.status(500).json({ message: "Failed to update user email" });
      }
    } catch (error) {
      console.error("Admin update user email error:", error);
      res.status(500).json({ message: "Failed to update user email" });
    }
  });

  // =============================================================================
  // HORSE DELETION QUESTIONNAIRE AND ANALYTICS ENDPOINTS
  // =============================================================================

  // Admin endpoint to get all horse deletion responses
  app.get("/api/admin/horse-deletion-responses", isTokenAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUserById(req.userId);
      if (!user || user.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const responses = await storage.getHorseDeletionResponses();
      return res.json(responses);
    } catch (error) {
      console.error("Admin get deletion responses error:", error);
      return res.status(500).json({ message: "Failed to get deletion responses" });
    }
  });

  // Admin endpoint to get horse deletion analytics
  app.get("/api/admin/horse-deletion-analytics", isTokenAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUserById(req.userId);
      if (!user || user.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const responses = await storage.getHorseDeletionResponses();
      
      // Calculate analytics
      const analytics = {
        totalDeletions: responses.length,
        soldThroughApp: responses.filter(r => r.sold_through_app).length,
        soldElsewhere: responses.filter(r => r.sold_elsewhere).length,
        unsold: responses.filter(r => r.unsold).length,
        responsesByMonth: {},
        responsesByUser: {}
      };

      // Group by month
      responses.forEach(response => {
        const month = response.created_at.toISOString().substring(0, 7); // YYYY-MM
        if (!analytics.responsesByMonth[month]) {
          analytics.responsesByMonth[month] = {
            total: 0,
            soldThroughApp: 0,
            soldElsewhere: 0,
            unsold: 0
          };
        }
        analytics.responsesByMonth[month].total++;
        if (response.sold_through_app) analytics.responsesByMonth[month].soldThroughApp++;
        if (response.sold_elsewhere) analytics.responsesByMonth[month].soldElsewhere++;
        if (response.unsold) analytics.responsesByMonth[month].unsold++;
      });

      // Group by user
      responses.forEach(response => {
        const userId = response.user_id;
        if (!analytics.responsesByUser[userId]) {
          analytics.responsesByUser[userId] = {
            total: 0,
            soldThroughApp: 0,
            soldElsewhere: 0,
            unsold: 0
          };
        }
        analytics.responsesByUser[userId].total++;
        if (response.sold_through_app) analytics.responsesByUser[userId].soldThroughApp++;
        if (response.sold_elsewhere) analytics.responsesByUser[userId].soldElsewhere++;
        if (response.unsold) analytics.responsesByUser[userId].unsold++;
      });

      return res.json(analytics);
    } catch (error) {
      console.error("Admin get deletion analytics error:", error);
      return res.status(500).json({ message: "Failed to get deletion analytics" });
    }
  });

  // Test endpoint to verify horse listing notifications
  app.post("/api/test/horse-notification", async (req, res) => {
    try {
      console.log("Testing horse listing notification...");
      const baseUrl = 'https://pro-horse-match-info6446.replit.app';
      
      const testNotification = await sendHorseListingNotification({
        to: 'info@australianjumping.com.au',
        horseName: 'Test Notification Horse',
        ownerName: 'Test Owner',
        ownerEmail: 'test@example.com',
        price: '50000 - 60000',
        currency: 'AUD',
        location: 'Australia',
        disciplines: ['Jumping', 'Eventing'],
        horseUrl: `${baseUrl}/horse/999`
      });
      
      if (testNotification) {
        return res.json({ 
          message: 'Horse listing notification sent successfully!',
          recipient: 'info@australianjumping.com.au'
        });
      } else {
        return res.status(500).json({ 
          message: 'Failed to send horse listing notification'
        });
      }
    } catch (error) {
      console.error("Test horse notification error:", error);
      return res.status(500).json({ 
        message: "Failed to send test notification",
        error: error.toString()
      });
    }
  });

  // Conversation reminder system endpoint
  app.post("/api/reminders/check-conversations", async (req, res) => {
    try {
      console.log("=== CONVERSATION REMINDER CHECK STARTED ===");
      
      // Get all conversations
      const allConversations = await storage.getConversations();
      console.log(`Found ${allConversations.length} total conversations to check`);
      
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      let remindersSent = 0;
      let conversationsChecked = 0;
      const results = [];
      
      for (const conversation of allConversations) {
        conversationsChecked++;
        
        // Skip if no last message time
        if (!conversation.last_message_time) {
          console.log(`Skipping conversation ${conversation.id} - no last message time`);
          continue;
        }
        
        const lastMessageTime = new Date(conversation.last_message_time);
        const daysSinceLastMessage = Math.floor((Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60 * 24));
        
        // Skip if less than 2 days
        if (daysSinceLastMessage < 2) {
          continue;
        }
        
        // Skip if reminder was already sent today
        if (conversation.last_reminder_sent) {
          const lastReminderTime = new Date(conversation.last_reminder_sent);
          const daysSinceReminder = Math.floor((Date.now() - lastReminderTime.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceReminder < 1) {
            console.log(`Skipping conversation ${conversation.id} - reminder already sent today`);
            continue;
          }
        }
        
        // Check if conversation has unread messages (indication that someone needs to respond)
        if (!conversation.unread_count || conversation.unread_count === 0) {
          console.log(`Skipping conversation ${conversation.id} - no unread messages`);
          continue;
        }
        
        try {
          // Get conversation participants and horse details
          const customer = await storage.getUserById(conversation.customer_id);
          const owner = await storage.getUserById(conversation.owner_id);
          const horse = await storage.getHorseById(conversation.horse_id);
          
          if (!customer || !owner || !horse) {
            console.warn(`Missing data for conversation ${conversation.id} - skipping`);
            continue;
          }
          
          // Determine who should receive the reminder based on message pattern
          let recipientId = null;
          let senderId = null;
          let recipientUserType: 'customer' | 'owner' = 'customer';
          
          // Logic: Send reminder to whoever didn't send the last message
          const messages = await storage.getMessagesByConversationId(
            conversation.customer_id, 
            conversation.owner_id, 
            conversation.horse_id
          );
          
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            
            // If customer sent last message, remind owner; if owner sent last message, remind customer
            if (lastMessage.sender_type === 'customer') {
              recipientId = conversation.owner_id;
              senderId = conversation.customer_id;
              recipientUserType = 'owner';
            } else {
              recipientId = conversation.customer_id;
              senderId = conversation.owner_id;
              recipientUserType = 'customer';
            }
          } else {
            console.warn(`No messages found for conversation ${conversation.id} - skipping`);
            continue;
          }
          
          const recipient = recipientId === conversation.customer_id ? customer : owner;
          const sender = senderId === conversation.customer_id ? customer : owner;
          
          console.log(`📧 Sending reminder for conversation ${conversation.id}: ${sender.username} → ${recipient.username} about ${horse.name} (${daysSinceLastMessage} days ago)`);
          
          const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://pro-horse-match-info6446.replit.app' 
            : 'http://localhost:5000';
          const conversationUrl = `${baseUrl}/messages`;
          
          // Send reminder email
          const emailSent = await sendConversationReminderEmail({
            to: recipient.email,
            recipientName: recipient.username || recipient.name || 'User',
            senderName: sender.username || sender.name || 'User',
            horseName: horse.name,
            conversationUrl: conversationUrl,
            daysSinceLastMessage: daysSinceLastMessage,
            userType: recipientUserType
          });
          
          if (emailSent) {
            // Update conversation with reminder sent time
            await storage.updateConversation(conversation.id, {
              last_reminder_sent: new Date()
            });
            
            remindersSent++;
            results.push({
              conversationId: conversation.id,
              recipient: recipient.email,
              horseName: horse.name,
              daysSinceLastMessage: daysSinceLastMessage,
              status: 'sent'
            });
            
            console.log(`✅ Reminder sent successfully for conversation ${conversation.id}`);
          } else {
            console.error(`❌ Failed to send reminder for conversation ${conversation.id}`);
            results.push({
              conversationId: conversation.id,
              recipient: recipient.email,
              horseName: horse.name,
              daysSinceLastMessage: daysSinceLastMessage,
              status: 'failed'
            });
          }
          
        } catch (conversationError) {
          console.error(`Error processing conversation ${conversation.id}:`, conversationError);
          results.push({
            conversationId: conversation.id,
            status: 'error',
            error: conversationError instanceof Error ? conversationError.message : "Unknown error"
          });
        }
      }
      
      console.log(`=== REMINDER CHECK COMPLETED ===`);
      console.log(`Conversations checked: ${conversationsChecked}`);
      console.log(`Reminders sent: ${remindersSent}`);
      
      return res.json({
        message: 'Conversation reminder check completed',
        conversationsChecked: conversationsChecked,
        remindersSent: remindersSent,
        results: results
      });
      
    } catch (error) {
      console.error("Conversation reminder check error:", error);
      return res.status(500).json({ 
        message: 'Error checking conversation reminders',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Test endpoint for conversation reminders
  app.post("/api/test/conversation-reminder", async (req, res) => {
    try {
      console.log("Testing conversation reminder notification...");
      const baseUrl = req.protocol + '://' + req.get('host');
      
      const testReminder = await sendConversationReminderEmail({
        to: 'info@australianjumping.com.au',
        recipientName: 'Test Recipient',
        senderName: 'Test Sender',
        horseName: 'Test Horse',
        conversationUrl: `${baseUrl}/messages`,
        daysSinceLastMessage: 3,
        userType: 'owner'
      });
      
      if (testReminder) {
        return res.json({ 
          message: 'Conversation reminder notification sent successfully!',
          recipient: 'info@australianjumping.com.au'
        });
      } else {
        return res.status(500).json({ 
          message: 'Failed to send conversation reminder notification'
        });
      }
    } catch (error) {
      console.error("Test conversation reminder error:", error);
      return res.status(500).json({ 
        message: 'Error sending test reminder',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ========== SERVICE WORKER ROUTE ==========
  // Serve service worker file explicitly before Vite can catch it
  app.get("/service-worker.js", async (_req, res) => {
    const fs = await import("fs");
    const path = await import("path");
    const serviceWorkerPath = path.resolve(import.meta.dirname, "..", "public", "service-worker.js");
    
    try {
      const content = await fs.promises.readFile(serviceWorkerPath, "utf-8");
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Service-Worker-Allowed", "/");
      res.send(content);
    } catch (error) {
      console.error("Error serving service worker:", error);
      res.status(404).send("Service worker not found");
    }
  });

  // ========== WEB PUSH NOTIFICATION ROUTES ==========
  
  // Get VAPID public key (public endpoint, no auth required)
  app.get("/api/push/vapid-public-key", async (_req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({ error: "VAPID public key not configured" });
    }
    res.json({ publicKey });
  });
  
  // Subscribe to push notifications
  app.post("/api/push/subscribe", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const subscription = req.body;
      
      // Validate subscription object
      const validatedSubscription = insertPushSubscriptionSchema.parse({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      });
      
      // Store subscription in database
      await storage.createPushSubscription(validatedSubscription);
      
      console.log(`Push subscription created for user ${userId}`);
      return res.status(201).json({ message: "Subscribed to push notifications" });
    } catch (error) {
      console.error("Push subscribe error:", error);
      return res.status(500).json({ 
        message: "Error subscribing to push notifications",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Unsubscribe from push notifications
  app.post("/api/push/unsubscribe", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ message: "Endpoint is required" });
      }
      
      await storage.deletePushSubscription(endpoint);
      
      console.log(`Push subscription deleted for user ${userId}`);
      return res.json({ message: "Unsubscribed from push notifications" });
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      return res.status(500).json({ 
        message: "Error unsubscribing from push notifications",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get user's push subscription status
  app.get("/api/push/status", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const subscriptions = await storage.getPushSubscriptionsByUserId(userId);
      
      const preferences = subscriptions[0] ? {
        notify_matches: subscriptions[0].notify_matches ?? true,
        notify_messages: subscriptions[0].notify_messages ?? true,
        notify_updates: subscriptions[0].notify_updates ?? true,
        notify_digest: subscriptions[0].notify_digest ?? true
      } : undefined;
      
      return res.json({ 
        subscribed: subscriptions.length > 0,
        count: subscriptions.length,
        preferences
      });
    } catch (error) {
      console.error("Push status error:", error);
      return res.status(500).json({ 
        message: "Error getting push subscription status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Update notification preferences
  app.post("/api/push/preferences", isTokenAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const preferences = req.body;
      
      await storage.updatePushPreferences(userId, preferences);
      
      return res.json({ message: "Preferences updated successfully" });
    } catch (error) {
      console.error("Push preferences error:", error);
      return res.status(500).json({ 
        message: "Error updating notification preferences",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin: Send test notification to specific user
  app.post("/api/admin/test-notification", isTokenAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const adminUser = await storage.getUserById(req.userId!);
      if (!adminUser || adminUser.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId, title, body } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get user's push subscriptions
      const subscriptions = await storage.getPushSubscriptionsByUserId(userId);
      
      if (subscriptions.length === 0) {
        return res.status(404).json({ 
          message: "No push subscriptions found for this user",
          hint: "User needs to enable notifications first"
        });
      }

      // Send test notification using the push notification system
      const { sendPushNotification } = await import('./pushNotifications');
      await sendPushNotification(userId, {
        title: title || '🔔 Test Notification',
        body: body || 'This is a test notification from ProHorseMatch admin panel. Your push notifications are working correctly!',
        url: '/',
        tag: 'test-notification'
      }, 'messages'); // Use 'messages' type to ensure it's sent

      return res.json({ 
        message: "Test notification sent successfully",
        subscriptions: subscriptions.length,
        userId: userId
      });
    } catch (error) {
      console.error("Test notification error:", error);
      return res.status(500).json({ 
        message: "Error sending test notification",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin: Get push subscription status for all users
  app.get("/api/admin/push-subscriptions", isTokenAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const adminUser = await storage.getUserById(req.userId!);
      if (!adminUser || adminUser.email !== 'info@australianjumping.com.au') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allUsers = await storage.getUsers();
      const userSubscriptionStatus = await Promise.all(
        allUsers.map(async (user) => {
          const subscriptions = await storage.getPushSubscriptionsByUserId(user.id);
          return {
            userId: user.id,
            email: user.email,
            username: user.username,
            subscriptionCount: subscriptions.length,
            hasNotifications: subscriptions.length > 0,
            preferences: subscriptions[0] ? {
              notify_matches: subscriptions[0].notify_matches,
              notify_messages: subscriptions[0].notify_messages,
              notify_updates: subscriptions[0].notify_updates,
              notify_digest: subscriptions[0].notify_digest
            } : null
          };
        })
      );

      // Sort by subscription status (users with subscriptions first)
      userSubscriptionStatus.sort((a, b) => {
        if (a.hasNotifications === b.hasNotifications) return 0;
        return a.hasNotifications ? -1 : 1;
      });

      return res.json({ 
        users: userSubscriptionStatus,
        totalUsers: allUsers.length,
        usersWithNotifications: userSubscriptionStatus.filter(u => u.hasNotifications).length
      });
    } catch (error) {
      console.error("Get push subscriptions error:", error);
      return res.status(500).json({ 
        message: "Error getting push subscriptions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
