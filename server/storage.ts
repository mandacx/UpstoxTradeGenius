import { 
  users, accounts, positions, trades, strategies, backtests, modules, logs,
  type User, type InsertUser, type Account, type InsertAccount,
  type Position, type InsertPosition, type Trade, type InsertTrade,
  type Strategy, type InsertStrategy, type Backtest, type InsertBacktest,
  type Module, type InsertModule, type Log, type InsertLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;

  // Account operations
  getAccount(userId: number): Promise<Account | undefined>;
  updateAccount(userId: number, data: Partial<InsertAccount>): Promise<Account>;
  createAccount(account: InsertAccount): Promise<Account>;

  // Position operations
  getPositions(userId: number): Promise<Position[]>;
  getOpenPositions(userId: number): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, data: Partial<InsertPosition>): Promise<Position>;

  // Trade operations
  getTrades(userId: number): Promise<Trade[]>;
  getTradeHistory(userId: number, limit: number, offset: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;

  // Strategy operations
  getStrategies(userId: number): Promise<Strategy[]>;
  getStrategy(id: number): Promise<Strategy | undefined>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: number, data: Partial<Strategy>): Promise<Strategy>;

  // Backtest operations
  getBacktests(userId: number): Promise<Backtest[]>;
  getBacktest(id: number): Promise<Backtest | undefined>;
  createBacktest(backtest: InsertBacktest): Promise<Backtest>;
  updateBacktest(id: number, data: Partial<Backtest>): Promise<Backtest>;

  // Module operations
  getModules(): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, data: Partial<Module>): Promise<Module>;

  // Log operations
  getLogs(filters: { level?: string; module?: string }, limit: number, offset: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Account operations
  async getAccount(userId: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.userId, userId));
    return account || undefined;
  }

  async updateAccount(userId: number, data: Partial<InsertAccount>): Promise<Account> {
    const [account] = await db
      .update(accounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(accounts.userId, userId))
      .returning();
    return account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db
      .insert(accounts)
      .values(account)
      .returning();
    return newAccount;
  }

  // Position operations
  async getPositions(userId: number): Promise<Position[]> {
    return await db.select().from(positions).where(eq(positions.userId, userId)).orderBy(desc(positions.createdAt));
  }

  async getOpenPositions(userId: number): Promise<Position[]> {
    return await db.select().from(positions)
      .where(and(eq(positions.userId, userId), eq(positions.isOpen, true)))
      .orderBy(desc(positions.createdAt));
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const [newPosition] = await db
      .insert(positions)
      .values(position)
      .returning();
    return newPosition;
  }

  async updatePosition(id: number, data: Partial<InsertPosition>): Promise<Position> {
    const [position] = await db
      .update(positions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(positions.id, id))
      .returning();
    return position;
  }

  // Trade operations
  async getTrades(userId: number): Promise<Trade[]> {
    return await db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.executedAt));
  }

  async getTradeHistory(userId: number, limit: number, offset: number): Promise<Trade[]> {
    return await db.select().from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.executedAt))
      .limit(limit)
      .offset(offset);
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db
      .insert(trades)
      .values(trade)
      .returning();
    return newTrade;
  }

  // Strategy operations
  async getStrategies(userId: number): Promise<Strategy[]> {
    return await db.select().from(strategies).where(eq(strategies.userId, userId)).orderBy(desc(strategies.createdAt));
  }

  async getStrategy(id: number): Promise<Strategy | undefined> {
    const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
    return strategy || undefined;
  }

  async createStrategy(strategy: InsertStrategy): Promise<Strategy> {
    const [newStrategy] = await db
      .insert(strategies)
      .values(strategy)
      .returning();
    return newStrategy;
  }

  async updateStrategy(id: number, data: Partial<Strategy>): Promise<Strategy> {
    const [strategy] = await db
      .update(strategies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(strategies.id, id))
      .returning();
    return strategy;
  }

  // Backtest operations
  async getBacktests(userId: number): Promise<Backtest[]> {
    return await db.select().from(backtests).where(eq(backtests.userId, userId)).orderBy(desc(backtests.createdAt));
  }

  async getBacktest(id: number): Promise<Backtest | undefined> {
    const [backtest] = await db.select().from(backtests).where(eq(backtests.id, id));
    return backtest || undefined;
  }

  async createBacktest(backtest: InsertBacktest): Promise<Backtest> {
    const [newBacktest] = await db
      .insert(backtests)
      .values(backtest)
      .returning();
    return newBacktest;
  }

  async updateBacktest(id: number, data: Partial<Backtest>): Promise<Backtest> {
    const [backtest] = await db
      .update(backtests)
      .set({ ...data })
      .where(eq(backtests.id, id))
      .returning();
    return backtest;
  }

  // Module operations
  async getModules(): Promise<Module[]> {
    return await db.select().from(modules).orderBy(modules.name);
  }

  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module || undefined;
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db
      .insert(modules)
      .values(module)
      .returning();
    return newModule;
  }

  async updateModule(id: number, data: Partial<Module>): Promise<Module> {
    const [module] = await db
      .update(modules)
      .set({ ...data, lastUpdate: new Date() })
      .where(eq(modules.id, id))
      .returning();
    return module;
  }

  // Log operations
  async getLogs(filters: { level?: string; module?: string }, limit: number, offset: number): Promise<Log[]> {
    const conditions = [];
    if (filters.level) {
      conditions.push(eq(logs.level, filters.level));
    }
    if (filters.module) {
      conditions.push(eq(logs.module, filters.module));
    }
    
    const query = db.select().from(logs);
    
    if (conditions.length > 0) {
      return await query
        .where(and(...conditions))
        .orderBy(desc(logs.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await query
      .orderBy(desc(logs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [newLog] = await db
      .insert(logs)
      .values(log)
      .returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
