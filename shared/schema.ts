import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Unified User Model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  username: text("username").notNull().unique(),
  name: text("name"),
  business_name: text("business_name"),
  contact_name: text("contact_name"),
  
  // Roles - can be both
  is_searching: boolean("is_searching").default(false),
  is_selling: boolean("is_selling").default(false),
  
  // For searching role (previously customer)
  location_country: text("location_country"),
  location_radius_km: integer("location_radius_km"),
  preferred_disciplines: text("preferred_disciplines").array(),
  preferred_levels: text("preferred_levels").array(),
  preferred_breeds: text("preferred_breeds").array(),
  age_range_min: integer("age_range_min"),
  age_range_max: integer("age_range_max"),
  height_range_min: real("height_range_min"),
  height_range_max: real("height_range_max"),
  preferred_sexes: text("preferred_sexes").array(),
  breeding_preferences: text("breeding_preferences"),
  preferred_characteristics: text("preferred_characteristics").array(),
  price_range_min: integer("price_range_min"),
  price_range_max: integer("price_range_max"),
  currency: text("currency"),
  
  // Email verification fields
  email_verified: boolean("email_verified").default(false),
  verification_token: text("verification_token"),
  verification_token_expires: timestamp("verification_token_expires"),
  
  // Subscription fields
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  subscription_status: text("subscription_status"),
  subscription_plan: text("subscription_plan"),
  subscription_end_date: timestamp("subscription_end_date"),
  subscription_reminder_sent_at: timestamp("subscription_reminder_sent_at"),
  
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

// For backward compatibility - schema for searching role registration
export const insertSearchingUserSchema = insertUserSchema.omit({
  business_name: true,
  contact_name: true,
  name: true,
}).extend({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).max(20, { message: "Username must be at most 20 characters" }),
  is_searching: z.literal(true).default(true),
});

