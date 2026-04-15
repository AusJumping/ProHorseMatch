import { 
  horses, type Horse, type InsertHorse,
  users, type User, type InsertUser, type Owner, type InsertOwner,
  type Customer, type InsertCustomer,
  matches, type Match, type InsertMatch,
  messages, type Message, type InsertMessage,
  conversations, type Conversation, type InsertConversation,
  savedSearches, type SavedSearch, type InsertSavedSearch,
  searchNotifications, type SearchNotification, type InsertSearchNotification,
  horseDeletionResponses, type HorseDeletionResponse, type InsertHorseDeletionResponse,
  pushSubscriptions, type PushSubscription, type InsertPushSubscription,
  loginEvents, type LoginEvent, type InsertLoginEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql } from "drizzle-orm";

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
  deleteUser(id: number): Promise<boolean>;
  updateUserSubscription(id: number, subscriptionData: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    subscription_plan?: string;
    subscription_end_date?: Date;
  }): Promise<User>;
  
  // Email verification methods
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  updateUserVerification(id: number, verified: boolean, token?: string | null, expires?: Date | null): Promise<User>;
  isUserUnsubscribed(email: string): Promise<boolean>;
  setUserUnsubscribed(email: string): Promise<void>;
  
  // Reminder token methods (for subscription magic links)
  setReminderToken(userId: number, hashedToken: string, expiresAt: Date): Promise<void>;
  getUserByReminderToken(hashedToken: string): Promise<User | undefined>;
  deleteReminderToken(hashedToken: string): Promise<void>;
  
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
  
  // Message methods
  getMessages(): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  getMessagesByConversationId(customerId: number, ownerId: number, horseId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<Message>): Promise<Message>;
  
  // Conversation methods
  getConversations(): Promise<Conversation[]>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  getConversationsByCustomerId(customerId: number): Promise<Conversation[]>;
  getConversationsByOwnerId(ownerId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: number): Promise<boolean>;
  
  // Saved Search methods
  getSavedSearches(): Promise<SavedSearch[]>;
  getSavedSearchById(id: number): Promise<SavedSearch | undefined>;
  getSavedSearchesByUserId(userId: number): Promise<SavedSearch[]>;
  createSavedSearch(savedSearch: InsertSavedSearch): Promise<SavedSearch>;
  updateSavedSearch(id: number, savedSearch: Partial<SavedSearch>): Promise<SavedSearch>;
  deleteSavedSearch(id: number): Promise<boolean>;
  
  // Search Notification methods
  getSearchNotifications(): Promise<SearchNotification[]>;
  createSearchNotification(notification: InsertSearchNotification): Promise<SearchNotification>;
  getNotificationsBySearchId(savedSearchId: number): Promise<SearchNotification[]>;
  
  // Push Subscription methods
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptionsByUserId(userId: number): Promise<PushSubscription[]>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<boolean>;
  updatePushPreferences(userId: number, preferences: {
    notify_matches?: boolean;
    notify_messages?: boolean;
    notify_updates?: boolean;
    notify_digest?: boolean;
  }): Promise<void>;
  
  // Admin analytics methods
  getAllUsers(): Promise<User[]>;
  getAllHorses(): Promise<Horse[]>;
  getAllMessages(): Promise<Message[]>;
  getAllConversations(): Promise<Conversation[]>;
  getAllMatches(): Promise<Match[]>;
  
  // Horse deletion response methods
  createHorseDeletionResponse(response: InsertHorseDeletionResponse): Promise<HorseDeletionResponse>;
  getHorseDeletionResponses(): Promise<HorseDeletionResponse[]>;
  getHorseDeletionResponsesByUserId(userId: number): Promise<HorseDeletionResponse[]>;
  
  // Login tracking and analytics methods
  trackLoginEvent(userId: number): Promise<void>;
  getDailyActiveUsers(date?: Date): Promise<number>;
  getWeeklyActiveUsers(date?: Date): Promise<number>;
  getMonthlyActiveUsers(date?: Date): Promise<number>;
  getLoginTrend(days: number): Promise<Array<{ date: string; count: number }>>;
  getLoginTrendMonthly(months: number): Promise<Array<{ month: string; count: number }>>;
  getLoginTrendAllTime(): Promise<Array<{ month: string; count: number }>>;
  getLoginTrendAllTimeDaily(): Promise<Array<{ date: string; count: number }>>;
  
  // Message and conversation analytics methods
  getDailyMessages(date?: Date): Promise<number>;
  getWeeklyMessages(date?: Date): Promise<number>;
  getMonthlyMessages(date?: Date): Promise<number>;
  getMessageTrend(days: number): Promise<Array<{ date: string; count: number }>>;
  getMessageTrendAllTime(): Promise<Array<{ date: string; count: number }>>;
  getDailyConversations(date?: Date): Promise<number>;
  getWeeklyConversations(date?: Date): Promise<number>;
  getMonthlyConversations(date?: Date): Promise<number>;
  getConversationTrend(days: number): Promise<Array<{ date: string; count: number }>>;
  getConversationTrendMonthly(months: number): Promise<Array<{ month: string; count: number }>>;
  getConversationTrendAllTime(): Promise<Array<{ month: string; count: number }>>;
  getConversationTrendAllTimeDaily(): Promise<Array<{ date: string; count: number }>>;
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
    messages: Map<number, Message>;
    conversations: Map<number, Conversation>;
    horseDeletionResponses: Map<number, HorseDeletionResponse>;
    horseId: number;
    userId: number;
    matchId: number;
    messageId: number;
    conversationId: number;
    horseDeletionResponseId: number;
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
      messages: Array.from(global.__persistent_storage.messages.entries()),
      conversations: Array.from(global.__persistent_storage.conversations.entries()),
      horseDeletionResponses: Array.from(global.__persistent_storage.horseDeletionResponses.entries()),
      horseId: global.__persistent_storage.horseId,
      userId: global.__persistent_storage.userId,
      matchId: global.__persistent_storage.matchId,
      messageId: global.__persistent_storage.messageId,
      conversationId: global.__persistent_storage.conversationId,
      horseDeletionResponseId: global.__persistent_storage.horseDeletionResponseId,
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
        messages: new Map(data.messages),
        conversations: new Map(data.conversations),
        horseDeletionResponses: new Map(data.horseDeletionResponses || []),
        horseId: data.horseId,
        userId: data.userId,
        matchId: data.matchId,
        messageId: data.messageId,
        conversationId: data.conversationId,
        horseDeletionResponseId: data.horseDeletionResponseId || 1,
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
  private messages: Map<number, Message>;
  private conversations: Map<number, Conversation>;
  private horseDeletionResponses: Map<number, HorseDeletionResponse>;
  
  private horseId: number;
  private userId: number;
  private matchId: number;
  private messageId: number;
  private conversationId: number;
  private horseDeletionResponseId: number;
  
  constructor(skipSeed = false) {
    // First, try to load from disk file if it exists
    const diskStorage = loadStorageFromDisk();
    
    // If we have global storage initialized, use it
    if (global.__persistent_storage) {
      console.log("MemStorage: Reusing existing data from global storage");
      this.horses = global.__persistent_storage.horses;
      this.users = global.__persistent_storage.users;
      this.matches = global.__persistent_storage.matches;
      this.messages = global.__persistent_storage.messages;
      this.conversations = global.__persistent_storage.conversations;
      this.horseDeletionResponses = global.__persistent_storage.horseDeletionResponses;
      
      this.horseId = global.__persistent_storage.horseId;
      this.userId = global.__persistent_storage.userId;
      this.matchId = global.__persistent_storage.matchId;
      this.messageId = global.__persistent_storage.messageId;
      this.conversationId = global.__persistent_storage.conversationId;
      this.horseDeletionResponseId = global.__persistent_storage.horseDeletionResponseId;
      
      // Log the current state for debugging
      console.log(`MemStorage: Loaded ${this.horses.size} horses from global storage`);
      console.log(`MemStorage: Current horse IDs:`, Array.from(this.horses.keys()));
    } 
    // If we have disk storage, use it and set up global storage
    else if (diskStorage) {
      console.log("MemStorage: Loading data from disk storage");
      this.horses = diskStorage.horses;
      this.users = diskStorage.users;
      this.matches = diskStorage.matches;
      this.messages = diskStorage.messages;
      this.conversations = diskStorage.conversations;
      this.horseDeletionResponses = diskStorage.horseDeletionResponses;
      
      this.horseId = diskStorage.horseId;
      this.userId = diskStorage.userId;
      this.matchId = diskStorage.matchId;
      this.messageId = diskStorage.messageId;
      this.conversationId = diskStorage.conversationId;
      this.horseDeletionResponseId = diskStorage.horseDeletionResponseId;
      
      // Save to global for persistence across restarts
      global.__persistent_storage = {
        horses: this.horses,
        users: this.users,
        matches: this.matches,
        messages: this.messages,
        conversations: this.conversations,
        horseDeletionResponses: this.horseDeletionResponses,
        horseId: this.horseId,
        userId: this.userId,
        matchId: this.matchId,
        messageId: this.messageId,
        conversationId: this.conversationId,
        horseDeletionResponseId: this.horseDeletionResponseId,
        seeded: true
      };
      
      console.log(`MemStorage: Restored ${this.horses.size} horses from disk storage`);
      console.log(`MemStorage: Restored horse IDs:`, Array.from(this.horses.keys()));
    } 
    // If neither global nor disk storage exists, initialize from scratch
    else {
      // Initialize storage for the first time
      console.log("MemStorage: Initializing new storage from scratch");
      this.horses = new Map();
      this.users = new Map();
      this.matches = new Map();
      this.messages = new Map();
      this.conversations = new Map();
      this.horseDeletionResponses = new Map();
      
      this.horseId = 1;
      this.userId = 1;
      this.matchId = 1;
      this.messageId = 1;
      this.conversationId = 1;
      this.horseDeletionResponseId = 1;
      
      // Only seed if we're starting fresh and not explicitly skipping
      if (!skipSeed) {
        this.seedData();
        console.log("MemStorage: Initialized with seed data");
      } else {
        console.log("MemStorage: Initialized with empty state (skipSeed=true)");
      }
      
      // Save to global for persistence across restarts
      global.__persistent_storage = {
        horses: this.horses,
        users: this.users,
        matches: this.matches,
        messages: this.messages,
        conversations: this.conversations,
        horseDeletionResponses: this.horseDeletionResponses,
        horseId: this.horseId,
        userId: this.userId,
        matchId: this.matchId,
        messageId: this.messageId,
        conversationId: this.conversationId,
        horseDeletionResponseId: this.horseDeletionResponseId,
        seeded: true
      };
      
      // Also save to disk immediately
      saveStorageToDisk();
    }
    
    // Verify storage state
    console.log(`MemStorage: Current state - ${this.horses.size} horses, ${this.users.size} users`);
  }
  
  // Seed some initial data
  private seedData() {
    // Add a user with selling role (owner)
    const ownerUser: User = {
      id: 1,
      business_name: "Elite Sporthorses",
      contact_name: "John Smith",
      name: null,
      email: "john@elitesporthorses.com",
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
      created_at: new Date()
    };
    this.users.set(1, ownerUser);
    
    // Add a user with searching role (customer)
    const customerUser: User = {
      id: 2,
      name: "Sarah Thompson",
      business_name: null,
      contact_name: null,
      email: "sarah@example.com",
      password: "password123",
      is_searching: true,
      is_selling: false,
      location_country: "Germany",
      location_radius_km: 150,
      preferred_disciplines: ["Jumping"],
      preferred_levels: ["1.40m"],
      preferred_breeds: ["Hanoverian", "Dutch Warmblood"],
      age_range_min: 5,
      age_range_max: 12,
      height_range_min: 16.0,
      height_range_max: 17.2,
      preferred_sexes: ["Gelding"],
      breeding_preferences: "Preferably Cornet Obolensky line",
      preferred_characteristics: ["Forward", "Brave", "Careful"],
      price_range_min: 30000,
      price_range_max: 100000,
      currency: "EUR",
      created_at: new Date()
    };
    this.users.set(2, customerUser);
    
    // Set next ID
    this.userId = 3;
    
    // Add some horses
    const horse1: InsertHorse = {
      owner_id: 1,
      name: "Maestro",
      location_country: "Germany",
      location_radius_km: null,
      disciplines: ["Jumping"],
      levels: ["1.40m"],
      breeds: ["Hanoverian"],
      age: 7,
      height_hands: 16.2,
      height_cm: 168,
      sex: "Gelding",
      sire: "Cornet Obolensky",
      dam: "Callista",
      dam_sire: "Casall",
      characteristics: ["Forward", "Brave", "Careful", "Scope", "Easy to Ride"],
      price_min: 60000,
      price_max: 70000,
      currency: "EUR",
      description: "Maestro is an exceptional 7-year-old Hanoverian gelding with a proven competition record at the 1.40m level. With his powerful, elastic movement and careful jumping technique, he has all the qualities of a future Grand Prix horse. He is well-mannered both in the stable and under saddle, making him suitable for an ambitious amateur or professional rider looking to move up the levels. Recently vetted with clean x-rays, he's ready for his new partnership.",
      photos: [
        "https://cdn.pixabay.com/photo/2018/04/14/16/29/horse-3319234_1280.jpg",
        "https://cdn.pixabay.com/photo/2018/01/05/08/19/horse-3062029_1280.jpg",
        "https://cdn.pixabay.com/photo/2016/11/23/17/56/horse-1854175_1280.jpg",
        "https://cdn.pixabay.com/photo/2018/01/03/18/06/horse-3059565_1280.jpg"
      ],
      videos: []
    };
    this.createHorse(horse1);
    
    const horse2: InsertHorse = {
      owner_id: 1,
      name: "Bella",
      location_country: "Germany",
      location_radius_km: null,
      disciplines: ["Dressage"],
      levels: ["Medium", "Advanced"],
      breeds: ["Holsteiner"],
      age: 6,
      height_hands: 16.1,
      height_cm: 165,
      sex: "Mare",
      sire: "Bentley",
      dam: "Diana",
      dam_sire: "De Niro",
      characteristics: ["Sensitive", "Athletic", "Talented"],
      price_min: 40000,
      price_max: 50000,
      currency: "EUR",
      description: "Bella is a beautiful and talented Holsteiner mare with exceptional dressage potential. She has three outstanding gaits and a wonderful temperament. Already competing successfully at Medium level.",
      photos: [
        "https://cdn.pixabay.com/photo/2016/05/25/13/55/horse-1414889_1280.jpg",
        "https://cdn.pixabay.com/photo/2016/11/08/05/05/white-1807347_1280.jpg",
        "https://cdn.pixabay.com/photo/2015/08/17/14/29/horse-892509_1280.jpg"
      ],
      videos: []
    };
    this.createHorse(horse2);
    
    const horse3: InsertHorse = {
      owner_id: 1,
      name: "Cassini",
      location_country: "Netherlands",
      location_radius_km: null,
      disciplines: ["Jumping"],
      levels: ["1.30m", "1.40m"],
      breeds: ["Dutch Warmblood"],
      age: 8,
      height_hands: 17.0,
      height_cm: 173,
      sex: "Gelding",
      sire: "Cassini II",
      dam: "Elegance",
      dam_sire: "Heartbreaker",
      characteristics: ["Scope", "Brave", "Bold"],
      price_min: 80000,
      price_max: 90000,
      currency: "EUR",
      description: "Cassini is a powerful 8-year-old Dutch Warmblood with plenty of scope and ability. Already competing successfully at 1.40m level with clear rounds at international shows.",
      photos: [
        "https://cdn.pixabay.com/photo/2017/03/27/14/33/animal-2179133_1280.jpg",
        "https://cdn.pixabay.com/photo/2020/11/10/19/32/horse-5731147_1280.jpg",
        "https://cdn.pixabay.com/photo/2015/09/09/17/55/horse-932766_1280.jpg"
      ],
      videos: []
    };
    this.createHorse(horse3);
    
    const horse4: InsertHorse = {
      owner_id: 1,
      name: "Quantum",
      location_country: "Netherlands",
      location_radius_km: null,
      disciplines: ["Jumping", "Eventing"],
      levels: ["1.30m", "CCI2*"],
      breeds: ["KWPN"],
      age: 9,
      height_hands: 16.3,
      height_cm: 170,
      sex: "Gelding",
      sire: "Quidam de Revel",
      dam: "Fernanda",
      dam_sire: "For Pleasure",
      characteristics: ["Versatile", "Brave", "Athletic"],
      price_min: 70000,
      price_max: 75000,
      currency: "EUR",
      description: "Quantum is a versatile KWPN gelding with experience in both jumping and eventing. He has a wonderful temperament and is suitable for an ambitious amateur or young professional.",
      photos: [
        "https://cdn.pixabay.com/photo/2016/07/20/23/26/horse-1531692_1280.jpg",
        "https://cdn.pixabay.com/photo/2016/12/31/21/40/animal-1943371_1280.jpg",
        "https://cdn.pixabay.com/photo/2015/09/14/21/10/horse-940275_1280.jpg"
      ],
      videos: []
    };
    this.createHorse(horse4);
  }
  
  // Special direct access method for admin purposes
  getInternalHorsesMap(): Map<number, Horse> {
    return this.horses;
  }

  // Horse methods
  async getHorses(): Promise<Horse[]> {
    return Array.from(this.horses.values());
  }
  
  async getHorseById(id: number): Promise<Horse | undefined> {
    return this.horses.get(id);
  }
  
  async getHorsesByFilters(filters: any): Promise<Horse[]> {
    // Enhanced debugging for filters
    console.log("MemStorage.getHorsesByFilters - filters:", JSON.stringify(filters, null, 2));
    console.log("MemStorage.getHorsesByFilters - filter types:", 
      Object.entries(filters).map(([k, v]) => `${k}: ${typeof v}`).join(', '));
    
    const horses = Array.from(this.horses.values());
    console.log("MemStorage.getHorsesByFilters - all horses:", horses.map(h => ({ 
      id: h.id, 
      name: h.name, 
      owner_id: h.owner_id,
      age: h.age,
      height_hands: h.height_hands
    })));
    
    // If no filters are provided (empty object), return all horses
    if (Object.keys(filters).length === 0) {
      console.log("MemStorage.getHorsesByFilters - no filters provided, returning all horses");
      return horses;
    }
    
    if (filters.owner_id !== undefined && Object.keys(filters).length === 1) {
      // Special case when filtering by owner_id only
      console.log(`MemStorage.getHorsesByFilters - filtering by owner_id ${filters.owner_id} specifically`);
      
      const ownerHorses = horses.filter(horse => horse.owner_id === filters.owner_id);
      console.log(`MemStorage.getHorsesByFilters - found ${ownerHorses.length} horses for owner ${filters.owner_id}:`, 
        ownerHorses.map(h => ({ id: h.id, name: h.name, owner_id: h.owner_id })));
      
      return ownerHorses;
    }
    
    return horses.filter(horse => {
      // Filter by owner_id if specified
      if (filters.owner_id !== undefined && horse.owner_id !== filters.owner_id) {
        return false;
      }
      
      // Filter by disciplines if specified
      if (filters.disciplines && filters.disciplines.length > 0) {
        if (!horse.disciplines.some(d => filters.disciplines.includes(d))) {
          return false;
        }
      }
      
      // Filter by breeds if specified
      if (filters.breeds && filters.breeds.length > 0) {
        if (!horse.breeds.some(b => filters.breeds.includes(b))) {
          return false;
        }
      }
      
      // Filter by sexes if specified (renamed from sex to sexes to match client)
      if (filters.sexes && filters.sexes.length > 0) {
        if (!filters.sexes.includes(horse.sex)) {
          return false;
        }
      }
      
      // Filter by age range if specified
      if (filters.age_min !== undefined && filters.age_min !== null) {
        if (horse.age < filters.age_min) {
          return false;
        }
      }
      
      if (filters.age_max !== undefined && filters.age_max !== null) {
        if (horse.age > filters.age_max) {
          return false;
        }
      }
      
      // Filter by location if specified
      if (filters.location_country && horse.location_country !== filters.location_country) {
        return false;
      }
      
      // Filter by young horse special filter (under 3 years old OR null height)
      if (filters.young_horse === true) {
        if (!(horse.age < 3 || horse.height_hands === null)) {
          return false;
        }
      }
      
      // Filter by height range if specified (only if not using young_horse filter)
      if (!filters.young_horse) {
        if (filters.height_min !== undefined && filters.height_min !== null) {
          if (horse.height_hands < filters.height_min) {
            return false;
          }
        }
        
        if (filters.height_max !== undefined && filters.height_max !== null) {
          if (horse.height_hands > filters.height_max) {
            return false;
          }
        }
      }
      
      // Filter by price range if specified
      if (filters.price_min !== undefined && filters.price_min !== null) {
        if (horse.price_max < filters.price_min) {
          return false;
        }
      }
      
      if (filters.price_max !== undefined && filters.price_max !== null) {
        if (horse.price_min > filters.price_max) {
          return false;
        }
      }
      
      // Filter by bloodlines - sire matching (case-insensitive partial match)
      if (filters.sire && filters.sire.trim()) {
        const searchSire = filters.sire.trim().toLowerCase();
        const horseSire = horse.sire ? horse.sire.toLowerCase() : '';
        if (!horseSire.includes(searchSire)) {
          return false;
        }
      }
      
      // Filter by bloodlines - dam sire matching (case-insensitive partial match)
      if (filters.dam_sire && filters.dam_sire.trim()) {
        const searchDamSire = filters.dam_sire.trim().toLowerCase();
        const horseDamSire = horse.dam_sire ? horse.dam_sire.toLowerCase() : '';
        if (!horseDamSire.includes(searchDamSire)) {
          return false;
        }
      }

      // Filter by other disciplines
      if (filters.other_disciplines && filters.other_disciplines.length > 0) {
        const horseOtherDisciplines = horse.other_disciplines || [];
        const hasMatch = filters.other_disciplines.some((d: string) =>
          horseOtherDisciplines.includes(d)
        );
        if (!hasMatch) return false;
      }
      
      return true;
    });
  }
  
  async createHorse(horse: InsertHorse): Promise<Horse> {
    const id = this.horseId++;
    const newHorse: Horse = { id, ...horse, created_at: new Date() };
    
    // Update the local map
    this.horses.set(id, newHorse);
    
    // Make sure global storage is correctly synchronized with our local state
    if (global.__persistent_storage) {
      // Update both the counter and the actual horses map in global storage
      global.__persistent_storage.horseId = this.horseId;
      global.__persistent_storage.horses = this.horses;
      
      // Save to disk for persistence across application restarts
      saveStorageToDisk();
      
      console.log(`MemStorage: Synchronized global storage, now has ${global.__persistent_storage.horses.size} horses`);
      console.log(`MemStorage: Global horse IDs:`, Array.from(global.__persistent_storage.horses.keys()));
    } else {
      console.warn("MemStorage: Warning - global.__persistent_storage is not initialized!");
    }
    
    console.log(`MemStorage: Created new horse with ID ${id}, name: ${horse.name}`);
    console.log(`MemStorage: Total horses after creation: ${this.horses.size}`);
    return newHorse;
  }
  
  async updateHorse(id: number, update: Partial<Horse>): Promise<Horse | undefined> {
    // Log incoming update data
    console.log("MemStorage.updateHorse - update data:", JSON.stringify(update, null, 2));
    
    const horse = this.horses.get(id);
    if (!horse) {
      return undefined;
    }
    
    // Ensure array fields are handled properly
    const updateData = {
      ...update,
      disciplines: update.disciplines || horse.disciplines,
      levels: update.levels || horse.levels,
      breeds: update.breeds || horse.breeds,
      characteristics: update.characteristics || horse.characteristics,
      photos: update.photos || horse.photos,
      videos: update.videos || horse.videos
    };
    
    // Create a clean copy of the horse without the legacy price field
    let updatedHorse = { ...horse, ...updateData };
    
    // If we have price_min and price_max fields, remove any legacy price field
    if ('price_min' in updateData && 'price_max' in updateData && 'price' in updatedHorse) {
      // Create a new object without the price field
      const { price, ...horseWithoutPrice } = updatedHorse;
      updatedHorse = horseWithoutPrice;
      console.log("Removed legacy 'price' field from horse to prevent conflicts with price_min/price_max");
    }
    
    this.horses.set(id, updatedHorse);
    
    // Make sure global storage is synced with our local state
    if (global.__persistent_storage) {
      // Direct reference update to ensure global storage stays in sync
      global.__persistent_storage.horses = this.horses;
      
      // Save to disk for persistence across application restarts
      saveStorageToDisk();
      
      console.log(`MemStorage: Synchronized global storage after update, now has ${global.__persistent_storage.horses.size} horses`);
    } else {
      console.warn("MemStorage: Warning - global.__persistent_storage is not initialized!");
    }
    
    // Log the result
    console.log("MemStorage.updateHorse - result:", JSON.stringify(updatedHorse, null, 2));
    
    return updatedHorse;
  }
  
  async deleteHorse(id: number): Promise<boolean> {
    console.log(`MemStorage.deleteHorse - Attempting to delete horse with ID: ${id}`);
    const exists = this.horses.has(id);
    if (exists) {
      const horse = this.horses.get(id);
      console.log(`MemStorage.deleteHorse - Found horse: ${JSON.stringify({
        id: horse?.id,
        name: horse?.name,
        owner_id: horse?.owner_id
      })}`);
      
      // Delete from local map
      this.horses.delete(id);
      
      // Make sure global storage is synced with our local state
      if (global.__persistent_storage) {
        // Direct reference update to ensure global storage stays in sync
        global.__persistent_storage.horses = this.horses;
        
        // Save to disk for persistence across application restarts
        saveStorageToDisk();
        
        console.log(`MemStorage: Synchronized global storage after deletion, now has ${global.__persistent_storage.horses.size} horses`);
        console.log(`MemStorage: Global horse IDs after deletion:`, Array.from(global.__persistent_storage.horses.keys()));
      } else {
        console.warn("MemStorage: Warning - global.__persistent_storage is not initialized!");
      }
      
      console.log(`MemStorage.deleteHorse - Successfully deleted horse with ID: ${id}`);
      console.log(`MemStorage: Total horses after deletion: ${this.horses.size}`);
      console.log(`MemStorage: Remaining horse IDs:`, Array.from(this.horses.keys()));
    } else {
      console.log(`MemStorage.deleteHorse - Horse with ID ${id} not found`);
    }
    return exists;
  }
  
  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const allUsers = Array.from(this.users.values());
    console.log("MemStorage.getUserByEmail - all users:", JSON.stringify(allUsers, null, 2));
    console.log("MemStorage.getUserByEmail - searching for email:", email);
    
    const found = allUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
    console.log("MemStorage.getUserByEmail - found user:", found ? "Yes" : "No");
    
    return found;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const normalizedUser = {
      ...user,
      email: user.email.toLowerCase()
    };
    const newUser: User = { id, ...normalizedUser, created_at: new Date() };
    this.users.set(id, newUser);
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

  async deleteUser(id: number): Promise<boolean> {
    console.log(`MemStorage.deleteUser - Attempting to delete user with ID: ${id}`);
    const exists = this.users.has(id);
    if (exists) {
      const user = this.users.get(id);
      console.log(`MemStorage.deleteUser - Found user: ${JSON.stringify({
        id: user?.id,
        email: user?.email,
        username: user?.username
      })}`);
      
      // Delete user from local map
      this.users.delete(id);
      
      // Also delete all related data
      // Delete user's horses
      const userHorses = Array.from(this.horses.values()).filter(horse => horse.owner_id === id);
      userHorses.forEach(horse => {
        this.horses.delete(horse.id);
        console.log(`MemStorage.deleteUser - Deleted horse: ${horse.name} (ID: ${horse.id})`);
      });

      // Delete user's matches (as customer)
      const userMatches = Array.from(this.matches.values()).filter(match => match.customer_id === id);
      userMatches.forEach(match => {
        this.matches.delete(match.id);
        console.log(`MemStorage.deleteUser - Deleted match: ${match.id}`);
      });

      // Delete user's conversations and messages
      const userConversations = Array.from(this.conversations.values()).filter(
        conv => conv.customer_id === id || conv.owner_id === id
      );
      userConversations.forEach(conv => {
        // Delete messages in this conversation
        const convMessages = Array.from(this.messages.values()).filter(
          msg => msg.customer_id === id || msg.owner_id === id
        );
        convMessages.forEach(msg => {
          this.messages.delete(msg.id);
        });
        
        this.conversations.delete(conv.id);
        console.log(`MemStorage.deleteUser - Deleted conversation: ${conv.id}`);
      });
      
      // Sync with global storage
      if (global.__persistent_storage) {
        global.__persistent_storage.users = this.users;
        global.__persistent_storage.horses = this.horses;
        global.__persistent_storage.matches = this.matches;
        global.__persistent_storage.conversations = this.conversations;
        global.__persistent_storage.messages = this.messages;
        saveStorageToDisk();
        
        console.log(`MemStorage.deleteUser - Synchronized global storage after deletion`);
      }
      
      console.log(`MemStorage.deleteUser - Successfully deleted user with ID: ${id} and all related data`);
    } else {
      console.log(`MemStorage.deleteUser - User with ID ${id} not found`);
    }
    return exists;
  }
  
  async updateUserSubscription(id: number, subscriptionData: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    subscription_plan?: string;
    subscription_end_date?: Date;
  }): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...subscriptionData };
    this.users.set(id, updatedUser);
    saveStorageToDisk();
    return updatedUser;
  }

  // Email verification methods
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const allUsers = Array.from(this.users.values());
    return allUsers.find(user => user.verification_token === token);
  }

  async updateUserVerification(id: number, verified: boolean, token?: string | null, expires?: Date | null): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updateData: any = { email_verified: verified };
    if (token !== undefined) updateData.verification_token = token;
    if (expires !== undefined) updateData.verification_token_expires = expires;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    saveStorageToDisk();
    return updatedUser;
  }
  
  async isUserUnsubscribed(email: string): Promise<boolean> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return user?.email_unsubscribed ?? false;
  }
  
  async setUserUnsubscribed(email: string): Promise<void> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (user) {
      user.email_unsubscribed = true;
      this.users.set(user.id, user);
      saveStorageToDisk();
    }
  }
  
  // Reminder token methods (for subscription magic links)
  async setReminderToken(userId: number, hashedToken: string, expiresAt: Date): Promise<void> {
    if (!global.reminderTokens) {
      global.reminderTokens = new Map();
    }
    global.reminderTokens.set(hashedToken, { userId, expiresAt });
  }
  
  async getUserByReminderToken(hashedToken: string): Promise<User | undefined> {
    if (!global.reminderTokens) {
      return undefined;
    }
    const tokenData = global.reminderTokens.get(hashedToken);
    if (!tokenData) {
      return undefined;
    }
    // Check if token expired
    if (new Date() > tokenData.expiresAt) {
      global.reminderTokens.delete(hashedToken);
      return undefined;
    }
    return this.getUserById(tokenData.userId);
  }
  
  async deleteReminderToken(hashedToken: string): Promise<void> {
    if (global.reminderTokens) {
      global.reminderTokens.delete(hashedToken);
    }
  }
  
  // Legacy Owner methods
  async getOwners(): Promise<Owner[]> {
    return Array.from(this.users.values()).filter(user => user.is_selling);
  }
  
  async getOwnerById(id: number): Promise<Owner | undefined> {
    const user = this.users.get(id);
    return user && user.is_selling ? user : undefined;
  }
  
  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    const user = Array.from(this.users.values()).find(u => u.email === email && u.is_selling);
    return user;
  }
  
  async createOwner(owner: InsertOwner): Promise<Owner> {
    return this.createUser({ ...owner, is_selling: true });
  }
  
  // Legacy Customer methods
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.users.values()).filter(user => user.is_searching);
  }
  
  async getCustomerById(id: number): Promise<Customer | undefined> {
    const user = this.users.get(id);
    return user && user.is_searching ? user : undefined;
  }
  
  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const user = Array.from(this.users.values()).find(u => u.email === email && u.is_searching);
    return user;
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return this.createUser({ ...customer, is_searching: true });
  }
  
  async updateCustomer(id: number, update: Partial<Customer>): Promise<Customer> {
    const user = await this.getUserById(id);
    if (!user || !user.is_searching) throw new Error("Customer not found");
    
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
    return newMatch;
  }
  
  async updateMatch(id: number, update: Partial<Match>): Promise<Match> {
    const match = this.matches.get(id);
    if (!match) throw new Error("Match not found");
    
    const updatedMatch = { ...match, ...update };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }
  
  // Message methods
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }
  
  async getMessageById(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesByConversationId(customerId: number, ownerId: number, horseId: number): Promise<Message[]> {
    try {
      // Get all messages for this conversation
      const conversationMessages = Array.from(this.messages.values())
        .filter(message => 
          message.customer_id === customerId && 
          message.owner_id === ownerId && 
          message.horse_id === horseId
        );
      
      // Sort by date (handling both Date objects and string dates)
      return conversationMessages.sort((a, b) => {
        const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
        const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
        return dateA.getTime() - dateB.getTime();
      });
    } catch (error) {
      console.error("Error in getMessagesByConversationId:", error);
      return [];
    }
  }
  
  async updateMessage(id: number, update: Partial<Message>): Promise<Message> {
    const message = this.messages.get(id);
    if (!message) {
      throw new Error(`Message with ID ${id} not found`);
    }
    
    const updatedMessage = { ...message, ...update };
    this.messages.set(id, updatedMessage);
    saveStorageToDisk(); // Save changes to disk
    
    return updatedMessage;
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = { id, ...message, created_at: new Date(), is_read: false };
    this.messages.set(id, newMessage);
    
    // Update or create conversation
    let conversation = Array.from(this.conversations.values()).find(
      conv => conv.customer_id === message.customer_id && 
              conv.owner_id === message.owner_id && 
              conv.horse_id === message.horse_id
    );
    
    if (conversation) {
      conversation.last_message_id = id;
      conversation.last_message_time = newMessage.created_at;
      conversation.unread_count += 1;
      this.conversations.set(conversation.id, conversation);
    } else {
      this.createConversation({
        customer_id: message.customer_id,
        owner_id: message.owner_id,
        horse_id: message.horse_id
      });
    }
    
    return newMessage;
  }
  
  // Conversation methods
  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }
  
  async getConversationById(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async getConversationsByCustomerId(customerId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.customer_id === customerId)
      .sort((a, b) => {
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        
        try {
          // Convert string dates to Date objects if needed
          const aDate = typeof a.last_message_time === 'string' ? new Date(a.last_message_time) : a.last_message_time;
          const bDate = typeof b.last_message_time === 'string' ? new Date(b.last_message_time) : b.last_message_time;
          
          return bDate.getTime() - aDate.getTime();
        } catch (err) {
          console.error('Error sorting conversations:', err);
          return 0; // Default sort order if we can't compare dates
        }
      });
  }
  
  async getConversationsByOwnerId(ownerId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.owner_id === ownerId)
      .sort((a, b) => {
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        
        try {
          // Convert string dates to Date objects if needed
          const aDate = typeof a.last_message_time === 'string' ? new Date(a.last_message_time) : a.last_message_time;
          const bDate = typeof b.last_message_time === 'string' ? new Date(b.last_message_time) : b.last_message_time;
          
          return bDate.getTime() - aDate.getTime();
        } catch (err) {
          console.error('Error sorting conversations:', err);
          return 0; // Default sort order if we can't compare dates
        }
      });
  }
  
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationId++;
    const newConversation: Conversation = { 
      id, 
      ...conversation, 
      last_message_id: null, 
      last_message_time: null,
      unread_count: 0
    };
    this.conversations.set(id, newConversation);
    return newConversation;
  }
  
  async updateConversation(id: number, update: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation) throw new Error("Conversation not found");
    
    const updatedConversation = { ...conversation, ...update };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async deleteConversation(id: number): Promise<boolean> {
    const deleted = this.conversations.delete(id);
    if (deleted) {
      saveStorageToDisk();
    }
    return deleted;
  }

  // Saved Search methods - stub implementations for MemStorage
  async getSavedSearches(): Promise<SavedSearch[]> {
    return [];
  }

  async getSavedSearchById(id: number): Promise<SavedSearch | undefined> {
    return undefined;
  }

  async getSavedSearchesByUserId(userId: number): Promise<SavedSearch[]> {
    return [];
  }

  async createSavedSearch(savedSearch: InsertSavedSearch): Promise<SavedSearch> {
    throw new Error("Saved searches not implemented in MemStorage - use DatabaseStorage");
  }

  async updateSavedSearch(id: number, savedSearch: Partial<SavedSearch>): Promise<SavedSearch> {
    throw new Error("Saved searches not implemented in MemStorage - use DatabaseStorage");
  }

  async deleteSavedSearch(id: number): Promise<boolean> {
    return false;
  }

  // Search Notification methods - stub implementations for MemStorage
  async getSearchNotifications(): Promise<SearchNotification[]> {
    return [];
  }

  async createSearchNotification(notification: InsertSearchNotification): Promise<SearchNotification> {
    throw new Error("Search notifications not implemented in MemStorage - use DatabaseStorage");
  }

  async getNotificationsBySearchId(savedSearchId: number): Promise<SearchNotification[]> {
    return [];
  }
  
  // Admin analytics methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => {
      const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
      const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }
  
  async getAllHorses(): Promise<Horse[]> {
    return Array.from(this.horses.values()).sort((a, b) => {
      const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
      const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }
  
  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => {
      const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
      const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }
  
  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort((a, b) => {
      const dateA = a.last_message_time instanceof Date ? a.last_message_time : new Date(a.last_message_time);
      const dateB = b.last_message_time instanceof Date ? b.last_message_time : new Date(b.last_message_time);
      return dateB.getTime() - dateA.getTime();
    });
  }
  
  async getAllMatches(): Promise<Match[]> {
    return Array.from(this.matches.values()).sort((a, b) => {
      const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
      const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }
  
  // Horse deletion response methods
  async createHorseDeletionResponse(response: InsertHorseDeletionResponse): Promise<HorseDeletionResponse> {
    const newResponse: HorseDeletionResponse = {
      ...response,
      id: this.horseDeletionResponseId++,
      created_at: new Date()
    };
    
    this.horseDeletionResponses.set(newResponse.id, newResponse);
    saveStorageToDisk(); // Persist to disk
    return newResponse;
  }
  
  async getHorseDeletionResponses(): Promise<HorseDeletionResponse[]> {
    return Array.from(this.horseDeletionResponses.values()).sort((a, b) => {
      const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
      const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }
  
  async getHorseDeletionResponsesByUserId(userId: number): Promise<HorseDeletionResponse[]> {
    return Array.from(this.horseDeletionResponses.values())
      .filter(response => response.user_id === userId)
      .sort((a, b) => {
        const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
        const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
  }
  
  // Push Subscription methods - stub implementations for MemStorage
  async createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    throw new Error("Push subscriptions not implemented in MemStorage - use DatabaseStorage");
  }
  
  async getPushSubscriptionsByUserId(userId: number): Promise<PushSubscription[]> {
    return [];
  }
  
  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return [];
  }
  
  async deletePushSubscription(endpoint: string): Promise<boolean> {
    return false;
  }
  
  async updatePushPreferences(userId: number, preferences: {
    notify_matches?: boolean;
    notify_messages?: boolean;
    notify_updates?: boolean;
    notify_digest?: boolean;
  }): Promise<void> {
    throw new Error("Push preferences not implemented in MemStorage - use DatabaseStorage");
  }
  
  // Login tracking and analytics methods - stub implementations for MemStorage
  async trackLoginEvent(userId: number): Promise<void> {
    // No-op for MemStorage - tracking only works with DatabaseStorage
  }
  
  async getDailyActiveUsers(date?: Date): Promise<number> {
    return 0;
  }
  
  async getWeeklyActiveUsers(date?: Date): Promise<number> {
    return 0;
  }
  
  async getMonthlyActiveUsers(date?: Date): Promise<number> {
    return 0;
  }
  
  async getLoginTrend(days: number): Promise<Array<{ date: string; count: number }>> {
    return [];
  }
  
  async getLoginTrendMonthly(months: number): Promise<Array<{ month: string; count: number }>> {
    return [];
  }
  
  // Message and conversation analytics methods - stub implementations for MemStorage
  async getDailyMessages(date?: Date): Promise<number> {
    return 0;
  }
  
  async getWeeklyMessages(date?: Date): Promise<number> {
    return 0;
  }
  
  async getMonthlyMessages(date?: Date): Promise<number> {
    return 0;
  }
  
  async getMessageTrend(days: number): Promise<Array<{ date: string; count: number }>> {
    return [];
  }
  
  async getDailyConversations(date?: Date): Promise<number> {
    return 0;
  }
  
  async getWeeklyConversations(date?: Date): Promise<number> {
    return 0;
  }
  
  async getMonthlyConversations(date?: Date): Promise<number> {
    return 0;
  }
  
  async getConversationTrend(days: number): Promise<Array<{ date: string; count: number }>> {
    return [];
  }
  
  async getConversationTrendMonthly(months: number): Promise<Array<{ month: string; count: number }>> {
    return [];
  }
  
  async getLoginTrendAllTime(): Promise<Array<{ month: string; count: number }>> {
    return [];
  }
  
  async getLoginTrendAllTimeDaily(): Promise<Array<{ date: string; count: number }>> {
    return [];
  }
  
  async getMessageTrendAllTime(): Promise<Array<{ date: string; count: number }>> {
    return [];
  }
  
  async getConversationTrendAllTime(): Promise<Array<{ month: string; count: number }>> {
    return [];
  }
  
  async getConversationTrendAllTimeDaily(): Promise<Array<{ date: string; count: number }>> {
    return [];
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

  // Alias method for backward compatibility with admin routes
  async getUser(id: number): Promise<User | undefined> {
    return this.getUserById(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return result;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const normalizedUser = {
      ...user,
      email: user.email.toLowerCase()
    };
    const [result] = await db.insert(users).values(normalizedUser).returning();
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

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Delete related data first due to foreign key constraints
      
      // Delete user's horses
      await db.delete(horses).where(eq(horses.owner_id, id));
      
      // Delete user's matches
      await db.delete(matches).where(eq(matches.customer_id, id));
      
      // Delete user's messages
      await db.delete(messages).where(or(
        eq(messages.customer_id, id),
        eq(messages.owner_id, id)
      ));
      
      // Delete user's conversations
      await db.delete(conversations).where(or(
        eq(conversations.customer_id, id),
        eq(conversations.owner_id, id)
      ));
      
      // Finally delete the user
      const result = await db.delete(users).where(eq(users.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async updateUserSubscription(id: number, subscriptionData: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    subscription_plan?: string;
    subscription_end_date?: Date;
  }): Promise<User> {
    const [result] = await db
      .update(users)
      .set(subscriptionData)
      .where(eq(users.id, id))
      .returning();
    
    if (!result) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return result;
  }

  // Email verification methods
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.verification_token, token));
    return result;
  }

  async updateUserVerification(id: number, verified: boolean, token?: string | null, expires?: Date | null): Promise<User> {
    const updateData: any = { email_verified: verified };
    if (token !== undefined) updateData.verification_token = token;
    if (expires !== undefined) updateData.verification_token_expires = expires;

    const [result] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    if (!result) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return result;
  }
  
  async isUserUnsubscribed(email: string): Promise<boolean> {
    const result = await db
      .select({ email_unsubscribed: users.email_unsubscribed })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0]?.email_unsubscribed ?? false;
  }
  
  async setUserUnsubscribed(email: string): Promise<void> {
    await db
      .update(users)
      .set({ email_unsubscribed: true })
      .where(eq(users.email, email));
  }
  
  // Reminder token methods (for subscription magic links)
  async setReminderToken(userId: number, hashedToken: string, expiresAt: Date): Promise<void> {
    if (!global.reminderTokens) {
      global.reminderTokens = new Map();
    }
    global.reminderTokens.set(hashedToken, { userId, expiresAt });
  }
  
  async getUserByReminderToken(hashedToken: string): Promise<User | undefined> {
    if (!global.reminderTokens) {
      return undefined;
    }
    const tokenData = global.reminderTokens.get(hashedToken);
    if (!tokenData) {
      return undefined;
    }
    // Check if token expired
    if (new Date() > tokenData.expiresAt) {
      global.reminderTokens.delete(hashedToken);
      return undefined;
    }
    return this.getUserById(tokenData.userId);
  }
  
  async deleteReminderToken(hashedToken: string): Promise<void> {
    if (global.reminderTokens) {
      global.reminderTokens.delete(hashedToken);
    }
  }
  
  // Horse methods
  async getHorses(): Promise<Horse[]> {
    return await db.select().from(horses).orderBy(desc(horses.created_at));
  }

  async getHorseById(id: number): Promise<Horse | undefined> {
    const [horse] = await db.select().from(horses).where(eq(horses.id, id));
    return horse;
  }

  async getHorsesByFilters(filters: any): Promise<Horse[]> {
    console.log("DatabaseStorage.getHorsesByFilters - filters:", JSON.stringify(filters, null, 2));
    console.log("DatabaseStorage.getHorsesByFilters - sire filter:", filters.sire);
    console.log("DatabaseStorage.getHorsesByFilters - dam_sire filter:", filters.dam_sire);
    
    // Get all horses first and filter in JavaScript for now (simpler approach)
    const allHorses = await db.select().from(horses).orderBy(desc(horses.created_at));

    // If no filters are provided, return all horses (most recent first)
    if (Object.keys(filters).length === 0) {
      console.log("DatabaseStorage.getHorsesByFilters - no filters provided, returning all horses");
      return allHorses;
    }
    
    // Filter horses in JavaScript (same logic as MemStorage)
    const filteredHorses = allHorses.filter(horse => {
      // Filter by owner_id if specified
      if (filters.owner_id !== undefined && horse.owner_id !== filters.owner_id) {
        return false;
      }
      
      // Filter by disciplines if specified
      if (filters.disciplines && filters.disciplines.length > 0) {
        if (!horse.disciplines.some(d => filters.disciplines.includes(d))) {
          return false;
        }
      }
      
      // Filter by levels if specified (skip if "any_level" is selected)
      if (filters.levels && filters.levels.length > 0 && !filters.levels.includes("any_level")) {
        if (!horse.levels.some(l => filters.levels.includes(l))) {
          return false;
        }
      }
      
      // Filter by breeds if specified
      if (filters.breeds && filters.breeds.length > 0) {
        if (!horse.breeds.some(b => filters.breeds.includes(b))) {
          return false;
        }
      }
      
      // Filter by sexes if specified
      if (filters.sexes && filters.sexes.length > 0) {
        if (!filters.sexes.includes(horse.sex)) {
          return false;
        }
      }
      
      // Filter by age range if specified
      if (filters.age_min !== undefined && filters.age_min !== null) {
        if (horse.age < filters.age_min) {
          return false;
        }
      }
      
      if (filters.age_max !== undefined && filters.age_max !== null) {
        if (horse.age > filters.age_max) {
          return false;
        }
      }
      
      // Filter by location if specified
      if (filters.location_country && horse.location_country !== filters.location_country) {
        return false;
      }
      
      // Filter by young horse special filter (under 3 years old OR null height)
      if (filters.young_horse === true) {
        if (!(horse.age < 3 || horse.height_hands === null)) {
          return false;
        }
      }
      
      // Filter by height range if specified (only if not using young_horse filter)
      if (!filters.young_horse) {
        if (filters.height_min !== undefined && filters.height_min !== null) {
          if (horse.height_hands === null || horse.height_hands < filters.height_min) {
            return false;
          }
        }
        
        if (filters.height_max !== undefined && filters.height_max !== null) {
          if (horse.height_hands !== null && horse.height_hands > filters.height_max) {
            return false;
          }
        }
      }
      
      // Filter by price range if specified
      if (filters.price_min !== undefined && filters.price_min !== null) {
        if (horse.price_max < filters.price_min) {
          return false;
        }
      }
      
      if (filters.price_max !== undefined && filters.price_max !== null) {
        if (horse.price_min > filters.price_max) {
          return false;
        }
      }
      
      // Filter by bloodlines - sire matching (case-insensitive partial match)
      if (filters.sire && filters.sire.trim()) {
        const searchSire = filters.sire.trim().toLowerCase();
        const horseSire = horse.sire ? horse.sire.toLowerCase() : '';
        if (!horseSire.includes(searchSire)) {
          return false;
        }
      }
      
      // Filter by bloodlines - dam sire matching (case-insensitive partial match)
      if (filters.dam_sire && filters.dam_sire.trim()) {
        const searchDamSire = filters.dam_sire.trim().toLowerCase();
        const horseDamSire = horse.dam_sire ? horse.dam_sire.toLowerCase() : '';
        if (!horseDamSire.includes(searchDamSire)) {
          return false;
        }
      }

      // Filter by other disciplines
      if (filters.other_disciplines && filters.other_disciplines.length > 0) {
        const horseOtherDisciplines = horse.other_disciplines || [];
        const hasMatch = filters.other_disciplines.some((d: string) =>
          horseOtherDisciplines.includes(d)
        );
        if (!hasMatch) return false;
      }
      
      return true;
    });
    
    console.log(`DatabaseStorage.getHorsesByFilters - found ${filteredHorses.length} horses after filtering`);
    
    return filteredHorses;
  }

  async createHorse(horse: InsertHorse): Promise<Horse> {
    const [newHorse] = await db.insert(horses).values(horse).returning();
    return newHorse;
  }

  async updateHorse(id: number, update: Partial<Horse>): Promise<Horse | undefined> {
    // Log the incoming update data
    console.log("DatabaseStorage.updateHorse - update data:", JSON.stringify(update, null, 2));
    
    // Get the current horse data
    const [currentHorse] = await db.select().from(horses).where(eq(horses.id, id));
    if (!currentHorse) {
      return undefined;
    }
    
    // Ensure array fields are handled properly (if they're not provided, use the existing values)
    const updateData = {
      ...update,
      disciplines: update.disciplines || currentHorse.disciplines,
      levels: update.levels || currentHorse.levels,
      breeds: update.breeds || currentHorse.breeds,
      characteristics: update.characteristics || currentHorse.characteristics,
      photos: update.photos || currentHorse.photos,
      videos: update.videos || currentHorse.videos
    };
    
    // Perform the update
    const [updatedHorse] = await db
      .update(horses)
      .set(updateData)
      .where(eq(horses.id, id))
      .returning();
    
    // Log the resulting updated horse
    console.log("DatabaseStorage.updateHorse - result:", JSON.stringify(updatedHorse, null, 2));
    
    return updatedHorse;
  }

  async deleteHorse(id: number): Promise<boolean> {
    try {
      console.log(`DatabaseStorage.deleteHorse - Attempting to delete horse with ID: ${id}`);
      
      // First, delete all related records to maintain referential integrity
      
      // Delete all matches for this horse
      const deletedMatches = await db.delete(matches).where(eq(matches.horse_id, id)).returning({ id: matches.id });
      console.log(`DatabaseStorage.deleteHorse - Deleted ${deletedMatches.length} matches`);
      
      // Delete all messages for this horse
      const deletedMessages = await db.delete(messages).where(eq(messages.horse_id, id)).returning({ id: messages.id });
      console.log(`DatabaseStorage.deleteHorse - Deleted ${deletedMessages.length} messages`);
      
      // Delete all conversations for this horse
      const deletedConversations = await db.delete(conversations).where(eq(conversations.horse_id, id)).returning({ id: conversations.id });
      console.log(`DatabaseStorage.deleteHorse - Deleted ${deletedConversations.length} conversations`);
      
      // Finally, delete the horse itself
      const result = await db.delete(horses).where(eq(horses.id, id)).returning({ id: horses.id });
      const success = result.length > 0;
      
      console.log(`DatabaseStorage.deleteHorse - Horse deletion ${success ? 'successful' : 'failed'}`);
      return success;
    } catch (error) {
      console.error(`DatabaseStorage.deleteHorse - Error deleting horse ${id}:`, error);
      throw error; // Re-throw to let the calling code handle it
    }
  }

  // Legacy methods for backward compatibility
  async getOwners(): Promise<Owner[]> {
    return await db.select().from(users).where(eq(users.is_selling, true));
  }
  
  async getOwnerById(id: number): Promise<Owner | undefined> {
    // Get user with is_selling = true
    const [owner] = await db.select().from(users)
      .where(and(eq(users.id, id), eq(users.is_selling, true)));
    return owner;
  }
  
  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    // Get user with is_selling = true
    const [owner] = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.is_selling, true)));
    return owner;
  }
  
  async createOwner(owner: InsertOwner): Promise<Owner> {
    // Create user with is_selling = true
    const [newOwner] = await db.insert(users).values({
      ...owner,
      is_selling: true,
      is_searching: owner.is_searching ?? false
    }).returning();
    return newOwner;
  }
  
  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(users).where(eq(users.is_searching, true));
  }
  
  async getCustomerById(id: number): Promise<Customer | undefined> {
    // Get user with is_searching = true
    const [customer] = await db.select().from(users)
      .where(and(eq(users.id, id), eq(users.is_searching, true)));
    return customer;
  }
  
  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    // Get user with is_searching = true
    const [customer] = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.is_searching, true)));
    return customer;
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    // Create user with is_searching = true
    const [newCustomer] = await db.insert(users).values({
      ...customer,
      is_searching: true,
      is_selling: customer.is_selling ?? false
    }).returning();
    return newCustomer;
  }
  
  async updateCustomer(id: number, update: Partial<Customer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(users)
      .set(update)
      .where(and(eq(users.id, id), eq(users.is_searching, true)))
      .returning();
    
    if (!updatedCustomer) {
      throw new Error("Customer not found");
    }
    
    return updatedCustomer;
  }

  // Match methods
  async getMatches(): Promise<Match[]> {
    return await db.select().from(matches);
  }

  async getMatchById(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
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

  // Message methods
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesByConversationId(customerId: number, ownerId: number, horseId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.customer_id, customerId),
          eq(messages.owner_id, ownerId),
          eq(messages.horse_id, horseId)
        )
      )
      .orderBy(asc(messages.created_at));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async updateMessage(id: number, update: Partial<Message>): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set(update)
      .where(eq(messages.id, id))
      .returning();
    
    if (!updatedMessage) {
      throw new Error("Message not found");
    }
    
    return updatedMessage;
  }

  // Conversation methods
  async getConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations);
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getConversationsByCustomerId(customerId: number): Promise<Conversation[]> {
    console.log(`DatabaseStorage.getConversationsByCustomerId - searching for customerId: ${customerId}`);
    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.customer_id, customerId));
    console.log(`DatabaseStorage.getConversationsByCustomerId - found ${result.length} conversations:`, result);
    return result;
  }

  async getConversationsByOwnerId(ownerId: number): Promise<Conversation[]> {
    console.log(`DatabaseStorage.getConversationsByOwnerId - searching for ownerId: ${ownerId}`);
    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.owner_id, ownerId));
    console.log(`DatabaseStorage.getConversationsByOwnerId - found ${result.length} conversations:`, result);
    return result;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  async updateConversation(id: number, update: Partial<Conversation>): Promise<Conversation> {
    const [updatedConversation] = await db
      .update(conversations)
      .set(update)
      .where(eq(conversations.id, id))
      .returning();
    
    if (!updatedConversation) {
      throw new Error("Conversation not found");
    }
    
    return updatedConversation;
  }

  async deleteConversation(id: number): Promise<boolean> {
    const result = await db
      .delete(conversations)
      .where(eq(conversations.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Saved Search methods
  async getSavedSearches(): Promise<SavedSearch[]> {
    return await db.select().from(savedSearches);
  }

  async getSavedSearchById(id: number): Promise<SavedSearch | undefined> {
    const [search] = await db.select().from(savedSearches).where(eq(savedSearches.id, id));
    return search;
  }

  async getSavedSearchesByUserId(userId: number): Promise<SavedSearch[]> {
    return await db
      .select()
      .from(savedSearches)
      .where(and(eq(savedSearches.user_id, userId), eq(savedSearches.is_active, true)))
      .orderBy(desc(savedSearches.created_at));
  }

  async createSavedSearch(savedSearch: InsertSavedSearch): Promise<SavedSearch> {
    const [newSearch] = await db.insert(savedSearches).values({
      ...savedSearch,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    return newSearch;
  }

  async updateSavedSearch(id: number, update: Partial<SavedSearch>): Promise<SavedSearch> {
    const [updatedSearch] = await db
      .update(savedSearches)
      .set({
        ...update,
        updated_at: new Date()
      })
      .where(eq(savedSearches.id, id))
      .returning();
    
    if (!updatedSearch) {
      throw new Error("Saved search not found");
    }
    
    return updatedSearch;
  }

  async deleteSavedSearch(id: number): Promise<boolean> {
    // Soft delete by setting is_active to false
    const result = await db
      .update(savedSearches)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(savedSearches.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Search Notification methods
  async getSearchNotifications(): Promise<SearchNotification[]> {
    return await db.select().from(searchNotifications);
  }

  async createSearchNotification(notification: InsertSearchNotification): Promise<SearchNotification> {
    const [newNotification] = await db.insert(searchNotifications).values(notification).returning();
    return newNotification;
  }

  async getNotificationsBySearchId(savedSearchId: number): Promise<SearchNotification[]> {
    return await db
      .select()
      .from(searchNotifications)
      .where(eq(searchNotifications.saved_search_id, savedSearchId))
      .orderBy(desc(searchNotifications.sent_at));
  }
  
  // Admin analytics methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.created_at));
  }
  
  async getAllHorses(): Promise<Horse[]> {
    return await db.select().from(horses).orderBy(desc(horses.created_at));
  }
  
  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.created_at));
  }
  
  async getAllConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations).orderBy(desc(conversations.last_message_time));
  }
  
  async getAllMatches(): Promise<Match[]> {
    return await db.select().from(matches).orderBy(desc(matches.created_at));
  }
  
  // Horse deletion response methods
  async createHorseDeletionResponse(response: InsertHorseDeletionResponse): Promise<HorseDeletionResponse> {
    const [newResponse] = await db.insert(horseDeletionResponses).values(response).returning();
    return newResponse;
  }
  
  async getHorseDeletionResponses(): Promise<HorseDeletionResponse[]> {
    return await db.select().from(horseDeletionResponses).orderBy(desc(horseDeletionResponses.created_at));
  }
  
  async getHorseDeletionResponsesByUserId(userId: number): Promise<HorseDeletionResponse[]> {
    return await db
      .select()
      .from(horseDeletionResponses)
      .where(eq(horseDeletionResponses.user_id, userId))
      .orderBy(desc(horseDeletionResponses.created_at));
  }
  
  // Push Subscription methods
  async createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    // Check if this endpoint already exists (same device, different user)
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);
    
    if (existing.length > 0) {
      // Update the existing subscription to the new user
      const [updated] = await db
        .update(pushSubscriptions)
        .set({
          user_id: subscription.user_id,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          created_at: new Date()
        })
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
        .returning();
      return updated;
    }
    
    // Create new subscription
    const [newSubscription] = await db.insert(pushSubscriptions).values(subscription).returning();
    return newSubscription;
  }
  
  async getPushSubscriptionsByUserId(userId: number): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.user_id, userId))
      .orderBy(desc(pushSubscriptions.created_at));
  }
  
  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions);
  }
  
  async deletePushSubscription(endpoint: string): Promise<boolean> {
    const result = await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .returning();
    
    return result.length > 0;
  }
  
  async updatePushPreferences(userId: number, preferences: {
    notify_matches?: boolean;
    notify_messages?: boolean;
    notify_updates?: boolean;
    notify_digest?: boolean;
  }): Promise<void> {
    await db
      .update(pushSubscriptions)
      .set(preferences)
      .where(eq(pushSubscriptions.user_id, userId));
  }
  
  // Login tracking and analytics methods
  async trackLoginEvent(userId: number): Promise<void> {
    await db.insert(loginEvents).values({ user_id: userId });
  }
  
  async getDailyActiveUsers(date: Date = new Date()): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Admin user ID to exclude from analytics
    const ADMIN_USER_ID = 31;
    
    const result = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${loginEvents.user_id})` })
      .from(loginEvents)
      .where(
        and(
          sql`${loginEvents.logged_in_at} >= ${startOfDay}`,
          sql`${loginEvents.logged_in_at} <= ${endOfDay}`,
          sql`${loginEvents.user_id} != ${ADMIN_USER_ID}`
        )
      );
    
    return Number(result[0]?.count || 0);
  }
  
  async getWeeklyActiveUsers(date: Date = new Date()): Promise<number> {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Admin user ID to exclude from analytics
    const ADMIN_USER_ID = 31;
    
    const result = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${loginEvents.user_id})` })
      .from(loginEvents)
      .where(
        and(
          sql`${loginEvents.logged_in_at} >= ${startOfWeek}`,
          sql`${loginEvents.user_id} != ${ADMIN_USER_ID}`
        )
      );
    
    return Number(result[0]?.count || 0);
  }
  
  async getMonthlyActiveUsers(date: Date = new Date()): Promise<number> {
    const startOfMonth = new Date(date);
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Admin user ID to exclude from analytics
    const ADMIN_USER_ID = 31;
    
    const result = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${loginEvents.user_id})` })
      .from(loginEvents)
      .where(
        and(
          sql`${loginEvents.logged_in_at} >= ${startOfMonth}`,
          sql`${loginEvents.user_id} != ${ADMIN_USER_ID}`
        )
      );
    
    return Number(result[0]?.count || 0);
  }
  
  async getLoginTrend(days: number): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    // Admin user ID to exclude from analytics
    const ADMIN_USER_ID = 31;
    
    const result = await db
      .select({
        date: sql<string>`DATE(${loginEvents.logged_in_at})`,
        count: sql<number>`COUNT(DISTINCT ${loginEvents.user_id})`
      })
      .from(loginEvents)
      .where(
        and(
          sql`${loginEvents.logged_in_at} >= ${startDate}`,
          sql`${loginEvents.user_id} != ${ADMIN_USER_ID}`
        )
      )
      .groupBy(sql`DATE(${loginEvents.logged_in_at})`)
      .orderBy(sql`DATE(${loginEvents.logged_in_at})`);
    
    return result.map(r => ({
      date: r.date,
      count: Number(r.count)
    }));
  }
  
  async getLoginTrendMonthly(months: number): Promise<Array<{ month: string; count: number }>> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);
    
    // Admin user ID to exclude from analytics
    const ADMIN_USER_ID = 31;
    
    const result = await db
      .select({
        month: sql<string>`TO_CHAR(${loginEvents.logged_in_at}, 'YYYY-MM')`,
        count: sql<number>`COUNT(DISTINCT ${loginEvents.user_id})`
      })
      .from(loginEvents)
      .where(
        and(
          sql`${loginEvents.logged_in_at} >= ${startDate}`,
          sql`${loginEvents.user_id} != ${ADMIN_USER_ID}`
        )
      )
      .groupBy(sql`TO_CHAR(${loginEvents.logged_in_at}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${loginEvents.logged_in_at}, 'YYYY-MM')`);
    
    return result.map(r => ({
      month: r.month,
      count: Number(r.count)
    }));
  }
  
  // Message and conversation analytics methods
  async getDailyMessages(date: Date = new Date()): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(messages)
      .where(
        and(
          sql`${messages.created_at} >= ${startOfDay}`,
          sql`${messages.created_at} <= ${endOfDay}`
        )
      );
    
    return Number(result[0]?.count || 0);
  }
  
  async getWeeklyMessages(date: Date = new Date()): Promise<number> {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(messages)
      .where(sql`${messages.created_at} >= ${startOfWeek}`);
    
    return Number(result[0]?.count || 0);
  }
  
  async getMonthlyMessages(date: Date = new Date()): Promise<number> {
    const startOfMonth = new Date(date);
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(messages)
      .where(sql`${messages.created_at} >= ${startOfMonth}`);
    
    return Number(result[0]?.count || 0);
  }
  
  async getMessageTrend(days: number): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({
        date: sql<string>`DATE(${messages.created_at})`,
        count: sql<number>`COUNT(*)`
      })
      .from(messages)
      .where(sql`${messages.created_at} >= ${startDate}`)
      .groupBy(sql`DATE(${messages.created_at})`)
      .orderBy(sql`DATE(${messages.created_at})`);
    
    return result.map(r => ({
      date: r.date,
      count: Number(r.count)
    }));
  }
  
  async getDailyConversations(date: Date = new Date()): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Count conversations by their first message time
    const result = await db
      .select({ 
        conversationId: sql<number>`DISTINCT ${messages.customer_id} || '-' || ${messages.owner_id} || '-' || ${messages.horse_id}`,
        firstMessage: sql<Date>`MIN(${messages.created_at})`
      })
      .from(messages)
      .groupBy(sql`${messages.customer_id}, ${messages.owner_id}, ${messages.horse_id}`)
      .having(
        and(
          sql`MIN(${messages.created_at}) >= ${startOfDay}`,
          sql`MIN(${messages.created_at}) <= ${endOfDay}`
        )
      );
    
    return result.length;
  }
  
  async getWeeklyConversations(date: Date = new Date()): Promise<number> {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Count conversations by their first message time
    const result = await db
      .select({ 
        conversationId: sql<number>`DISTINCT ${messages.customer_id} || '-' || ${messages.owner_id} || '-' || ${messages.horse_id}`,
        firstMessage: sql<Date>`MIN(${messages.created_at})`
      })
      .from(messages)
      .groupBy(sql`${messages.customer_id}, ${messages.owner_id}, ${messages.horse_id}`)
      .having(sql`MIN(${messages.created_at}) >= ${startOfWeek}`);
    
    return result.length;
  }
  
  async getMonthlyConversations(date: Date = new Date()): Promise<number> {
    const startOfMonth = new Date(date);
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Count conversations by their first message time
    const result = await db
      .select({ 
        conversationId: sql<number>`DISTINCT ${messages.customer_id} || '-' || ${messages.owner_id} || '-' || ${messages.horse_id}`,
        firstMessage: sql<Date>`MIN(${messages.created_at})`
      })
      .from(messages)
      .groupBy(sql`${messages.customer_id}, ${messages.owner_id}, ${messages.horse_id}`)
      .having(sql`MIN(${messages.created_at}) >= ${startOfMonth}`);
    
    return result.length;
  }
  
  async getConversationTrend(days: number): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    // Count conversations by their first message date
    const result = await db
      .select({
        date: sql<string>`DATE(MIN(${messages.created_at}))`,
        count: sql<number>`COUNT(DISTINCT ${messages.customer_id} || '-' || ${messages.owner_id} || '-' || ${messages.horse_id})`
      })
      .from(messages)
      .groupBy(sql`${messages.customer_id}, ${messages.owner_id}, ${messages.horse_id}`)
      .having(sql`MIN(${messages.created_at}) >= ${startDate}`);
    
    // Group by date and sum the counts
    const dateMap = new Map<string, number>();
    result.forEach(r => {
      const count = dateMap.get(r.date) || 0;
      dateMap.set(r.date, count + 1);
    });
    
    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  
  async getConversationTrendMonthly(months: number): Promise<Array<{ month: string; count: number }>> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);
    
    // Count conversations by their first message month
    const result = await db
      .select({
        month: sql<string>`TO_CHAR(MIN(${messages.created_at}), 'YYYY-MM')`,
        count: sql<number>`COUNT(DISTINCT ${messages.customer_id} || '-' || ${messages.owner_id} || '-' || ${messages.horse_id})`
      })
      .from(messages)
      .groupBy(sql`${messages.customer_id}, ${messages.owner_id}, ${messages.horse_id}`)
      .having(sql`MIN(${messages.created_at}) >= ${startDate}`);
    
    // Group by month and sum the counts
    const monthMap = new Map<string, number>();
    result.forEach(r => {
      const count = monthMap.get(r.month) || 0;
      monthMap.set(r.month, count + 1);
    });
    
    return Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
  
  async getLoginTrendAllTime(): Promise<Array<{ month: string; count: number }>> {
    // Admin user ID to exclude from analytics
    const ADMIN_USER_ID = 31;
    
    // Get all login events grouped by month, no time limit
    const result = await db
      .select({
        month: sql<string>`TO_CHAR(${loginEvents.logged_in_at}, 'YYYY-MM')`,
        count: sql<number>`COUNT(DISTINCT ${loginEvents.user_id})`
      })
      .from(loginEvents)
      .where(sql`${loginEvents.user_id} != ${ADMIN_USER_ID}`)
      .groupBy(sql`TO_CHAR(${loginEvents.logged_in_at}, 'YYYY-MM')`);
    
    return result
      .map(r => ({ month: r.month, count: r.count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
  
  async getConversationTrendAllTime(): Promise<Array<{ month: string; count: number }>> {
    // Count conversations by their first message month, no time limit
    const result = await db
      .select({
        month: sql<string>`TO_CHAR(MIN(${messages.created_at}), 'YYYY-MM')`,
        count: sql<number>`COUNT(DISTINCT ${messages.customer_id} || '-' || ${messages.owner_id} || '-' || ${messages.horse_id})`
      })
      .from(messages)
      .groupBy(sql`${messages.customer_id}, ${messages.owner_id}, ${messages.horse_id}`);
    
    // Group by month and sum the counts
    const monthMap = new Map<string, number>();
    result.forEach(r => {
      const count = monthMap.get(r.month) || 0;
      monthMap.set(r.month, count + 1);
    });
    
    return Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async getLoginTrendAllTimeDaily(): Promise<Array<{ date: string; count: number }>> {
    const ADMIN_USER_ID = 31;
    const result = await db
      .select({
        date: sql<string>`TO_CHAR(${loginEvents.logged_in_at}, 'YYYY-MM-DD')`,
        count: sql<number>`COUNT(DISTINCT ${loginEvents.user_id})`
      })
      .from(loginEvents)
      .where(sql`${loginEvents.user_id} != ${ADMIN_USER_ID}`)
      .groupBy(sql`TO_CHAR(${loginEvents.logged_in_at}, 'YYYY-MM-DD')`);

    return result
      .map(r => ({ date: r.date, count: Number(r.count) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getMessageTrendAllTime(): Promise<Array<{ date: string; count: number }>> {
    const result = await db
      .select({
        date: sql<string>`DATE(${messages.created_at})`,
        count: sql<number>`COUNT(*)`
      })
      .from(messages)
      .groupBy(sql`DATE(${messages.created_at})`)
      .orderBy(sql`DATE(${messages.created_at})`);

    return result.map(r => ({ date: r.date, count: Number(r.count) }));
  }

  async getConversationTrendAllTimeDaily(): Promise<Array<{ date: string; count: number }>> {
    const result = await db
      .select({
        date: sql<string>`TO_CHAR(MIN(${messages.created_at}), 'YYYY-MM-DD')`,
      })
      .from(messages)
      .groupBy(sql`${messages.customer_id}, ${messages.owner_id}, ${messages.horse_id}`);

    const dateMap = new Map<string, number>();
    result.forEach(r => {
      dateMap.set(r.date, (dateMap.get(r.date) || 0) + 1);
    });

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

// Switch to using the database storage
// Choose which storage implementation to use - ALWAYS use database for persistence
const useDatabase = true; // Force database usage to prevent data loss on deployment
console.log(`Using ${useDatabase ? 'DatabaseStorage' : 'MemStorage'} implementation`);

// Use a more persistent storage singleton approach
let storageInstance: IStorage | null = null;

// Export a function to create storage with ability to skip seeding
export function createStorage(skipSeed = false) {
  // If we already have a storage instance, return it to preserve state
  if (storageInstance) {
    console.log("Reusing existing storage instance to preserve state");
    return storageInstance;
  }
  
  console.log("Creating new storage instance");
  if (useDatabase) {
    storageInstance = new DatabaseStorage();
  } else {
    storageInstance = new MemStorage(skipSeed);
  }
  
  return storageInstance;
}

// Create storage once
export const storage = createStorage(false);

// Add a function to completely reset to no horses for clean database functionality
export function resetStorageToEmpty() {
  if (!useDatabase && global.__persistent_storage) {
    // Clear the horses map in global storage
    global.__persistent_storage.horses.clear();
    
    // If we have a live storageInstance, clear that too
    if (storageInstance) {
      const memStorage = storageInstance as MemStorage;
      const horsesMap = memStorage.getInternalHorsesMap();
      horsesMap.clear();
    }
    
    console.log("Completely reset storage - all horses removed from global storage");
    return true;
  }
  return false;
}
