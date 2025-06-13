import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user"), // user, admin
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  upstoxUserId: text("upstox_user_id"),
  upstoxAccessToken: text("upstox_access_token"),
  upstoxRefreshToken: text("upstox_refresh_token"),
  upstoxTokenExpiry: timestamp("upstox_token_expiry"),
  upstoxClientId: text("upstox_client_id"),
  upstoxClientSecret: text("upstox_client_secret"),
  upstoxRedirectUri: text("upstox_redirect_uri"),
  isUpstoxLinked: boolean("is_upstox_linked").default(false),
  subscriptionPlan: text("subscription_plan").default("demo"), // demo, basic, pro, enterprise
  subscriptionStatus: text("subscription_status").default("active"), // active, cancelled, expired
  subscriptionExpiry: timestamp("subscription_expiry"),
  trialEndsAt: timestamp("trial_ends_at"),
  lastAuthToken: text("last_auth_token"),
  lastActive: timestamp("last_active"),
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

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  billingCycle: text("billing_cycle").notNull(), // monthly, yearly
  features: jsonb("features").notNull().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  status: text("status").notNull(), // active, cancelled, expired, pending
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(true),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment methods table
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // card, bank, paypal
  provider: text("provider").notNull(), // stripe, razorpay, paypal
  providerPaymentMethodId: text("provider_payment_method_id").notNull(),
  cardLast4: text("card_last4"),
  cardBrand: text("card_brand"),
  cardExpMonth: integer("card_exp_month"),
  cardExpYear: integer("card_exp_year"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment transactions table
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => userSubscriptions.id),
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id),
  providerTransactionId: text("provider_transaction_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  status: text("status").notNull(), // pending, completed, failed, refunded
  type: text("type").notNull(), // subscription, upgrade, refund
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  processedAt: timestamp("processed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage analytics table
export const usageAnalytics = pgTable("usage_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  feature: text("feature").notNull(), // api_calls, strategies_created, backtests_run
  value: integer("value").notNull(),
  metadata: jsonb("metadata").default({}),
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Learning path tables
export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  estimatedTime: integer("estimated_time"), // in minutes
  category: text("category").notNull(), // technical_analysis, fundamental_analysis, risk_management, etc.
  prerequisites: jsonb("prerequisites").default("[]"), // array of prerequisite path IDs
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  pathId: integer("path_id").notNull().references(() => learningPaths.id),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(), // markdown content
  lessonType: text("lesson_type").notNull(), // reading, video, interactive, quiz, simulation
  estimatedTime: integer("estimated_time"), // in minutes
  points: integer("points").default(10), // points awarded for completion
  resources: jsonb("resources").default("[]"), // additional resources
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // array of options
  correctAnswer: integer("correct_answer").notNull(), // index of correct option
  explanation: text("explanation"),
  points: integer("points").default(5),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  pathId: integer("path_id").references(() => learningPaths.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  status: text("status").notNull(), // not_started, in_progress, completed
  progress: integer("progress").default(0), // percentage 0-100
  score: integer("score").default(0), // quiz score if applicable
  timeSpent: integer("time_spent").default(0), // in seconds
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"), // icon name or emoji
  category: text("category").notNull(), // learning, trading, engagement
  condition: jsonb("condition").notNull(), // achievement condition object
  points: integer("points").default(50),
  isHidden: boolean("is_hidden").default(false), // hidden until unlocked
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  notified: boolean("notified").default(false),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  totalPoints: integer("total_points").default(0),
  level: integer("level").default(1),
  experiencePoints: integer("experience_points").default(0),
  lessonsCompleted: integer("lessons_completed").default(0),
  pathsCompleted: integer("paths_completed").default(0),
  quizAverage: decimal("quiz_average", { precision: 5, scale: 2 }).default("0"),
  currentStreak: integer("current_streak").default(0), // days
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUsageAnalyticsSchema = createInsertSchema(usageAnalytics).omit({
  id: true,
  createdAt: true,
});

// Learning path schemas
export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  createdAt: true,
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
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type UsageAnalytics = typeof usageAnalytics.$inferSelect;
export type InsertUsageAnalytics = z.infer<typeof insertUsageAnalyticsSchema>;

// Learning path types
export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
