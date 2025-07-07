import { 
  horses, type Horse, type InsertHorse,
  users, type User, type InsertUser, type Owner, type InsertOwner,
  type Customer, type InsertCustomer,
  matches, type Match, type InsertMatch,
  messages, type Message, type InsertMessage,
  conversations, type Conversation, type InsertConversation,
  savedSearches, type SavedSearch, type InsertSavedSearch,
  searchNotifications, type SearchNotification, type InsertSearchNotification
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
  deleteUser(id: number): Promise<boolean>;
  
  // Email verification methods
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  updateUserVerification(id: number, verified: boolean, token?: string | null, expires?: Date | null): Promise<User>;
  
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
  deleteMatchesByUserId(userId: number): Promise<boolean>;
  deleteFavoritesByUserId(userId: number): Promise<boolean>;
  
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
  
  // Admin analytics methods
  getAllUsers(): Promise<User[]>;
  getAllHorses(): Promise<Horse[]>;
  getAllMessages(): Promise<Message[]>;
  getAllConversations(): Promise<Conversation[]>;
  getAllMatches(): Promise<Match[]>;
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
    horseId: number;
    userId: number;
    matchId: number;
    messageId: number;
    conversationId: number;
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
      horseId: global.__persistent_storage.horseId,
      userId: global.__persistent_storage.userId,
      matchId: global.__persistent_storage.matchId,
      messageId: global.__persistent_storage.messageId,
      conversationId: global.__persistent_storage.conversationId,
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
        horseId: data.horseId,
        userId: data.userId,
        matchId: data.matchId,
        messageId: data.messageId,
        conversationId: data.conversationId,
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
  
  private horseId: number;
  private userId: number;
  private matchId: number;
  private messageId: number;
  private conversationId: number;
  
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
      
      this.horseId = global.__persistent_storage.horseId;
      this.userId = global.__persistent_storage.userId;
      this.matchId = global.__persistent_storage.matchId;
      this.messageId = global.__persistent_storage.messageId;
      this.conversationId = global.__persistent_storage.conversationId;
      
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
      
      this.horseId = diskStorage.horseId;
      this.userId = diskStorage.userId;
      this.matchId = diskStorage.matchId;
      this.messageId = diskStorage.messageId;
      this.conversationId = diskStorage.conversationId;
      
      // Save to global for persistence across restarts
      global.__persistent_storage = {
        horses: this.horses,
        users: this.users,
        matches: this.matches,
        messages: this.messages,
        conversations: this.conversations,
        horseId: this.horseId,
        userId: this.userId,
        matchId: this.matchId,
        messageId: this.messageId,
        conversationId: this.conversationId,
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
      
      this.horseId = 1;
      this.userId = 1;
      this.matchId = 1;
      this.messageId = 1;
      this.conversationId = 1;
      
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
        horseId: this.horseId,
        userId: this.userId,
        matchId: this.matchId,
        messageId: this.messageId,
        conversationId: this.conversationId,
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
      
      // Filter by height range if specified
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
    
    const found = allUsers.find(user => user.email === email);
    console.log("MemStorage.getUserByEmail - found user:", found ? "Yes" : "No");
    
    return found;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { id, ...user, created_at: new Date() };
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
  
  async deleteUser(id: number): Promise<boolean> {
    const success = this.users.delete(id);
    saveStorageToDisk();
    return success;
  }
  
  async deleteMatchesByUserId(userId: number): Promise<boolean> {
    const toDelete = Array.from(this.matches.entries())
      .filter(([_, match]) => match.customer_id === userId)
      .map(([id, _]) => id);
    
    toDelete.forEach(id => this.matches.delete(id));
    saveStorageToDisk();
    return true;
  }
  
  async deleteFavoritesByUserId(userId: number): Promise<boolean> {
    const toDelete = Array.from(this.matches.entries())
      .filter(([_, match]) => match.customer_id === userId && match.is_favorite)
      .map(([id, _]) => id);
    
    toDelete.forEach(id => this.matches.delete(id));
    saveStorageToDisk();
    return true;
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
  // Horse methods
  async getHorses(): Promise<Horse[]> {
    return await db.select().from(horses);
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
    const allHorses = await db.select().from(horses);
    console.log(`DatabaseStorage.getHorsesByFilters - total horses in DB: ${allHorses.length}`);
    console.log("DatabaseStorage.getHorsesByFilters - All horses disciplines:", allHorses.map(h => ({ name: h.name, disciplines: h.disciplines })));
    
    // If no filters are provided, return all horses
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
      
      // Filter by levels if specified
      if (filters.levels && filters.levels.length > 0) {
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
      
      // Filter by height range if specified
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
    const result = await db.delete(horses).where(eq(horses.id, id)).returning({ id: horses.id });
    return result.length > 0;
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
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return false;
    }
  }
  
  async deleteMatchesByUserId(userId: number): Promise<boolean> {
    try {
      await db.delete(matches).where(eq(matches.customer_id, userId));
      return true;
    } catch (error) {
      console.error(`Error deleting matches for user ${userId}:`, error);
      return false;
    }
  }
  
  async deleteFavoritesByUserId(userId: number): Promise<boolean> {
    try {
      // Note: In this schema, favorites are represented as matches with is_favorite = true
      await db.delete(matches).where(and(
        eq(matches.customer_id, userId),
        eq(matches.is_favorite, true)
      ));
      return true;
    } catch (error) {
      console.error(`Error deleting favorites for user ${userId}:`, error);
      return false;
    }
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
