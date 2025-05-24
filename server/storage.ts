import { 
  horses, type Horse, type InsertHorse,
  users, type User, type InsertUser, type Owner, type InsertOwner,
  type Customer, type InsertCustomer,
  matches, type Match, type InsertMatch,
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
  
  // Message methods
  getMessages(): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  getMessagesByUserId(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<Message>): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, update: Partial<User>): Promise<User> {
    const result = await db.update(users).set(update).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserSubscription(id: number, subscriptionData: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    subscription_plan?: string;
    subscription_end_date?: Date;
  }): Promise<User> {
    const result = await db.update(users).set(subscriptionData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getHorses(): Promise<Horse[]> {
    return await db.select().from(horses);
  }

  async getHorseById(id: number): Promise<Horse | undefined> {
    const result = await db.select().from(horses).where(eq(horses.id, id));
    return result[0];
  }

  async getHorsesByFilters(filters: any): Promise<Horse[]> {
    let query = db.select().from(horses);
    
    const conditions: any[] = [];
    
    if (filters.owner_id) {
      conditions.push(eq(horses.owner_id, filters.owner_id));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async createHorse(horse: InsertHorse): Promise<Horse> {
    const result = await db.insert(horses).values(horse).returning();
    return result[0];
  }

  async updateHorse(id: number, update: Partial<Horse>): Promise<Horse | undefined> {
    const result = await db.update(horses).set(update).where(eq(horses.id, id)).returning();
    return result[0];
  }

  async deleteHorse(id: number): Promise<boolean> {
    const result = await db.delete(horses).where(eq(horses.id, id));
    return true;
  }

  // Legacy methods
  async getOwnerById(id: number): Promise<Owner | undefined> {
    return this.getUserById(id);
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    return this.getUserByEmail(email);
  }

  async createOwner(owner: InsertOwner): Promise<Owner> {
    return this.createUser(owner);
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    return this.getUserById(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return this.getUserByEmail(email);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return this.createUser(customer);
  }

  async updateCustomer(id: number, update: Partial<Customer>): Promise<Customer> {
    return this.updateUser(id, update);
  }

  async getMatches(): Promise<Match[]> {
    return await db.select().from(matches);
  }

  async getMatchById(id: number): Promise<Match | undefined> {
    const result = await db.select().from(matches).where(eq(matches.id, id));
    return result[0];
  }

  async getMatchesByCustomerId(customerId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.customer_id, customerId));
  }

  async getMatchesByHorseId(horseId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.horse_id, horseId));
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const result = await db.insert(matches).values(match).returning();
    return result[0];
  }

  async updateMatch(id: number, update: Partial<Match>): Promise<Match> {
    const result = await db.update(matches).set(update).where(eq(matches.id, id)).returning();
    return result[0];
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.created_at));
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return await db.select().from(messages).where(
      and(
        eq(messages.from_user_id, userId)
      )
    ).orderBy(desc(messages.created_at));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async updateMessage(id: number, update: Partial<Message>): Promise<Message> {
    const result = await db.update(messages).set(update).where(eq(messages.id, id)).returning();
    return result[0];
  }
}

export function createStorage(skipSeed = false) {
  return new DatabaseStorage();
}

export const storage = createStorage(false);