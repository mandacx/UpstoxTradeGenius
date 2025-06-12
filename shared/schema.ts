import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  upstoxUserId: text("upstox_user_id"),
  upstoxAccessToken: text("upstox_access_token"),
  upstoxRefreshToken: text("upstox_refresh_token"),
  upstoxTokenExpiry: timestamp("upstox_token_expiry"),
  isUpstoxLinked: boolean("is_upstox_linked").default(false),
  subscriptionPlan: text("subscription_plan").default("demo"), // demo, basic, pro, enterprise
  subscriptionStatus: text("subscription_status").default("active"), // active, cancelled, expired
  subscriptionExpiry: timestamp("subscription_expiry"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").notNull(),
  parameters: jsonb("parameters"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  symbol: text("symbol").notNull(),
  exchange: text("exchange").notNull(),
  quantity: integer("quantity").notNull(),
  avgPrice: decimal("avg_price", { precision: 12, scale: 4 }).notNull(),
  currentPrice: decimal("current_price", { precision: 12, scale: 4 }),
  pnl: decimal("pnl", { precision: 12, scale: 4 }),
  dayChange: decimal("day_change", { precision: 8, scale: 4 }),
  isOpen: boolean("is_open").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  strategyId: integer("strategy_id").references(() => strategies.id),
  symbol: text("symbol").notNull(),
  exchange: text("exchange").notNull(),
  side: text("side").notNull(), // BUY or SELL
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 12, scale: 4 }).notNull(),
  orderType: text("order_type").notNull(),
  status: text("status").notNull(),
  pnl: decimal("pnl", { precision: 12, scale: 4 }),
  executedAt: timestamp("executed_at").defaultNow(),
});

export const backtests = pgTable("backtests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  strategyId: integer("strategy_id").references(() => strategies.id),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(), // 1minute, 5minute, 1hour, 1day
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  initialCapital: decimal("initial_capital", { precision: 15, scale: 2 }).notNull(),
  finalValue: decimal("final_value", { precision: 15, scale: 2 }),
  totalReturn: decimal("total_return", { precision: 8, scale: 4 }),
  sharpeRatio: decimal("sharpe_ratio", { precision: 8, scale: 4 }),
  maxDrawdown: decimal("max_drawdown", { precision: 8, scale: 4 }),
  winRate: decimal("win_rate", { precision: 8, scale: 4 }),
  totalTrades: integer("total_trades"),
  progress: integer("progress").default(0), // 0-100
  progressMessage: text("progress_message"),
  results: jsonb("results"),
  equityCurve: jsonb("equity_curve"),
  status: text("status").default("pending"), // pending, running, completed, cancelled, error
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const backtestTrades = pgTable("backtest_trades", {
  id: serial("id").primaryKey(),
  backtestId: integer("backtest_id").references(() => backtests.id),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // BUY or SELL
  quantity: integer("quantity").notNull(),
  entryPrice: decimal("entry_price", { precision: 12, scale: 4 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 12, scale: 4 }),
  entryTime: timestamp("entry_time").notNull(),
  exitTime: timestamp("exit_time"),
  pnl: decimal("pnl", { precision: 12, scale: 4 }),
  pnlPercent: decimal("pnl_percent", { precision: 8, scale: 4 }),
  status: text("status").notNull().default("open"), // open, closed
  reason: text("reason"), // signal reason or exit trigger
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  status: text("status").default("stopped"), // running, stopped, error
  lastUpdate: timestamp("last_update").defaultNow(),
  errorMessage: text("error_message"),
  config: jsonb("config"),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  module: text("module").notNull(),
  level: text("level").notNull(), // info, warn, error
  message: text("message").notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  totalBalance: decimal("total_balance", { precision: 15, scale: 2 }),
  availableMargin: decimal("available_margin", { precision: 15, scale: 2 }),
  usedMargin: decimal("used_margin", { precision: 15, scale: 2 }),
  todayPnL: decimal("today_pnl", { precision: 15, scale: 2 }),
  realizedPnL: decimal("realized_pnl", { precision: 15, scale: 2 }),
  // Upstox authentication fields
  upstoxAccessToken: text("upstox_access_token"),
  upstoxRefreshToken: text("upstox_refresh_token"),
  upstoxUserId: text("upstox_user_id"),
  upstoxTokenExpiry: timestamp("upstox_token_expiry"),
  upstoxTokenType: text("upstox_token_type"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  isSecret: boolean("is_secret").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const upstoxAuthSchema = z.object({
  authorizationCode: z.string(),
  redirectUri: z.string().optional(),
});

export const upstoxAccountLinkSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  userId: z.string(),
  expiryTime: z.string().optional(),
});

export const insertStrategySchema = createInsertSchema(strategies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  executedAt: true,
});

export const insertBacktestSchema = createInsertSchema(backtests).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  startedAt: true,
  progress: true,
  progressMessage: true,
  finalValue: true,
  totalReturn: true,
  sharpeRatio: true,
  maxDrawdown: true,
  winRate: true,
  totalTrades: true,
  results: true,
  equityCurve: true,
}).extend({
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  initialCapital: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertBacktestTradeSchema = createInsertSchema(backtestTrades).omit({
  id: true,
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  lastUpdate: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  createdAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  updatedAt: true,
});

export const insertConfigurationSchema = createInsertSchema(configurations).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Backtest = typeof backtests.$inferSelect;
export type InsertBacktest = z.infer<typeof insertBacktestSchema>;
export type BacktestTrade = typeof backtestTrades.$inferSelect;
export type InsertBacktestTrade = z.infer<typeof insertBacktestTradeSchema>;
export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Configuration = typeof configurations.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
