import { 
  horses, type Horse, type InsertHorse,
  owners, type Owner, type InsertOwner,
  customers, type Customer, type InsertCustomer,
  matches, type Match, type InsertMatch,
  messages, type Message, type InsertMessage,
  conversations, type Conversation, type InsertConversation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Horse methods
  getHorses(): Promise<Horse[]>;
  getHorseById(id: number): Promise<Horse | undefined>;
  getHorsesByFilters(filters: Partial<Horse>): Promise<Horse[]>;
  createHorse(horse: InsertHorse): Promise<Horse>;
  updateHorse(id: number, horse: Partial<Horse>): Promise<Horse | undefined>;
  deleteHorse(id: number): Promise<boolean>;
  
  // Owner methods
  getOwners(): Promise<Owner[]>;
  getOwnerById(id: number): Promise<Owner | undefined>;
  getOwnerByEmail(email: string): Promise<Owner | undefined>;
  createOwner(owner: InsertOwner): Promise<Owner>;
  
  // Customer methods
  getCustomers(): Promise<Customer[]>;
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
  
  // Message methods
  getMessages(): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  getMessagesByConversationId(customerId: number, ownerId: number, horseId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Conversation methods
  getConversations(): Promise<Conversation[]>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  getConversationsByCustomerId(customerId: number): Promise<Conversation[]>;
  getConversationsByOwnerId(ownerId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<Conversation>): Promise<Conversation>;
}

export class MemStorage implements IStorage {
  private horses: Map<number, Horse>;
  private owners: Map<number, Owner>;
  private customers: Map<number, Customer>;
  private matches: Map<number, Match>;
  private messages: Map<number, Message>;
  private conversations: Map<number, Conversation>;
  
  private horseId: number;
  private ownerId: number;
  private customerId: number;
  private matchId: number;
  private messageId: number;
  private conversationId: number;
  
  constructor() {
    this.horses = new Map();
    this.owners = new Map();
    this.customers = new Map();
    this.matches = new Map();
    this.messages = new Map();
    this.conversations = new Map();
    
    this.horseId = 1;
    this.ownerId = 1;
    this.customerId = 1;
    this.matchId = 1;
    this.messageId = 1;
    this.conversationId = 1;
    
    this.seedData();
  }
  
  // Seed some initial data
  private seedData() {
    // Add an owner
    const owner: InsertOwner = {
      business_name: "Elite Sporthorses",
      contact_name: "John Smith",
      email: "john@elitesporthorses.com",
      password: "password123"
    };
    this.createOwner(owner);
    
    // Add a customer
    const customer: InsertCustomer = {
      name: "Sarah Thompson",
      email: "sarah@example.com",
      password: "password123",
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
      currency: "EUR"
    };
    this.createCustomer(customer);
    
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
      price: 65000,
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
      price: 45000,
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
      price: 85000,
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
      price: 72000,
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
  
  // Horse methods
  async getHorses(): Promise<Horse[]> {
    return Array.from(this.horses.values());
  }
  
  async getHorseById(id: number): Promise<Horse | undefined> {
    return this.horses.get(id);
  }
  
  async getHorsesByFilters(filters: Partial<Horse>): Promise<Horse[]> {
    const horses = Array.from(this.horses.values());
    
    return horses.filter(horse => {
      // Filter by disciplines if specified
      if (filters.disciplines && filters.disciplines.length > 0) {
        if (!horse.disciplines.some(d => filters.disciplines!.includes(d))) {
          return false;
        }
      }
      
      // Filter by breeds if specified
      if (filters.breeds && filters.breeds.length > 0) {
        if (!horse.breeds.some(b => filters.breeds!.includes(b))) {
          return false;
        }
      }
      
      // Filter by sex if specified
      if (filters.sex && horse.sex !== filters.sex) {
        return false;
      }
      
      // Filter by age range if specified
      if (filters.age) {
        if (horse.age !== filters.age) {
          return false;
        }
      }
      
      // Filter by location if specified
      if (filters.location_country && horse.location_country !== filters.location_country) {
        return false;
      }
      
      // Filter by price range if specified
      if (filters.price) {
        if (horse.price > filters.price) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  async createHorse(horse: InsertHorse): Promise<Horse> {
    const id = this.horseId++;
    const newHorse: Horse = { id, ...horse, created_at: new Date() };
    this.horses.set(id, newHorse);
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
    
    const updatedHorse = { ...horse, ...updateData };
    this.horses.set(id, updatedHorse);
    
    // Log the result
    console.log("MemStorage.updateHorse - result:", JSON.stringify(updatedHorse, null, 2));
    
    return updatedHorse;
  }
  
  async deleteHorse(id: number): Promise<boolean> {
    const exists = this.horses.has(id);
    if (exists) {
      this.horses.delete(id);
    }
    return exists;
  }
  
  // Owner methods
  async getOwners(): Promise<Owner[]> {
    return Array.from(this.owners.values());
  }
  
  async getOwnerById(id: number): Promise<Owner | undefined> {
    return this.owners.get(id);
  }
  
  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    return Array.from(this.owners.values()).find(owner => owner.email === email);
  }
  
  async createOwner(owner: InsertOwner): Promise<Owner> {
    const id = this.ownerId++;
    const newOwner: Owner = { id, ...owner, created_at: new Date() };
    this.owners.set(id, newOwner);
    return newOwner;
  }
  
  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async getCustomerById(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(customer => customer.email === email);
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.customerId++;
    const newCustomer: Customer = { id, ...customer, created_at: new Date() };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  
  async updateCustomer(id: number, update: Partial<Customer>): Promise<Customer> {
    const customer = this.customers.get(id);
    if (!customer) throw new Error("Customer not found");
    
    const updatedCustomer = { ...customer, ...update };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
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
  
  // Message methods
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }
  
  async getMessageById(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesByConversationId(customerId: number, ownerId: number, horseId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        message.customer_id === customerId && 
        message.owner_id === ownerId && 
        message.horse_id === horseId
      )
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
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
        return b.last_message_time.getTime() - a.last_message_time.getTime();
      });
  }
  
  async getConversationsByOwnerId(ownerId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.owner_id === ownerId)
      .sort((a, b) => {
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return b.last_message_time.getTime() - a.last_message_time.getTime();
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
}

// Database-backed storage implementation
export class DatabaseStorage implements IStorage {
  // Horse methods
  async getHorses(): Promise<Horse[]> {
    return await db.select().from(horses);
  }

  async getHorseById(id: number): Promise<Horse | undefined> {
    const [horse] = await db.select().from(horses).where(eq(horses.id, id));
    return horse;
  }

  async getHorsesByFilters(filters: Partial<Horse>): Promise<Horse[]> {
    // Basic implementation that just returns all horses
    // In a real app, you would implement proper filtering here
    return await db.select().from(horses);
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

  // Owner methods
  async getOwners(): Promise<Owner[]> {
    return await db.select().from(owners);
  }

  async getOwnerById(id: number): Promise<Owner | undefined> {
    const [owner] = await db.select().from(owners).where(eq(owners.id, id));
    return owner;
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    const [owner] = await db.select().from(owners).where(eq(owners.email, email));
    return owner;
  }

  async createOwner(owner: InsertOwner): Promise<Owner> {
    const [newOwner] = await db.insert(owners).values(owner).returning();
    return newOwner;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
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

  // Conversation methods
  async getConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations);
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
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
}

// Switch to using the database storage
export const storage = new DatabaseStorage();
