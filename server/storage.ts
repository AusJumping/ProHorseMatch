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
  
  // Messaging methods
  getConversations(): Promise<Conversation[]>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<Conversation>): Promise<Conversation>;
  findConversation(customerId: number, ownerId: number, horseId: number): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;
  
  getMessages(): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<Message>): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;
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
      const fileContent = fs.readFileSync(STORAGE_FILE, 'utf8');
      const data = JSON.parse(fileContent);
      
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
  private conversations: Map<number, Conversation> = new Map();
  private messages: Map<number, Message> = new Map();

  private horseId: number;
  private userId: number;
  private matchId: number;
  private conversationId: number = 1;
  private messageId: number = 1;

  constructor(skipSeed = false) {
    // Initialize or load from global storage to survive hot reloads
    if (global.__persistent_storage) {
      console.log("Using existing persistent storage (hot reload)");
      this.horses = global.__persistent_storage.horses;
      this.users = global.__persistent_storage.users;
      this.matches = global.__persistent_storage.matches;
      this.horseId = global.__persistent_storage.horseId;
      this.userId = global.__persistent_storage.userId;
      this.matchId = global.__persistent_storage.matchId;
    } else {
      // Try to load from disk first
      const diskStorage = loadStorageFromDisk();
      if (diskStorage) {
        console.log("Loading persistent storage from disk");
        this.horses = diskStorage.horses;
        this.users = diskStorage.users;
        this.matches = diskStorage.matches;
        this.horseId = diskStorage.horseId;
        this.userId = diskStorage.userId;
        this.matchId = diskStorage.matchId;
        this.conversations = diskStorage.conversations || new Map();
        this.messages = diskStorage.messages || new Map();
        this.conversationId = diskStorage.conversationId || 1;
        this.messageId = diskStorage.messageId || 1;
        
        // Save to global for hot reloads
        global.__persistent_storage = {
          horses: this.horses,
          users: this.users,
          matches: this.matches,
          conversations: this.conversations,
          messages: this.messages,
          horseId: this.horseId,
          userId: this.userId,
          matchId: this.matchId,
          conversationId: this.conversationId,
          messageId: this.messageId,
          seeded: diskStorage.seeded
        };
      } else {
        console.log("Creating new persistent storage");
        this.horses = new Map();
        this.users = new Map();
        this.matches = new Map();
        this.horseId = 1;
        this.userId = 1;
        this.matchId = 1;
        
        // Save to global for hot reloads
        global.__persistent_storage = {
          horses: this.horses,
          users: this.users,
          matches: this.matches,
          horseId: this.horseId,
          userId: this.userId,
          matchId: this.matchId,
          seeded: false
        };
      }
    }
    
    // Only seed if not skipped and not already seeded
    if (!skipSeed && !global.__persistent_storage.seeded) {
      this.seedData();
      global.__persistent_storage.seeded = true;
      saveStorageToDisk();
    }
  }

  private seedData() {
    console.log("Seeding initial data...");
    
    // Create sample users with subscription fields
    const ownerUser: User = {
      id: 1,
      business_name: "Elite Equestrian",
      contact_name: "Sarah Johnson",
      name: null,
      email: "sarah@eliteequestrian.com",
      password: "password123",
      is_selling: true,
      is_searching: false,
      location_country: null,
      location_radius_km: null,
      preferred_disciplines: null,
      preferred_levels: null,
      preferred_breeds: null,
      age_range_min: null,
      age_range_max: null,
      height_range_min: null,
      height_range_max: null,
      preferred_sexes: null,
      breeding_preferences: null,
      preferred_characteristics: null,
      price_range_min: null,
      price_range_max: null,
      currency: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,
      subscription_plan: null,
      subscription_end_date: null,
      created_at: new Date()
    };

    const customerUser: User = {
      id: 2,
      name: "Mike Brown",
      business_name: null,
      contact_name: null,
      email: "mike@example.com",
      password: "password123",
      is_searching: true,
      is_selling: false,
      location_country: "Australia",
      location_radius_km: 500,
      preferred_disciplines: ["Jumping", "Dressage"],
      preferred_levels: ["Amateur", "Young Rider"],
      preferred_breeds: ["Warmblood", "Thoroughbred"],
      age_range_min: 5,
      age_range_max: 12,
      height_range_min: 15.2,
      height_range_max: 17.0,
      preferred_sexes: ["Mare", "Gelding"],
      breeding_preferences: ["Competition Proven"],
      preferred_characteristics: ["Calm", "Athletic"],
      price_range_min: 20000,
      price_range_max: 100000,
      currency: "AUD",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,
      subscription_plan: null,
      subscription_end_date: null,
      created_at: new Date()
    };

    this.users.set(1, ownerUser);
    this.users.set(2, customerUser);
    this.userId = 3;

    // Create sample horses
    const horse1: InsertHorse = {
      owner_id: 1,
      name: "Thunder's Legacy",
      location_country: "Australia",
      location_radius_km: null,
      disciplines: ["Jumping"],
      levels: ["Grand Prix"],
      breeds: ["Warmblood"],
      age: 8,
      height_hands: 16.2,
      height_cm: 165,
      sex: "Gelding",
      colour: "Bay",
      price_min: 85000,
      price_max: 95000,
      currency: "AUD",
      photos: ["https://images.unsplash.com/photo-1553284965-83fd3e82fa5a"],
      videos: [],
      description: "Exceptional jumping horse with proven competition record.",
      characteristics: ["Athletic", "Brave"],
      breeding: ["Competition Proven"],
      health_tests: ["Vet Check", "X-rays"]
    };

    const horse2: InsertHorse = {
      owner_id: 1,
      name: "Midnight Dancer",
      location_country: "Australia", 
      location_radius_km: null,
      disciplines: ["Dressage"],
      levels: ["Prix St. Georges"],
      breeds: ["Warmblood"],
      age: 6,
      height_hands: 16.0,
      height_cm: 163,
      sex: "Mare",
      colour: "Black",
      price_min: 65000,
      price_max: 75000,
      currency: "AUD",
      photos: ["https://images.unsplash.com/photo-1549924440-c4b9493a2a38"],
      videos: [],
      description: "Beautiful dressage mare with exceptional movement.",
      characteristics: ["Elegant", "Trainable"],
      breeding: ["Imported Lines"],
      health_tests: ["Vet Check"]
    };

    const horse3: InsertHorse = {
      owner_id: 1,
      name: "Golden Arrow",
      location_country: "Australia",
      location_radius_km: null,
      disciplines: ["Eventing"],
      levels: ["2*"],
      breeds: ["Thoroughbred"],
      age: 7,
      height_hands: 16.1,
      height_cm: 164,
      sex: "Gelding",
      colour: "Chestnut",
      price_min: 45000,
      price_max: 55000,
      currency: "AUD",
      photos: ["https://images.unsplash.com/photo-1587563871167-1ee9c731aefb"],
      videos: [],
      description: "Talented eventing horse with great potential.",
      characteristics: ["Brave", "Athletic"],
      breeding: ["Racing Lines"],
      health_tests: ["Vet Check", "Scope"]
    };

    const horse4: InsertHorse = {
      owner_id: 1,
      name: "Silver Storm",
      location_country: "Australia",
      location_radius_km: null,
      disciplines: ["Jumping", "Dressage"],
      levels: ["Amateur", "Medium"],
      breeds: ["Warmblood"],
      age: 9,
      height_hands: 15.8,
      height_cm: 161,
      sex: "Mare",
      colour: "Grey",
      price_min: 35000,
      price_max: 45000,
      currency: "AUD",
      photos: ["https://images.unsplash.com/photo-1550618144-65b9c2dce4b2"],
      videos: [],
      description: "Versatile mare suitable for amateur rider.",
      characteristics: ["Calm", "Reliable"],
      breeding: ["Amateur Friendly"],
      health_tests: ["Vet Check"]
    };

    // Add horses to storage
    [horse1, horse2, horse3, horse4].forEach((horse) => {
      const newHorse = this.createHorse(horse);
    });

    console.log("Seeding completed!");
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
      // Owner ID filter
      if (filters.owner_id && horse.owner_id !== filters.owner_id) {
        return false;
      }

      // Discipline filter
      if (filters.disciplines && filters.disciplines.length > 0) {
        const hasMatchingDiscipline = filters.disciplines.some((discipline: string) =>
          horse.disciplines.includes(discipline)
        );
        if (!hasMatchingDiscipline) return false;
      }

      // Level filter
      if (filters.levels && filters.levels.length > 0) {
        const hasMatchingLevel = filters.levels.some((level: string) =>
          horse.levels.includes(level)
        );
        if (!hasMatchingLevel) return false;
      }

      // Breed filter
      if (filters.breeds && filters.breeds.length > 0) {
        const hasMatchingBreed = filters.breeds.some((breed: string) =>
          horse.breeds.includes(breed)
        );
        if (!hasMatchingBreed) return false;
      }

      // Sex filter
      if (filters.sexes && filters.sexes.length > 0) {
        if (!filters.sexes.includes(horse.sex)) return false;
      }

      // Colour filter
      if (filters.colours && filters.colours.length > 0) {
        if (!filters.colours.includes(horse.colour)) return false;
      }

      // Age range filter
      if (filters.age_min && horse.age < filters.age_min) return false;
      if (filters.age_max && horse.age > filters.age_max) return false;

      // Height range filter (in hands)
      if (filters.height_min && horse.height_hands && horse.height_hands < filters.height_min) return false;
      if (filters.height_max && horse.height_hands && horse.height_hands > filters.height_max) return false;

      // Price range filter
      if (filters.price_min && horse.price_max < filters.price_min) return false;
      if (filters.price_max && horse.price_min > filters.price_max) return false;

      // Location filter
      if (filters.location_country && horse.location_country !== filters.location_country) return false;

      return true;
    });
  }

  async createHorse(horse: InsertHorse): Promise<Horse> {
    const id = this.horseId++;
    const newHorse: Horse = { id, ...horse, created_at: new Date() };
    this.horses.set(id, newHorse);
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

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { id, ...user, created_at: new Date() };
    this.users.set(id, newUser);
    saveStorageToDisk();
    return newUser;
  }

  async updateUser(id: number, update: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");

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
    return user?.is_selling ? user : undefined;
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    const user = Array.from(this.users.values()).find(user => user.email === email);
    return user?.is_selling ? user : undefined;
  }

  async createOwner(owner: InsertOwner): Promise<Owner> {
    return this.createUser({ ...owner, is_selling: true });
  }

  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.users.values()).filter(user => user.is_searching);
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const user = this.users.get(id);
    return user?.is_searching ? user : undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const user = Array.from(this.users.values()).find(user => user.email === email);
    return user?.is_searching ? user : undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return this.createUser({ ...customer, is_searching: true });
  }

  async updateCustomer(id: number, update: Partial<Customer>): Promise<Customer> {
    return this.updateUser(id, update);
  }

  // Match methods
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
    saveStorageToDisk();
    return newMatch;
  }

  async updateMatch(id: number, update: Partial<Match>): Promise<Match> {
    const match = this.matches.get(id);
    if (!match) throw new Error("Match not found");

    const updatedMatch = { ...match, ...update };
    this.matches.set(id, updatedMatch);
    saveStorageToDisk();
    return updatedMatch;
  }

  // Messaging methods
  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      conv => conv.customer_id === userId || conv.owner_id === userId
    );
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationId++;
    const newConversation: Conversation = { 
      id, 
      ...conversation, 
      created_at: new Date(),
      last_message_time: new Date(),
      is_read_by_customer: false,
      is_read_by_owner: false
    };
    this.conversations.set(id, newConversation);
    saveStorageToDisk();
    return newConversation;
  }

  async updateConversation(id: number, update: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error(`Conversation with ID ${id} not found`);
    }
    
    const updatedConversation = { ...conversation, ...update };
    this.conversations.set(id, updatedConversation);
    saveStorageToDisk();
    return updatedConversation;
  }

  async findConversation(customerId: number, ownerId: number, horseId: number): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      conv => conv.customer_id === customerId && conv.owner_id === ownerId && conv.horse_id === horseId
    );
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      msg => msg.conversation_id === conversationId
    ).sort((a, b) => {
      const aTime = a.created_at ? a.created_at.getTime() : 0;
      const bTime = b.created_at ? b.created_at.getTime() : 0;
      return aTime - bTime;
    });
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = { 
      id, 
      ...message, 
      created_at: new Date(),
      is_read: false
    };
    this.messages.set(id, newMessage);
    saveStorageToDisk();
    return newMessage;
  }

  async updateMessage(id: number, update: Partial<Message>): Promise<Message> {
    const message = this.messages.get(id);
    if (!message) {
      throw new Error(`Message with ID ${id} not found`);
    }
    
    const updatedMessage = { ...message, ...update };
    this.messages.set(id, updatedMessage);
    saveStorageToDisk();
    return updatedMessage;
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    const messages = Array.from(this.messages.values()).filter(
      msg => msg.conversation_id === conversationId && msg.sender_id !== userId
    );
    
    for (const message of messages) {
      message.is_read = true;
      this.messages.set(message.id, message);
    }
    saveStorageToDisk();
  }

  async deleteConversation(id: number): Promise<boolean> {
    const deleted = this.conversations.delete(id);
    if (deleted) {
      // Also delete all messages in this conversation
      const messagesToDelete = Array.from(this.messages.values())
        .filter(msg => msg.conversation_id === id);
      
      for (const message of messagesToDelete) {
        this.messages.delete(message.id);
      }
      
      saveStorageToDisk();
    }
    return deleted;
  }
}

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, update: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error("User not found");
    }

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

  async getHorses(): Promise<Horse[]> {
    return await db.select().from(horses);
  }

  async getHorseById(id: number): Promise<Horse | undefined> {
    const [horse] = await db.select().from(horses).where(eq(horses.id, id));
    return horse;
  }

  async getHorsesByFilters(filters: any): Promise<Horse[]> {
    let query = db.select().from(horses);
    
    const conditions = [];
    
    if (filters.owner_id) {
      conditions.push(eq(horses.owner_id, filters.owner_id));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async createHorse(horse: InsertHorse): Promise<Horse> {
    const [newHorse] = await db.insert(horses).values(horse).returning();
    return newHorse;
  }

  async updateHorse(id: number, update: Partial<Horse>): Promise<Horse | undefined> {
    const [updatedHorse] = await db
      .update(horses)
      .set(update)
      .where(eq(horses.id, id))
      .returning();

    return updatedHorse;
  }

  async deleteHorse(id: number): Promise<boolean> {
    const result = await db.delete(horses).where(eq(horses.id, id));
    return result.rowCount > 0;
  }

  // Legacy methods for backward compatibility
  async getOwners(): Promise<Owner[]> {
    return await db.select().from(users).where(eq(users.is_selling, true));
  }

  async getOwnerById(id: number): Promise<Owner | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.is_selling, true)));
    return user;
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.email, email), eq(users.is_selling, true)));
    return user;
  }

  async createOwner(owner: InsertOwner): Promise<Owner> {
    return this.createUser({ ...owner, is_selling: true });
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(users).where(eq(users.is_searching, true));
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.is_searching, true)));
    return user;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.email, email), eq(users.is_searching, true)));
    return user;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return this.createUser({ ...customer, is_searching: true });
  }

  async updateCustomer(id: number, update: Partial<Customer>): Promise<Customer> {
    return this.updateUser(id, update);
  }

  async getMatches(): Promise<Match[]> {
    return await db.select().from(matches);
  }

  async getMatchById(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async getMatchesByCustomerId(customerId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.customer_id, customerId));
  }

  async getMatchesByHorseId(horseId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.horse_id, horseId));
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db.insert(matches).values(match).returning();
    return newMatch;
  }

  async updateMatch(id: number, update: Partial<Match>): Promise<Match> {
    const [updatedMatch] = await db
      .update(matches)
      .set(update)
      .where(eq(matches.id, id))
      .returning();

    if (!updatedMatch) {
      throw new Error("Match not found");
    }

    return updatedMatch;
  }

  // Messaging methods implementation
  async getConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations).orderBy(desc(conversations.last_message_time));
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    const [result] = await db.select().from(conversations).where(eq(conversations.id, id));
    return result;
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return await db.select().from(conversations)
      .where(
        sql`${conversations.customer_id} = ${userId} OR ${conversations.owner_id} = ${userId}`
      )
      .orderBy(desc(conversations.last_message_time));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [result] = await db.insert(conversations).values(conversation).returning();
    return result;
  }

  async updateConversation(id: number, update: Partial<Conversation>): Promise<Conversation> {
    const [result] = await db.update(conversations).set(update).where(eq(conversations.id, id)).returning();
    return result;
  }

  async findConversation(customerId: number, ownerId: number, horseId: number): Promise<Conversation | undefined> {
    const [result] = await db.select().from(conversations)
      .where(
        and(
          eq(conversations.customer_id, customerId),
          eq(conversations.owner_id, ownerId),
          eq(conversations.horse_id, horseId)
        )
      );
    return result;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(asc(messages.created_at));
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const [result] = await db.select().from(messages).where(eq(messages.id, id));
    return result;
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.conversation_id, conversationId))
      .orderBy(asc(messages.created_at));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    
    // Update conversation's last_message_time
    await db.update(conversations)
      .set({ last_message_time: new Date() })
      .where(eq(conversations.id, message.conversation_id));
    
    return result;
  }

  async updateMessage(id: number, update: Partial<Message>): Promise<Message> {
    const [result] = await db.update(messages).set(update).where(eq(messages.id, id)).returning();
    return result;
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    // Mark messages as read
    await db.update(messages)
      .set({ is_read: true })
      .where(
        and(
          eq(messages.conversation_id, conversationId),
          sql`${messages.sender_id} != ${userId}`
        )
      );

    // Update conversation read status
    const conversation = await this.getConversationById(conversationId);
    if (conversation) {
      const updateData: Partial<Conversation> = {};
      if (conversation.customer_id === userId) {
        updateData.is_read_by_customer = true;
      } else if (conversation.owner_id === userId) {
        updateData.is_read_by_owner = true;
      }
      await this.updateConversation(conversationId, updateData);
    }
  }

  async deleteConversation(id: number): Promise<boolean> {
    // Delete all messages in the conversation first
    await db.delete(messages).where(eq(messages.conversation_id, id));
    
    // Then delete the conversation
    const result = await db.delete(conversations).where(eq(conversations.id, id)).returning();
    
    return result.length > 0;
  }
}

export function createStorage(skipSeed = false) {
  // Use database if DATABASE_URL is available, otherwise use in-memory storage
  if (process.env.DATABASE_URL) {
    console.log("Using database storage");
    return new DatabaseStorage();
  } else {
    console.log("Using in-memory storage");
    return new MemStorage(skipSeed);
  }
}

export const storage = createStorage(false);

export function resetStorageToEmpty() {
  if (global.__persistent_storage) {
    global.__persistent_storage.horses.clear();
    global.__persistent_storage.users.clear();
    global.__persistent_storage.matches.clear();
    global.__persistent_storage.horseId = 1;
    global.__persistent_storage.userId = 1;
    global.__persistent_storage.matchId = 1;
    global.__persistent_storage.seeded = false;
  }
}