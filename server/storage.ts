import { 
  horses, type Horse, type InsertHorse,
  users, type User, type InsertUser, type Owner, type InsertOwner,
  type Customer, type InsertCustomer,
  matches, type Match, type InsertMatch,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // Horse methods
  getHorses(): Promise<Horse[]>;
  getHorseById(id: number): Promise<Horse | undefined>;
  getHorsesByFilters(filters: Partial<Horse>): Promise<Horse[]>;
  createHorse(horse: InsertHorse): Promise<Horse>;
  updateHorse(id: number, horse: Partial<Horse>): Promise<Horse | undefined>;
  deleteHorse(id: number): Promise<boolean>;
  
  // User methods
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  updateUserSubscription(id: number, subscriptionData: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    subscription_plan?: string;
    subscription_end_date?: Date;
  }): Promise<User>;
  
  // Legacy methods for backward compatibility
  getOwnerById(id: number): Promise<Owner | undefined>;
  getOwnerByEmail(email: string): Promise<Owner | undefined>;
  createOwner(owner: InsertOwner): Promise<Owner>;
  
  getCustomerById(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer>;
  
  // Match methods
  getMatches(): Promise<Match[]>;
  getMatchById(id: number): Promise<Match | undefined>;
  getMatchesByCustomerId(customerId: number): Promise<Match[]>;
  getMatchesByHorseId(horseId: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, match: Partial<Match>): Promise<Match>;
  
  // Conversation methods
  getConversations(): Promise<Conversation[]>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  getConversationsByCustomerId(customerId: number): Promise<Conversation[]>;
  getConversationsByOwnerId(ownerId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: number): Promise<boolean>;
  
  // Message methods
  getMessages(): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<Message>): Promise<Message>;
}

import * as fs from 'fs';
import * as path from 'path';

// Path for storing data on disk to ensure persistence across restarts
const DATA_DIR = './.data';
const STORAGE_FILE = path.join(DATA_DIR, 'persistent_storage.json');

// Use global namespace to persist data across hot reloads
declare global {
  var __persistent_storage: {
    horses: Map<number, Horse>;
    users: Map<number, User>;
    matches: Map<number, Match>;
    horseId: number;
    userId: number;
    matchId: number;
    seeded: boolean;
  } | undefined;
}

