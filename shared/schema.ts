import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Unified User Model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
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
  
  // Subscription fields
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  subscription_status: text("subscription_status"),
  subscription_plan: text("subscription_plan"),
  subscription_end_date: timestamp("subscription_end_date"),
  
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
}).extend({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  is_searching: z.literal(true).default(true),
});

// For backward compatibility - schema for selling role registration 
export const insertSellingUserSchema = insertUserSchema.omit({
  name: true,
}).extend({
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
  price_min: integer("price_min").notNull(),
  price_max: integer("price_max").notNull(),
  currency: text("currency").notNull(),
  description: text("description"),
  photos: text("photos").array().notNull(),
  videos: text("videos").array(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertHorseSchema = createInsertSchema(horses).omit({
  id: true,
  created_at: true,
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



// Constants for app
export const disciplines = ["Jumping", "Dressage", "Eventing"];
export const sexes = ["Mare", "Gelding", "Stallion"];
export const colours = ["Bay", "Brown", "Black", "Grey", "Chestnut", "Palomino", "Tobiano", "Buckskin", "Other"];
export const breeds = [
  "Warmblood", 
  "Thoroughbred", 
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
export const jumpingLevels = ["Children", "Junior", "Amateur", "Young Rider", "Mini Prix", "Grand Prix"];
export const dressageLevels = ["Preliminary", "Novice", "Elementary", "Medium", "Advanced", "Prix St. Georges", "Intermediate I", "Intermediate II", "Grand Prix"];
export const eventingLevels = ["EvA60", "EvA80", "EvA95", "1*", "2*", "3*", "4*", "5*"];

// Messaging System Schema
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  customer_id: integer("customer_id").notNull().references(() => users.id),
  owner_id: integer("owner_id").notNull().references(() => users.id),
  horse_id: integer("horse_id").notNull().references(() => horses.id),
  last_message_time: timestamp("last_message_time").defaultNow(),
  is_read_by_customer: boolean("is_read_by_customer").default(false),
  is_read_by_owner: boolean("is_read_by_owner").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversation_id: integer("conversation_id").notNull().references(() => conversations.id),
  sender_id: integer("sender_id").notNull().references(() => users.id),
  sender_type: text("sender_type").notNull(), // "customer" or "owner"
  content: text("content").notNull(),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  created_at: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  created_at: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
