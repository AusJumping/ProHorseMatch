import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Owner Model
export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  business_name: text("business_name").notNull(),
  contact_name: text("contact_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertOwnerSchema = createInsertSchema(owners).omit({
  id: true,
  created_at: true,
});

export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type Owner = typeof owners.$inferSelect;

// Customer (Rider) Model
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
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
  created_at: timestamp("created_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  created_at: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

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
  sire: text("sire"),
  dam: text("dam"),
  dam_sire: text("dam_sire"),
  characteristics: text("characteristics").array(),
  price: integer("price").notNull(),
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
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  last_message_id: true,
  last_message_time: true,
  unread_count: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Constants for app
export const disciplines = ["Jumping", "Dressage", "Eventing"];
export const sexes = ["Mare", "Gelding", "Stallion"];
export const breeds = [
  "Hanoverian", 
  "Dutch Warmblood", 
  "Holsteiner", 
  "KWPN", 
  "Thoroughbred", 
  "Westphalian",
  "Selle Francais",
  "Belgian Warmblood",
  "Oldenburg",
  "Trakehner",
  "Irish Sport Horse"
];
export const characteristics = [
  "Forward",
  "Brave",
  "Careful",
  "Scope",
  "Easy to Ride",
  "Schoolmaster",
  "Athletic",
  "Honest",
  "Talented",
  "Bold",
  "Sensitive",
  "Calm"
];
export const jumpingLevels = ["1.00m", "1.10m", "1.20m", "1.30m", "1.40m", "1.50m", "1.60m"];
export const dressageLevels = ["Novice", "Elementary", "Medium", "Advanced", "PSG", "Inter I", "Inter II", "Grand Prix"];
export const eventingLevels = ["Intro", "Preliminary", "Intermediate", "Advanced", "CCI1*", "CCI2*", "CCI3*", "CCI4*", "CCI5*"];
