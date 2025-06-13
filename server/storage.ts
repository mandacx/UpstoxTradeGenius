import { 
  users, accounts, positions, trades, strategies, backtests, backtestTrades, modules, logs, configurations,
  subscriptionPlans, userSubscriptions, paymentMethods, paymentTransactions, usageAnalytics,
  type User, type InsertUser, type Account, type InsertAccount,
  type Position, type InsertPosition, type Trade, type InsertTrade,
  type Strategy, type InsertStrategy, type Backtest, type InsertBacktest,
  type BacktestTrade, type InsertBacktestTrade,
  type Module, type InsertModule, type Log, type InsertLog,
  type Configuration, type InsertConfiguration,
  type SubscriptionPlan, type InsertSubscriptionPlan,
  type UserSubscription, type InsertUserSubscription,
  type PaymentMethod, type InsertPaymentMethod,
  type PaymentTransaction, type InsertPaymentTransaction,
  type UsageAnalytics, type InsertUsageAnalytics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ne, gte, lte, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  
  // Backtest trades operations
  getBacktestTrades(backtestId: number): Promise<BacktestTrade[]>;
  createBacktestTrade(trade: InsertBacktestTrade): Promise<BacktestTrade>;
  updateBacktestTrade(id: number, data: Partial<BacktestTrade>): Promise<BacktestTrade>;

  // Module operations
  getModules(): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, data: Partial<Module>): Promise<Module>;

  // Log operations
  getLogs(filters: { level?: string; module?: string }, limit: number, offset: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;

  // Configuration operations
  getConfiguration(key: string): Promise<Configuration | undefined>;
  setConfiguration(config: InsertConfiguration): Promise<Configuration>;
  getAllConfigurations(): Promise<Configuration[]>;

  // Additional user operations
  getAllUsers(): Promise<User[]>;

  // Subscription operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getUserSubscription(userId: number): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, data: Partial<UserSubscription>): Promise<UserSubscription>;
  cancelUserSubscription(id: number, reason?: string): Promise<UserSubscription>;

  // Payment method operations
  getUserPaymentMethods(userId: number): Promise<PaymentMethod[]>;
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, data: Partial<PaymentMethod>): Promise<PaymentMethod>;
  deletePaymentMethod(id: number): Promise<void>;
  setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<void>;

  // Payment transaction operations
  getUserTransactions(userId: number, limit?: number, offset?: number): Promise<PaymentTransaction[]>;
  createTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  updateTransaction(id: number, data: Partial<PaymentTransaction>): Promise<PaymentTransaction>;

  // Usage analytics operations
  getUserUsageAnalytics(userId: number, feature?: string): Promise<UsageAnalytics[]>;
  createUsageAnalytics(analytics: InsertUsageAnalytics): Promise<UsageAnalytics>;
  getUsageStatsByUser(userId: number): Promise<{ feature: string; totalValue: number }[]>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
    return await db.select().from(backtests).where(and(eq(backtests.userId, userId), or(eq(backtests.status, "completed"), eq(backtests.status, "running"), eq(backtests.status, "pending"), eq(backtests.status, "error"), eq(backtests.status, "cancelled")))).orderBy(desc(backtests.createdAt));
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

  // Backtest trades operations
  async getBacktestTrades(backtestId: number): Promise<BacktestTrade[]> {
    return await db.select().from(backtestTrades).where(eq(backtestTrades.backtestId, backtestId)).orderBy(backtestTrades.entryTime);
  }

  async createBacktestTrade(trade: InsertBacktestTrade): Promise<BacktestTrade> {
    const [newTrade] = await db
      .insert(backtestTrades)
      .values(trade)
      .returning();
    return newTrade;
  }

  async updateBacktestTrade(id: number, data: Partial<BacktestTrade>): Promise<BacktestTrade> {
    const [trade] = await db
      .update(backtestTrades)
      .set(data)
      .where(eq(backtestTrades.id, id))
      .returning();
    return trade;
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

  // Configuration operations
  async getConfiguration(key: string): Promise<Configuration | undefined> {
    const [config] = await db.select().from(configurations).where(eq(configurations.key, key));
    return config || undefined;
  }

  async setConfiguration(config: InsertConfiguration): Promise<Configuration> {
    const existing = await this.getConfiguration(config.key);
    if (existing) {
      const [updated] = await db
        .update(configurations)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(configurations.key, config.key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(configurations)
        .values(config)
        .returning();
      return created;
    }
  }

  async getAllConfigurations(): Promise<Configuration[]> {
    return await db.select().from(configurations);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Subscription operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans);
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [result] = await db.insert(subscriptionPlans).values(plan).returning();
    return result;
  }

  async getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select()
      .from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active")
      ))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [result] = await db.insert(userSubscriptions).values(subscription).returning();
    return result;
  }

  async updateUserSubscription(id: number, data: Partial<UserSubscription>): Promise<UserSubscription> {
    const [result] = await db.update(userSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return result;
  }

  async cancelUserSubscription(id: number, reason?: string): Promise<UserSubscription> {
    const [result] = await db.update(userSubscriptions)
      .set({ 
        status: "cancelled", 
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return result;
  }

  // Payment method operations
  async getUserPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    return await db.select()
      .from(paymentMethods)
      .where(and(
        eq(paymentMethods.userId, userId),
        eq(paymentMethods.isActive, true)
      ))
      .orderBy(desc(paymentMethods.isDefault));
  }

  async createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const [result] = await db.insert(paymentMethods).values(paymentMethod).returning();
    return result;
  }

  async updatePaymentMethod(id: number, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const [result] = await db.update(paymentMethods)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id))
      .returning();
    return result;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    await db.update(paymentMethods)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id));
  }

  async setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<void> {
    // First, unset all default payment methods for the user
    await db.update(paymentMethods)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(paymentMethods.userId, userId));
    
    // Then set the specified payment method as default
    await db.update(paymentMethods)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(paymentMethods.id, paymentMethodId));
  }

  // Payment transaction operations
  async getUserTransactions(userId: number, limit: number = 50, offset: number = 0): Promise<PaymentTransaction[]> {
    return await db.select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, userId))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [result] = await db.insert(paymentTransactions).values(transaction).returning();
    return result;
  }

  async updateTransaction(id: number, data: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    const [result] = await db.update(paymentTransactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentTransactions.id, id))
      .returning();
    return result;
  }

  // Usage analytics operations
  async getUserUsageAnalytics(userId: number, feature?: string): Promise<UsageAnalytics[]> {
    const conditions = [eq(usageAnalytics.userId, userId)];
    if (feature) {
      conditions.push(eq(usageAnalytics.feature, feature));
    }
    
    return await db.select()
      .from(usageAnalytics)
      .where(and(...conditions))
      .orderBy(desc(usageAnalytics.recordedAt));
  }

  async createUsageAnalytics(analytics: InsertUsageAnalytics): Promise<UsageAnalytics> {
    const [result] = await db.insert(usageAnalytics).values(analytics).returning();
    return result;
  }

  async getUsageStatsByUser(userId: number): Promise<{ feature: string; totalValue: number }[]> {
    const result = await db.select({
      feature: usageAnalytics.feature,
      totalValue: usageAnalytics.value,
    })
    .from(usageAnalytics)
    .where(eq(usageAnalytics.userId, userId));

    // Group by feature and sum values
    const stats = result.reduce((acc, curr) => {
      if (!acc[curr.feature]) {
        acc[curr.feature] = 0;
      }
      acc[curr.feature] += curr.totalValue;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats).map(([feature, totalValue]) => ({
      feature,
      totalValue
    }));
  }
}

export const storage = new DatabaseStorage();