// For backward compatibility - schema for selling role registration 
export const insertSellingUserSchema = insertUserSchema.omit({
  name: true,
}).extend({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).max(20, { message: "Username must be at most 20 characters" }),
  business_name: z.string().min(2, { message: "Business name must be at least 2 characters" }),
  contact_name: z.string().min(2, { message: "Contact name must be at least 2 characters" }),
  is_selling: z.literal(true).default(true),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSearchingUser = z.infer<typeof insertSearchingUserSchema>;
export type InsertSellingUser = z.infer<typeof insertSellingUserSchema>;
export type User = typeof users.$inferSelect;

// Legacy types for backward compatibility
export type InsertOwner = InsertSellingUser;
export type Owner = User;
export type InsertCustomer = InsertSearchingUser;
export type Customer = User;

// Horse Model
export const horses = pgTable("horses", {
  id: serial("id").primaryKey(),
  owner_id: integer("owner_id").notNull(),
  name: text("name").notNull(),
  location_country: text("location_country").notNull(),
  location_radius_km: integer("location_radius_km"),
  disciplines: text("disciplines").array().notNull(),
  levels: text("levels").array().notNull(),
  breeds: text("breeds").array().notNull(),
  age: integer("age").notNull(),
  height_hands: real("height_hands"),
  height_cm: integer("height_cm"),
  sex: text("sex").notNull(),
  colour: text("colour").notNull(),
  sire: text("sire"),
  dam: text("dam"),
  dam_sire: text("dam_sire"),
  characteristics: text("characteristics").array(),
  education_level: text("education_level"),
  price_min: integer("price_min").notNull(),
  price_max: integer("price_max").notNull(),
  currency: text("currency").notNull(),
  description: text("description"),
  additional_info: text("additional_info"),
  photos: text("photos").array().notNull(),
  videos: text("videos").array(),
  social_media_promotion: boolean("social_media_promotion").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertHorseSchema = createInsertSchema(horses).omit({
  id: true,
  created_at: true,
}).extend({
  height_hands: z.union([
    z.number().nullable(),
    z.literal("young_horse")
  ]).optional(),
});

export type InsertHorse = z.infer<typeof insertHorseSchema>;
export type Horse = typeof horses.$inferSelect;

// Match model
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull(),
  horse_id: integer("horse_id").notNull(),
  is_liked: boolean("is_liked").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  created_at: true,
});

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull(),
  owner_id: integer("owner_id").notNull(),
  horse_id: integer("horse_id").notNull(),
  content: text("content").notNull(),
  sender_type: text("sender_type").notNull(), // "customer" or "owner"
  created_at: timestamp("created_at").defaultNow(),
  is_read: boolean("is_read").default(false),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  created_at: true,
  is_read: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Conversation (for listing unique conversations)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull(),
  owner_id: integer("owner_id").notNull(),
  horse_id: integer("horse_id").notNull(),
  last_message_id: integer("last_message_id"),
  last_message_time: timestamp("last_message_time"),
  unread_count: integer("unread_count").default(0),
  // Email notification tracking
  new_conversation_email_sent: boolean("new_conversation_email_sent").default(false),
  last_reminder_sent: timestamp("last_reminder_sent"),
  customer_last_message_time: timestamp("customer_last_message_time"),
  owner_last_message_time: timestamp("owner_last_message_time"),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  last_message_id: true,
  last_message_time: true,
  unread_count: true,
  new_conversation_email_sent: true,
  last_reminder_sent: true,
  customer_last_message_time: true,
  owner_last_message_time: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Saved Search model - replaces horse preferences
export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  name: text("name").notNull(), // User-defined name for the search
  disciplines: text("disciplines").array(),
  levels: text("levels").array(),
  breeds: text("breeds").array(),
  age_min: integer("age_min"),
  age_max: integer("age_max"),
  height_min: real("height_min"),
  height_max: real("height_max"),
  sexes: text("sexes").array(),
  characteristics: text("characteristics").array(),
  price_min: integer("price_min"),
  price_max: integer("price_max"),
  currency: text("currency"),
  location_country: text("location_country"),
  location_radius_km: integer("location_radius_km"),
  sire: text("sire"),
  dam_sire: text("dam_sire"),
  email_notifications: boolean("email_notifications").default(true),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;
export type SavedSearch = typeof savedSearches.$inferSelect;

// Search notifications tracking - to prevent duplicate emails
export const searchNotifications = pgTable("search_notifications", {
  id: serial("id").primaryKey(),
  saved_search_id: integer("saved_search_id").notNull(),
  horse_id: integer("horse_id").notNull(),
  sent_at: timestamp("sent_at").defaultNow(),
});

export const insertSearchNotificationSchema = createInsertSchema(searchNotifications).omit({
  id: true,
  sent_at: true,
});

export type InsertSearchNotification = z.infer<typeof insertSearchNotificationSchema>;
export type SearchNotification = typeof searchNotifications.$inferSelect;

// Horse deletion questionnaire responses
export const horseDeletionResponses = pgTable("horse_deletion_responses", {
  id: serial("id").primaryKey(),
  horse_id: integer("horse_id").notNull(),
  user_id: integer("user_id").notNull(),
  horse_name: text("horse_name").notNull(),
  sold_through_app: boolean("sold_through_app"),
  sold_elsewhere: boolean("sold_elsewhere"),
  unsold: boolean("unsold"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertHorseDeletionResponseSchema = createInsertSchema(horseDeletionResponses).omit({
  id: true,
  created_at: true,
});

export type InsertHorseDeletionResponse = z.infer<typeof insertHorseDeletionResponseSchema>;
export type HorseDeletionResponse = typeof horseDeletionResponses.$inferSelect;

// Push Subscriptions for Web Push Notifications
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  
  // Notification preferences
  notify_matches: boolean("notify_matches").default(true),
  notify_messages: boolean("notify_messages").default(true),
  notify_updates: boolean("notify_updates").default(true),
  notify_digest: boolean("notify_digest").default(true),
  
  created_at: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  created_at: true,
});

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Login Events (for analytics tracking)
export const loginEvents = pgTable("login_events", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  logged_in_at: timestamp("logged_in_at").defaultNow(),
});

export const insertLoginEventSchema = createInsertSchema(loginEvents).omit({
  id: true,
  logged_in_at: true,
});

export type InsertLoginEvent = z.infer<typeof insertLoginEventSchema>;
export type LoginEvent = typeof loginEvents.$inferSelect;

// Constants for app
export const disciplines = ["Jumping", "Dressage", "Eventing"];
export const sexes = ["Mare", "Gelding", "Stallion"];
export const colours = ["Bay", "Brown", "Black", "Grey", "Chestnut", "Palomino", "Tobiano", "Buckskin", "Other"];
export const breeds = [
  "Warmblood",
  "Warmblood X",
  "Thoroughbred",
  "Thoroughbred X",
  "Stock Horse",
  "Stock Horse X",
  "Riding Pony",
  "Other"
];
export const characteristics = [
  "Forward",
  "Brave",
  "Careful",
  "Scope",
  "Schoolmaster",
  "Honest",
  "Bold",
  "Sensitive",
  "Calm"
];
export const countries = [
  "Australia",
  "New Zealand", 
  "North America",
  "Northern Europe",
  "Central Europe", 
  "Southern Europe",
  "United Kingdom and Ireland"
];
export const educationLevels = [
  "Schoolmaster",
  "High level of education",
  "Well educated",
  "Basic education",
  "Started under saddle",
  "Handled only",
  "Unhandled"
];
export const jumpingLevels = ["Futurity", "Children", "Under 1m", "1.10m", "1.20m", "1.30m", "Junior", "Amateur", "Young Rider", "Mini Prix", "Grand Prix"];
export const dressageLevels = ["Pony Dressage", "Preliminary", "Novice", "Elementary", "Medium", "Advanced", "Young Rider", "Prix St. Georges", "Intermediate I", "Intermediate II", "Grand Prix", "Para-Dressage"];
export const eventingLevels = ["EvA60", "EvA80", "EvA95", "1*", "2*", "3*", "4*", "5*"];