// Helper functions for file-based persistence
function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory: ${DATA_DIR}`);
  }
}

function saveStorageToDisk() {
  if (!global.__persistent_storage) return;
  
  try {
    ensureDataDirExists();
    
    // Convert Maps to serializable objects
    const serializableData = {
      horses: Array.from(global.__persistent_storage.horses.entries()),
      users: Array.from(global.__persistent_storage.users.entries()),
      matches: Array.from(global.__persistent_storage.matches.entries()),
      horseId: global.__persistent_storage.horseId,
      userId: global.__persistent_storage.userId,
      matchId: global.__persistent_storage.matchId,
      seeded: global.__persistent_storage.seeded
    };
    
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(serializableData, null, 2));
    console.log(`Saved storage data to ${STORAGE_FILE}`);
  } catch (error) {
    console.error('Error saving storage to disk:', error);
  }
}

function loadStorageFromDisk() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
      
      // Convert serialized arrays back to Maps
      const storage = {
        horses: new Map(data.horses),
        users: new Map(data.users),
        matches: new Map(data.matches),
        horseId: data.horseId,
        userId: data.userId,
        matchId: data.matchId,
        seeded: data.seeded
      };
      
      console.log(`Loaded storage data from ${STORAGE_FILE}`);
      console.log(`Loaded ${storage.horses.size} horses from disk storage`);
      return storage;
    }
  } catch (error) {
    console.error('Error loading storage from disk:', error);
  }
  
  return null;
}

export class MemStorage implements IStorage {
  private horses: Map<number, Horse>;
  private users: Map<number, User>;
  private matches: Map<number, Match>;
  
  private horseId: number;
  private userId: number;
  private matchId: number;

  constructor(skipSeed = false) {
    // Load existing data from disk or create new
    const existingData = loadStorageFromDisk();
    
    if (existingData && !skipSeed) {
      // Use existing data
      this.horses = existingData.horses;
      this.users = existingData.users;
      this.matches = existingData.matches;
      this.horseId = existingData.horseId;
      this.userId = existingData.userId;
      this.matchId = existingData.matchId;
      
      // Store in global for hot reload persistence
      global.__persistent_storage = {
        horses: this.horses,
        users: this.users,
        matches: this.matches,
        horseId: this.horseId,
        userId: this.userId,
        matchId: this.matchId,
        seeded: existingData.seeded
      };
    } else {
      // Initialize fresh storage
      this.horses = new Map();
      this.users = new Map();
      this.matches = new Map();
      this.horseId = 1;
      this.userId = 1;
      this.matchId = 1;
      
      // Store in global for hot reload persistence
      global.__persistent_storage = {
        horses: this.horses,
        users: this.users,
        matches: this.matches,
        horseId: this.horseId,
        userId: this.userId,
        matchId: this.matchId,
        seeded: false
      };
      
      if (!skipSeed) {
        this.seedData();
      }
    }
  }

  private seedData() {
    if (global.__persistent_storage?.seeded) {
      console.log('Data already seeded, skipping...');
      return;
    }

    console.log('Seeding initial data...');
    
    // Create owner user with all required fields
    const ownerUser: User = {
      id: 1,
      name: null,
      business_name: "Elite Sporthorses",
      contact_name: "Sarah Johnson",
      email: "sarah@elitesporthorses.com",
      password: "password123",
      is_selling: true,
      is_searching: false,
      location_country: null,
      location_radius_km: null,
      currency: null,
      phone: null,
      website: null,
      bio: null,
      profile_image: null,
      verification_status: "pending",
      created_at: new Date(),
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,
      subscription_plan: null,
      subscription_end_date: null,
      search_radius_km: null,
      preferred_breeds: [],
      preferred_disciplines: [],
      budget_min: null,
      budget_max: null,
      preferred_age_min: null,
      preferred_age_max: null,
      experience_level: null
    };

    // Create customer user with all required fields  
    const customerUser: User = {
      id: 2,
      name: "Alex Thompson",
      business_name: null,
      contact_name: null,
      email: "alex@example.com",
      password: "password123",
      is_searching: true,
      is_selling: false,
      location_country: "United Kingdom",
      location_radius_km: 50,
      currency: "GBP",
      phone: null,
      website: null,
      bio: null,
      profile_image: null,
      verification_status: "verified",
      created_at: new Date(),
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,
      subscription_plan: null,
      subscription_end_date: null,
      search_radius_km: 50,
      preferred_breeds: ["Warmblood"],
      preferred_disciplines: ["Jumping"],
      budget_min: 15000,
      budget_max: 50000,
      preferred_age_min: 5,
      preferred_age_max: 12,
      experience_level: "intermediate"
    };

    this.users.set(ownerUser.id, ownerUser);
    this.users.set(customerUser.id, customerUser);
    this.userId = 3;

    // Create sample horses with all required fields
    const horse1: InsertHorse = {
      owner_id: 1,
      name: "Thunder Bay",
      location_country: "United Kingdom",
      location_radius_km: null,
      disciplines: ["Jumping"],
      levels: ["Grand Prix"],
      breeds: ["Warmblood"],
      age: 8,
      sex: "Gelding",
      colour: "Bay",
      height_hands: 16.2,
      height_cm: 168,
      characteristics: ["Brave", "Responsive"],
      price_min: 25000,
      price_max: 35000,
      currency: "GBP",
      description: "Exceptional showjumper with proven competition record",
      photos: ["/uploads/file-1747306999999-123456789.jpeg"],
      videos: []
    };

    const horse2: InsertHorse = {
      owner_id: 1,
      name: "Midnight Star",
      location_country: "United Kingdom", 
      location_radius_km: null,
      disciplines: ["Dressage"],
      levels: ["Advanced"],
      breeds: ["Warmblood"],
      age: 10,
      sex: "Mare",
      colour: "Black",
      height_hands: 16.0,
      height_cm: 163,
      characteristics: ["Elegant", "Willing"],
      price_min: 30000,
      price_max: 40000,
      currency: "GBP",
      description: "Beautiful dressage mare with excellent movement",
      photos: ["/uploads/file-1747306999998-123456788.jpeg"],
      videos: []
    };

    this.createHorse(horse1);
    this.createHorse(horse2);

    if (global.__persistent_storage) {
      global.__persistent_storage.seeded = true;
    }
    
    saveStorageToDisk();
    console.log('Initial data seeded successfully');
  }

  getInternalHorsesMap(): Map<number, Horse> {
    return this.horses;
  }

  async getHorses(): Promise<Horse[]> {
    return Array.from(this.horses.values());
  }

  async getHorseById(id: number): Promise<Horse | undefined> {
    return this.horses.get(id);
  }

  async getHorsesByFilters(filters: any): Promise<Horse[]> {
    const horses = Array.from(this.horses.values());
    return horses.filter(horse => {
      // Apply filters
      if (filters.disciplines && filters.disciplines.length > 0) {
        if (!horse.disciplines.some(d => filters.disciplines.includes(d))) return false;
      }
      if (filters.levels && filters.levels.length > 0) {
        if (!horse.levels.some(l => filters.levels.includes(l))) return false;
      }
      if (filters.breeds && filters.breeds.length > 0) {
        if (!horse.breeds.some(b => filters.breeds.includes(b))) return false;
      }
      if (filters.sexes && filters.sexes.length > 0) {
        if (!filters.sexes.includes(horse.sex)) return false;
      }
      if (filters.location_country && horse.location_country !== filters.location_country) return false;
      if (filters.age_min && horse.age < filters.age_min) return false;
      if (filters.age_max && horse.age > filters.age_max) return false;
      if (filters.height_min && horse.height_hands && horse.height_hands < filters.height_min) return false;
      if (filters.height_max && horse.height_hands && horse.height_hands > filters.height_max) return false;
      if (filters.price_min && horse.price_min < filters.price_min) return false;
      if (filters.price_max && horse.price_max > filters.price_max) return false;
      
      return true;
    });
  }

  async createHorse(horse: InsertHorse): Promise<Horse> {
    const id = this.horseId++;
    const newHorse: Horse = { id, ...horse, created_at: new Date() };
    this.horses.set(id, newHorse);
    
    if (global.__persistent_storage) {
      global.__persistent_storage.horseId = this.horseId;
    }
    
    saveStorageToDisk();
    return newHorse;
  }

  async updateHorse(id: number, update: Partial<Horse>): Promise<Horse | undefined> {
    const horse = this.horses.get(id);
    if (!horse) return undefined;
    
    const updatedHorse = { ...horse, ...update };
    this.horses.set(id, updatedHorse);
    saveStorageToDisk();
    return updatedHorse;
  }

  async deleteHorse(id: number): Promise<boolean> {
    const deleted = this.horses.delete(id);
    if (deleted) {
      saveStorageToDisk();
    }
    return deleted;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { id, ...user, created_at: new Date() };
    this.users.set(id, newUser);
    
    if (global.__persistent_storage) {
      global.__persistent_storage.userId = this.userId;
    }
    
    saveStorageToDisk();
    return newUser;
  }

  async updateUser(id: number, update: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...update };
    this.users.set(id, updatedUser);
    saveStorageToDisk();
    return updatedUser;
  }

  async updateUserSubscription(id: number, subscriptionData: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    subscription_plan?: string;
    subscription_end_date?: Date;
  }): Promise<User> {
    return this.updateUser(id, subscriptionData);
  }

  // Legacy methods for backward compatibility
  async getOwners(): Promise<Owner[]> {
    return Array.from(this.users.values()).filter(user => user.is_selling);
  }

  async getOwnerById(id: number): Promise<Owner | undefined> {
    const user = this.users.get(id);
    return user && user.is_selling ? user : undefined;
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    const user = await this.getUserByEmail(email);
    return user && user.is_selling ? user : undefined;
  }

  async createOwner(owner: InsertOwner): Promise<Owner> {
    return this.createUser({ ...owner, is_selling: true, is_searching: false });
  }

  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.users.values()).filter(user => user.is_searching);
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const user = this.users.get(id);
    return user && user.is_searching ? user : undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const user = await this.getUserByEmail(email);
    return user && user.is_searching ? user : undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return this.createUser({ ...customer, is_searching: true, is_selling: false });
  }

  async updateCustomer(id: number, update: Partial<Customer>): Promise<Customer> {
    return this.updateUser(id, update);
  }

  async getMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }

  async getMatchById(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getMatchesByCustomerId(customerId: number): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(match => match.customer_id === customerId);
  }

  async getMatchesByHorseId(horseId: number): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(match => match.horse_id === horseId);
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const id = this.matchId++;
    const newMatch: Match = { id, ...match, created_at: new Date() };
    this.matches.set(id, newMatch);
    
    if (global.__persistent_storage) {
      global.__persistent_storage.matchId = this.matchId;
    }
    
    saveStorageToDisk();
    return newMatch;
  }

  async updateMatch(id: number, update: Partial<Match>): Promise<Match> {
    const match = this.matches.get(id);
    if (!match) {
      throw new Error("Match not found");
    }
    
    const updatedMatch = { ...match, ...update };
    this.matches.set(id, updatedMatch);
    saveStorageToDisk();
    return updatedMatch;
  }

  // Conversation methods (in-memory implementation)
  async getConversations(): Promise<Conversation[]> {
    // For in-memory storage, we'll return empty arrays since messaging should use database
    return [];
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    return undefined;
  }

  async getConversationsByCustomerId(customerId: number): Promise<Conversation[]> {
    return [];
  }

  async getConversationsByOwnerId(ownerId: number): Promise<Conversation[]> {
    return [];
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    throw new Error("Conversations should be created using database storage");
  }

  async updateConversation(id: number, conversation: Partial<Conversation>): Promise<Conversation> {
    throw new Error("Conversations should be updated using database storage");
  }

  async deleteConversation(id: number): Promise<boolean> {
    return false;
  }

  // Message methods (in-memory implementation)
  async getMessages(): Promise<Message[]> {
    return [];
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return undefined;
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return [];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    throw new Error("Messages should be created using database storage");
  }

  async updateMessage(id: number, message: Partial<Message>): Promise<Message> {
    throw new Error("Messages should be updated using database storage");
  }
}

// Database-backed storage implementation
export class DatabaseStorage implements IStorage {
  // User methods for unified user model
  async getUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }
  
  async updateUser(id: number, update: Partial<User>): Promise<User> {
    const [result] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning();
    return result;
  }

  async updateUserSubscription(id: number, subscriptionData: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    subscription_plan?: string;
    subscription_end_date?: Date;
  }): Promise<User> {
    return this.updateUser(id, subscriptionData);
  }

  // Horse methods
  async getHorses(): Promise<Horse[]> {
    return await db.select().from(horses);
  }

  async getHorseById(id: number): Promise<Horse | undefined> {
    const [result] = await db.select().from(horses).where(eq(horses.id, id));
    return result;
  }

  async getHorsesByFilters(filters: any): Promise<Horse[]> {
    let query = db.select().from(horses);
    
    // Apply filters
    if (filters.owner_id) {
      query = query.where(eq(horses.owner_id, filters.owner_id));
    }
    
    const result = await query;
    
    // Apply additional filters in memory for complex array comparisons
    return result.filter(horse => {
      if (filters.disciplines && filters.disciplines.length > 0) {
        if (!horse.disciplines.some(d => filters.disciplines.includes(d))) return false;
      }
      if (filters.levels && filters.levels.length > 0) {
        if (!horse.levels.some(l => filters.levels.includes(l))) return false;
      }
      if (filters.breeds && filters.breeds.length > 0) {
        if (!horse.breeds.some(b => filters.breeds.includes(b))) return false;
      }
      if (filters.sexes && filters.sexes.length > 0) {
        if (!filters.sexes.includes(horse.sex)) return false;
      }
      if (filters.location_country && horse.location_country !== filters.location_country) return false;
      if (filters.age_min && horse.age < filters.age_min) return false;
      if (filters.age_max && horse.age > filters.age_max) return false;
      if (filters.height_min && horse.height_hands && horse.height_hands < filters.height_min) return false;
      if (filters.height_max && horse.height_hands && horse.height_hands > filters.height_max) return false;
      if (filters.price_min && horse.price_min < filters.price_min) return false;
      if (filters.price_max && horse.price_max > filters.price_max) return false;
      
      return true;
    });
  }

  async createHorse(horse: InsertHorse): Promise<Horse> {
    const [result] = await db.insert(horses).values(horse).returning();
    return result;
  }

  async updateHorse(id: number, update: Partial<Horse>): Promise<Horse | undefined> {
    const [result] = await db
      .update(horses)
      .set(update)
      .where(eq(horses.id, id))
      .returning();
    return result;
  }

  async deleteHorse(id: number): Promise<boolean> {
    const result = await db.delete(horses).where(eq(horses.id, id)).returning();
    return result.length > 0;
  }

  // Legacy methods for backward compatibility
  async getOwners(): Promise<Owner[]> {
    const result = await db.select().from(users).where(eq(users.is_selling, true));
    return result;
  }

  async getOwnerById(id: number): Promise<Owner | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.is_selling, true)));
    return result;
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.is_selling, true)));
    return result;
  }

  async createOwner(owner: InsertOwner): Promise<Owner> {
    return this.createUser({ ...owner, is_selling: true, is_searching: false });
  }

  async getCustomers(): Promise<Customer[]> {
    const result = await db.select().from(users).where(eq(users.is_searching, true));
    return result;
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.is_searching, true)));
    return result;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.is_searching, true)));
    return result;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return this.createUser({ ...customer, is_searching: true, is_selling: false });
  }

  async updateCustomer(id: number, update: Partial<Customer>): Promise<Customer> {
    return this.updateUser(id, update);
  }

  async getMatches(): Promise<Match[]> {
    return await db.select().from(matches);
  }

  async getMatchById(id: number): Promise<Match | undefined> {
    const [result] = await db.select().from(matches).where(eq(matches.id, id));
    return result;
  }

  async getMatchesByCustomerId(customerId: number): Promise<Match[]> {
    return await db
      .select()
      .from(matches)
      .where(eq(matches.customer_id, customerId));
  }

  async getMatchesByHorseId(horseId: number): Promise<Match[]> {
    return await db
      .select()
      .from(matches)
      .where(eq(matches.horse_id, horseId));
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [result] = await db.insert(matches).values(match).returning();
    return result;
  }

  async updateMatch(id: number, update: Partial<Match>): Promise<Match> {
    const [result] = await db
      .update(matches)
      .set(update)
      .where(eq(matches.id, id))
      .returning();
    
    if (!result) {
      throw new Error("Match not found");
    }
    
    return result;
  }

  // Conversation methods
  async getConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations);
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    const [result] = await db.select().from(conversations).where(eq(conversations.id, id));
    return result;
  }

  async getConversationsByCustomerId(customerId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.customer_id, customerId));
  }

  async getConversationsByOwnerId(ownerId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.owner_id, ownerId));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [result] = await db.insert(conversations).values(conversation).returning();
    return result;
  }

  async updateConversation(id: number, update: Partial<Conversation>): Promise<Conversation> {
    const [result] = await db
      .update(conversations)
      .set(update)
      .where(eq(conversations.id, id))
      .returning();
    
    if (!result) {
      throw new Error("Conversation not found");
    }
    
    return result;
  }

  async deleteConversation(id: number): Promise<boolean> {
    // Delete all messages in the conversation first
    await db.delete(messages).where(eq(messages.conversation_id, id));

    // Then delete the conversation
    const result = await db
      .delete(conversations)
      .where(eq(conversations.id, id))
      .returning();

    return result.length > 0;
  }

  // Message methods
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const [result] = await db.select().from(messages).where(eq(messages.id, id));
    return result;
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversation_id, conversationId))
      .orderBy(messages.created_at);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async updateMessage(id: number, update: Partial<Message>): Promise<Message> {
    const [result] = await db
      .update(messages)
      .set(update)
      .where(eq(messages.id, id))
      .returning();
    
    if (!result) {
      throw new Error("Message not found");
    }
    
    return result;
  }
}

// Switch to using the database storage
export function createStorage(skipSeed = false) {
  // Always use database for persistence
  return new DatabaseStorage();
}

export const storage = createStorage(false);

export function resetStorageToEmpty() {
  return new MemStorage(true);
}