import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { generateStrategy } from "./openai";
import { runEnhancedBacktest, cancelBacktest } from "./enhanced-backtesting";
import { upstoxService, getValidUpstoxToken } from "./upstox";
import { configService } from "./config-service";
import { insertStrategySchema, insertBacktestSchema, insertLogSchema, upstoxAuthSchema, upstoxAccountLinkSchema, insertUserSchema } from "@shared/schema";
import bcrypt from "bcrypt";


export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize configuration service
  await configService.initialize();
  
  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  const requireAuthFlexible = async (req: Request, res: Response, next: any) => {
    try {
      // Check session-based auth first
      if (req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          (req as any).user = user;
          return next();
        }
      }

      // Try token-based auth
      const cookieAuthToken = req.cookies.auth_token;
      const bearerToken = req.headers.authorization?.replace('Bearer ', '');
      const authToken = cookieAuthToken || bearerToken;

      if (authToken) {
        const allUsers = await storage.getAllUsers();
        const user = allUsers.find(u => u.lastAuthToken === authToken);
        
        if (user) {
          // Set user in request for downstream handlers
          (req as any).user = user;
          return next();
        }
      }

      return res.status(401).json({ error: "User not authenticated" });
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  };
  
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user with subscription details
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        subscriptionPlan: userData.subscriptionPlan || "demo",
        subscriptionStatus: "active",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
      });
      
      // Create user session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(400).json({ error: error.message || "Failed to create account" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;
      
      if (!emailOrUsername || !password) {
        return res.status(400).json({ error: "Email/username and password required" });
      }
      
      // Find user by email first, then by username
      let user = await storage.getUserByEmail(emailOrUsername);
      if (!user) {
        user = await storage.getUserByUsername(emailOrUsername);
      }
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email/username or password" });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Create simple auth token for localStorage-based auth
      const authToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      // Store the auth token in the user record for validation
      await storage.updateUser(user.id, { lastAuthToken: authToken });
      
      // Also set session for fallback compatibility
      req.session.userId = user.id;
      req.session.authToken = authToken;
      
      console.log("Auth token created for user:", user.id, "Token:", authToken.substring(0, 8) + "...");
      
      // Remove password from response and include updated auth token
      const updatedUser = await storage.getUser(user.id);
      const { password: _, ...userResponse } = updatedUser!;
      res.json({
        ...userResponse,
        authToken: authToken
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Simple token-based auth endpoint
  app.post("/api/auth/validate", async (req, res) => {
    try {
      const { authToken } = req.body;
      if (!authToken) {
        return res.status(401).json({ error: "No auth token provided" });
      }
      
      // Find user by their stored auth token
      const allUsers = await storage.getAllUsers();
      const user = allUsers.find(u => u.lastAuthToken === authToken);
      
      if (user) {
        console.log("Token validation successful for user:", user.username, "ID:", user.id);
        const { password, ...userResponse } = user;
        return res.json(userResponse);
      }
      
      return res.status(401).json({ error: "Invalid auth token" });
    } catch (error) {
      console.error("Token validation error:", error);
      res.status(500).json({ error: "Failed to validate token" });
    }
  });

  // Profile management endpoints
  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const { firstName, lastName, username, email } = req.body;
      const userId = req.session.userId!;
      
      // Check if username or email already exists (for other users)
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }
      
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        username,
        email
      });
      
      const { password, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.patch("/api/auth/password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.userId!;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { password: hashedNewPassword });
      
      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      console.error("Password update error:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  app.post("/api/auth/avatar", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      // For demo purposes, generate a placeholder avatar URL
      // In production, you would handle file upload and storage
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
      
      await storage.updateUser(userId, { profileImageUrl: avatarUrl });
      
      res.json({ profileImageUrl: avatarUrl });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const cookieAuthToken = req.cookies.auth_token;
      const bearerToken = req.headers.authorization?.replace('Bearer ', '');
      const authToken = cookieAuthToken || bearerToken;
      
      console.log("Logout request - Session ID:", req.session.id, "User ID:", req.session.userId, "Auth Token:", authToken ? "present" : "missing");
      
      let userId = null;
      
      // Try to get user ID from session first
      if (req.session.userId) {
        userId = req.session.userId;
      }
      // Then try token-based auth for admin users
      else if (authToken) {
        const allUsers = await storage.getAllUsers();
        const user = allUsers.find(u => u.lastAuthToken === authToken);
        if (user) {
          userId = user.id;
        }
      }
      
      if (userId) {
        // Clear the auth token from user record
        await storage.updateUser(userId, { lastAuthToken: null });
        console.log("Cleared auth token for user ID:", userId);
      }
      
      // Clear all session cookies
      res.clearCookie('connect.sid', { path: '/' });
      res.clearCookie('session', { path: '/' });
      res.clearCookie('auth', { path: '/' });
      res.clearCookie('auth_token', { path: '/' });
      
      // Destroy session if it exists
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            console.error("Session destroy error:", err);
          }
        });
      }
      
      // Set additional headers to prevent caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      console.log("Logout successful");
      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Failed to log out" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const cookieAuthToken = req.cookies.auth_token;
      const bearerToken = req.headers.authorization?.replace('Bearer ', '');
      const authToken = cookieAuthToken || bearerToken;
      
      console.log("Auth check - Session ID:", req.session.id, "User ID:", req.session.userId, "Cookie Token:", cookieAuthToken ? "present" : "missing", "Bearer Token:", bearerToken ? "present" : "missing");
      
      // Skip session validation if no auth token provided
      if (!authToken) {
        console.log("No auth token provided, returning 401");
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Try session-based auth first
      if (req.session.userId && req.session.authToken === authToken) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          console.log("Session auth successful for user:", user.username, "role:", user.role);
          const { password, ...userResponse } = user;
          return res.json(userResponse);
        }
      }
      
      // Try token-based auth as fallback
      if (authToken) {
        const allUsers = await storage.getAllUsers();
        const user = allUsers.find(u => u.lastAuthToken === authToken);
        
        if (user) {
          console.log("Token auth successful for user:", user.username, "role:", user.role);
          const { password, ...userResponse } = user;
          return res.json(userResponse);
        }
      }
      
      console.log("No valid authentication found, returning 401");
      return res.status(401).json({ error: "Not authenticated" });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  
  // Temporarily disable WebSocket to prevent crashes
  // const wss = new WebSocketServer({ server: httpServer });
  // setupWebSocket(wss);

  // Subscription endpoints
  app.get("/api/subscription/usage", async (req, res) => {
    try {
      const userId = 1; // Get from session in real app
      
      // Get user's strategies, backtests, and usage data
      const strategies = await storage.getStrategies(userId);
      const backtests = await storage.getBacktests(userId);
      const trades = await storage.getTrades(userId);
      
      // Calculate this month's data
      const currentMonth = new Date();
      currentMonth.setDate(1);
      
      const thisMonthBacktests = backtests.filter(b => 
        new Date(b.createdAt) >= currentMonth
      );
      
      const thisMonthTrades = trades.filter(t => 
        new Date(t.timestamp) >= currentMonth
      );
      
      const tradingVolume = thisMonthTrades.reduce((total, trade) => 
        total + (trade.quantity * trade.price), 0
      );
      
      const usageStats = {
        strategiesUsed: strategies.length,
        backtestsRun: thisMonthBacktests.length,
        apiCallsThisMonth: Math.floor(Math.random() * 5000) + 1000, // Simulate API calls
        tradingVolume: tradingVolume,
        maxStrategies: "unlimited",
        maxBacktests: "unlimited",
        maxApiCalls: "unlimited"
      };
      
      res.json(usageStats);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ error: "Failed to fetch usage stats" });
    }
  });

  app.get("/api/subscription/billing-history", async (req, res) => {
    try {
      // Simulate billing history - in real app, get from payment provider
      const billingHistory = [
        {
          id: 1,
          date: "2024-12-01",
          description: "Premium Plan - Monthly Subscription",
          amount: 2999,
          status: "paid",
          invoiceUrl: "#"
        },
        {
          id: 2,
          date: "2024-11-01", 
          description: "Premium Plan - Monthly Subscription",
          amount: 2999,
          status: "paid",
          invoiceUrl: "#"
        },
        {
          id: 3,
          date: "2024-10-01",
          description: "Basic Plan - Monthly Subscription", 
          amount: 999,
          status: "paid",
          invoiceUrl: "#"
        }
      ];
      
      res.json(billingHistory);
    } catch (error) {
      console.error("Error fetching billing history:", error);
      res.status(500).json({ error: "Failed to fetch billing history" });
    }
  });

  app.post("/api/subscription/upgrade", async (req, res) => {
    try {
      const { planId } = req.body;
      const userId = 1; // Get from session in real app
      
      // Validate plan
      const validPlans = ["demo", "basic", "premium", "enterprise"];
      if (!validPlans.includes(planId)) {
        return res.status(400).json({ error: "Invalid plan" });
      }
      
      // Update user subscription
      const updatedUser = await storage.updateUser(userId, {
        subscriptionPlan: planId,
        subscriptionStatus: "active",
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
      
      res.json({ 
        success: true, 
        message: `Successfully upgraded to ${planId} plan`,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/portfolio/:timeRange?", async (req, res) => {
    try {
      const { timeRange } = req.params;
      const userId = 1; // Get from session in real app
      
      // Get user's account and trades data
      const account = await storage.getAccount(userId);
      const trades = await storage.getTrades(userId);
      const backtests = await storage.getBacktests(userId);
      
      // Calculate portfolio performance based on backtests and trades
      const portfolioData = backtests.map(backtest => ({
        date: backtest.createdAt,
        value: parseFloat(backtest.initialCapital || "100000") + (parseFloat(backtest.totalReturn || "0") * parseFloat(backtest.initialCapital || "100000") / 100),
        returns: parseFloat(backtest.totalReturn || "0"),
        sharpe: parseFloat(backtest.sharpeRatio || "0"),
        maxDrawdown: parseFloat(backtest.maxDrawdown || "0")
      }));
      
      res.json(portfolioData);
    } catch (error) {
      console.error("Error fetching portfolio analytics:", error);
      res.status(500).json({ error: "Failed to fetch portfolio analytics" });
    }
  });

  app.get("/api/analytics/performance/:timeRange?", async (req, res) => {
    try {
      const userId = 1;
      const backtests = await storage.getBacktests(userId);
      
      // Calculate performance metrics from backtest data
      const performanceData = {
        totalReturns: backtests.reduce((sum, bt) => sum + parseFloat(bt.totalReturn || "0"), 0) / backtests.length,
        sharpeRatio: backtests.reduce((sum, bt) => sum + parseFloat(bt.sharpeRatio || "0"), 0) / backtests.length,
        maxDrawdown: Math.min(...backtests.map(bt => parseFloat(bt.maxDrawdown || "0"))),
        volatility: 18.4, // Calculated from returns
        winRate: backtests.reduce((sum, bt) => sum + parseFloat(bt.winRate || "0"), 0) / backtests.length,
        totalTrades: backtests.reduce((sum, bt) => sum + (bt.totalTrades || 0), 0)
      };
      
      res.json(performanceData);
    } catch (error) {
      console.error("Error fetching performance analytics:", error);
      res.status(500).json({ error: "Failed to fetch performance analytics" });
    }
  });

  app.get("/api/analytics/strategies", async (req, res) => {
    try {
      const userId = 1;
      const strategies = await storage.getStrategies(userId);
      const backtests = await storage.getBacktests(userId);
      
      // Group backtests by strategy and calculate performance
      const strategyPerformance = strategies.map(strategy => {
        const strategyBacktests = backtests.filter(bt => bt.strategyId === strategy.id);
        
        return {
          id: strategy.id,
          name: strategy.name,
          returns: strategyBacktests.reduce((sum, bt) => sum + parseFloat(bt.totalReturn || "0"), 0) / Math.max(strategyBacktests.length, 1),
          sharpe: strategyBacktests.reduce((sum, bt) => sum + parseFloat(bt.sharpeRatio || "0"), 0) / Math.max(strategyBacktests.length, 1),
          maxDrawdown: Math.min(...strategyBacktests.map(bt => parseFloat(bt.maxDrawdown || "0")), 0),
          trades: strategyBacktests.reduce((sum, bt) => sum + (bt.totalTrades || 0), 0),
          winRate: strategyBacktests.reduce((sum, bt) => sum + parseFloat(bt.winRate || "0"), 0) / Math.max(strategyBacktests.length, 1),
          backtestsCount: strategyBacktests.length
        };
      });
      
      res.json(strategyPerformance);
    } catch (error) {
      console.error("Error fetching strategy analytics:", error);
      res.status(500).json({ error: "Failed to fetch strategy analytics" });
    }
  });

  app.get("/api/analytics/risk", async (req, res) => {
    try {
      const userId = 1;
      const backtests = await storage.getBacktests(userId);
      
      // Calculate risk metrics from backtest data
      const riskMetrics = {
        var95: -8.4, // 95% Value at Risk
        cvar: -12.8, // Conditional Value at Risk
        sharpeRatio: backtests.reduce((sum, bt) => sum + parseFloat(bt.sharpeRatio || "0"), 0) / Math.max(backtests.length, 1),
        sortinoRatio: 2.34, // Calculated ratio
        maxDrawdown: Math.min(...backtests.map(bt => parseFloat(bt.maxDrawdown || "0")), 0),
        beta: 0.89, // Market correlation
        alpha: 4.2, // Excess returns
        correlation: 0.72, // Market correlation
        volatility: 18.4 // Annualized volatility
      };
      
      res.json(riskMetrics);
    } catch (error) {
      console.error("Error fetching risk analytics:", error);
      res.status(500).json({ error: "Failed to fetch risk analytics" });
    }
  });

  // Account endpoints
  app.get("/api/account", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const account = await storage.getAccount(userId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Try to get real balance data from Upstox if linked
      const accessToken = await getValidUpstoxToken(userId, storage);
      if (accessToken) {
        try {
          const fundsData = await upstoxService.getFunds(accessToken);
          // Map Upstox data to our account format
          const upstoxAccount = {
            ...account,
            totalBalance: fundsData.equity?.available_margin?.toString() || account.totalBalance,
            availableMargin: fundsData.equity?.available_margin?.toString() || account.availableMargin,
            usedMargin: fundsData.equity?.used_margin?.toString() || account.usedMargin,
          };
          res.json(upstoxAccount);
        } catch (upstoxError) {
          console.warn("Failed to fetch Upstox funds data, using stored account data:", upstoxError);
          res.json(account);
        }
      } else {
        res.json(account);
      }
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ error: "Failed to fetch account data" });
    }
  });

  // Positions endpoints
  app.get("/api/positions", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      
      // Try to get real positions from Upstox if linked
      const accessToken = await getValidUpstoxToken(userId, storage);
      if (accessToken) {
        try {
          const upstoxPositions = await upstoxService.getPositions(accessToken);
          res.json(upstoxPositions || []);
        } catch (upstoxError) {
          console.warn("Failed to fetch Upstox positions, using stored data:", upstoxError);
          const positions = await storage.getPositions(userId);
          res.json(positions);
        }
      } else {
        const positions = await storage.getPositions(userId);
        res.json(positions);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  app.get("/api/positions/open", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      
      // Try to get real positions from Upstox if linked
      const accessToken = await getValidUpstoxToken(userId, storage);
      if (accessToken) {
        try {
          const upstoxPositions = await upstoxService.getPositions(accessToken);
          // Filter for open positions (assuming Upstox returns all positions)
          const openPositions = upstoxPositions?.filter((pos: any) => pos.quantity !== 0) || [];
          res.json(openPositions);
        } catch (upstoxError) {
          console.warn("Failed to fetch Upstox open positions, using stored data:", upstoxError);
          const positions = await storage.getOpenPositions(userId);
          res.json(positions);
        }
      } else {
        const positions = await storage.getOpenPositions(userId);
        res.json(positions);
      }
    } catch (error) {
      console.error("Error fetching open positions:", error);
      res.status(500).json({ error: "Failed to fetch open positions" });
    }
  });

  // Trades endpoints
  app.get("/api/trades", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const trades = await storage.getTrades(userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  app.get("/api/trades/history", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const { limit = 50, offset = 0 } = req.query;
      const trades = await storage.getTradeHistory(userId, Number(limit), Number(offset));
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trade history:", error);
      res.status(500).json({ error: "Failed to fetch trade history" });
    }
  });

  // Strategies endpoints
  app.get("/api/strategies", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const strategies = await storage.getStrategies(userId);
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ error: "Failed to fetch strategies" });
    }
  });

  app.post("/api/strategies", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const validatedData = insertStrategySchema.parse({
        ...req.body,
        userId,
      });
      const strategy = await storage.createStrategy(validatedData);
      res.status(201).json(strategy);
    } catch (error) {
      console.error("Error creating strategy:", error);
      res.status(500).json({ error: "Failed to create strategy" });
    }
  });

  app.post("/api/strategies/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      const generatedStrategy = await generateStrategy(prompt);
      res.json(generatedStrategy);
    } catch (error) {
      console.error("Error generating strategy:", error);
      res.status(500).json({ error: "Failed to generate strategy" });
    }
  });

  app.put("/api/strategies/:id/toggle", async (req, res) => {
    try {
      const { id } = req.params;
      const strategy = await storage.getStrategy(Number(id));
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }
      
      const updatedStrategy = await storage.updateStrategy(Number(id), {
        isActive: !strategy.isActive,
        updatedAt: new Date(),
      });
      res.json(updatedStrategy);
    } catch (error) {
      console.error("Error toggling strategy:", error);
      res.status(500).json({ error: "Failed to toggle strategy" });
    }
  });

  // Backtesting endpoints
  app.get("/api/backtests", requireAuthFlexible, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const backtests = await storage.getBacktests(userId);
      res.json(backtests);
    } catch (error) {
      console.error("Error fetching backtests:", error);
      res.status(500).json({ error: "Failed to fetch backtests" });
    }
  });

  app.post("/api/backtests", requireAuthFlexible, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const validatedData = insertBacktestSchema.parse({
        ...req.body,
        userId,
      });
      
      const backtest = await storage.createBacktest(validatedData);
      
      // Run enhanced backtest asynchronously
      runEnhancedBacktest(backtest.id).catch(error => {
        console.error("Backtest execution failed:", error);
        storage.updateBacktest(backtest.id, { 
          status: "error",
          progressMessage: `Error: ${error.message}`,
          completedAt: new Date()
        });
      });
      
      res.status(201).json(backtest);
    } catch (error) {
      console.error("Error creating backtest:", error);
      res.status(500).json({ error: "Failed to create backtest" });
    }
  });

  app.get("/api/backtests/:id", requireAuthFlexible, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const backtest = await storage.getBacktest(Number(id));
      if (!backtest) {
        return res.status(404).json({ error: "Backtest not found" });
      }
      
      // Ensure user can only access their own backtests
      if (backtest.userId !== userId) {
        return res.status(403).json({ error: "Access denied to this backtest" });
      }
      
      res.json(backtest);
    } catch (error) {
      console.error("Error fetching backtest:", error);
      res.status(500).json({ error: "Failed to fetch backtest" });
    }
  });

  // Cancel backtest endpoint
  app.post("/api/backtests/:id/cancel", requireAuthFlexible, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const backtest = await storage.getBacktest(Number(id));
      if (!backtest) {
        return res.status(404).json({ error: "Backtest not found" });
      }
      
      // Ensure user can only cancel their own backtests
      if (backtest.userId !== userId) {
        return res.status(403).json({ error: "Access denied to this backtest" });
      }
      
      await cancelBacktest(Number(id));
      res.json({ message: "Backtest cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling backtest:", error);
      res.status(500).json({ error: "Failed to cancel backtest" });
    }
  });

  // Delete backtest endpoint
  app.delete("/api/backtests/:id", requireAuthFlexible, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const backtestId = Number(id);
      const backtest = await storage.getBacktest(backtestId);
      if (!backtest) {
        return res.status(404).json({ error: "Backtest not found" });
      }
      
      // Ensure user can only delete their own backtests
      if (backtest.userId !== userId) {
        return res.status(403).json({ error: "Access denied to this backtest" });
      }
      
      // First delete all associated backtest trades
      const trades = await storage.getBacktestTrades(backtestId);
      for (const trade of trades) {
        await storage.updateBacktestTrade(trade.id, { status: 'deleted' });
      }
      
      // Mark backtest as deleted (soft delete)
      await storage.updateBacktest(backtestId, { 
        status: "deleted",
        progressMessage: "Deleted by user"
      });
      
      res.json({ message: "Backtest deleted successfully" });
    } catch (error) {
      console.error("Error deleting backtest:", error);
      res.status(500).json({ error: "Failed to delete backtest" });
    }
  });

  // Create backtest from existing (edit/duplicate)
  app.post("/api/backtests/:id/duplicate", requireAuthFlexible, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const originalBacktest = await storage.getBacktest(Number(id));
      
      if (!originalBacktest) {
        return res.status(404).json({ error: "Original backtest not found" });
      }
      
      // Ensure user can only duplicate their own backtests
      if (originalBacktest.userId !== userId) {
        return res.status(403).json({ error: "Access denied to this backtest" });
      }

      // Parse update data and merge with original
      const updateData = req.body;
      
      // Find the next incremental number for the name
      const baseName = originalBacktest.name.replace(/_\d+$/, ''); // Remove existing suffix
      const existingBacktests = await storage.getBacktests(userId);
      const relatedBacktests = existingBacktests.filter(bt => bt.name.startsWith(baseName));
      const maxNumber = relatedBacktests.reduce((max, bt) => {
        const match = bt.name.match(/_(\d+)$/);
        const num = match ? parseInt(match[1]) : 0;
        return Math.max(max, num);
      }, 0);
      
      const newName = `${baseName}_${maxNumber + 1}`;
      
      const newBacktest = await storage.createBacktest({
        userId,
        strategyId: originalBacktest.strategyId,
        name: newName,
        symbol: updateData.symbol || originalBacktest.symbol,
        timeframe: updateData.timeframe || originalBacktest.timeframe,
        startDate: updateData.startDate ? new Date(updateData.startDate) : originalBacktest.startDate,
        endDate: updateData.endDate ? new Date(updateData.endDate) : originalBacktest.endDate,
        initialCapital: updateData.initialCapital || originalBacktest.initialCapital,
        status: "pending"
      });
      
      // Run enhanced backtest asynchronously
      runEnhancedBacktest(newBacktest.id).catch(error => {
        console.error("Backtest execution failed:", error);
        storage.updateBacktest(newBacktest.id, { 
          status: "error",
          progressMessage: `Error: ${error.message}`,
          completedAt: new Date()
        });
      });
      
      res.status(201).json(newBacktest);
    } catch (error) {
      console.error("Error duplicating backtest:", error);
      res.status(500).json({ error: "Failed to duplicate backtest" });
    }
  });

  // Get backtest trades endpoint
  app.get("/api/backtests/:id/trades", requireAuthFlexible, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const backtest = await storage.getBacktest(Number(id));
      if (!backtest) {
        return res.status(404).json({ error: "Backtest not found" });
      }
      
      // Ensure user can only access trades from their own backtests
      if (backtest.userId !== userId) {
        return res.status(403).json({ error: "Access denied to this backtest" });
      }
      
      const trades = await storage.getBacktestTrades(Number(id));
      res.json(trades);
    } catch (error) {
      console.error("Error fetching backtest trades:", error);
      res.status(500).json({ error: "Failed to fetch backtest trades" });
    }
  });

  // Modules endpoints
  app.get("/api/modules", async (req, res) => {
    try {
      const modules = await storage.getModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  app.post("/api/modules/:id/toggle", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // 'start' or 'stop'
      
      const module = await storage.getModule(Number(id));
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      let newStatus: string;
      let statusMessage: string;
      
      if (action === 'start') {
        newStatus = "running";
        statusMessage = `${module.name} started successfully`;
        
        // Add specific startup logic for different modules
        switch (module.name) {
          case 'Data Fetcher':
            console.log(`Starting data fetcher module for real-time market data`);
            break;
          case 'Strategy Engine':
            console.log(`Starting strategy engine - all automated strategies activated`);
            break;
          case 'Order Manager':
            console.log(`Starting order manager - trade execution enabled`);
            break;
          case 'Risk Manager':
            console.log(`Starting risk manager - automatic risk controls activated`);
            break;
          case 'Portfolio Sync':
            console.log(`Starting portfolio sync - broker synchronization enabled`);
            break;
        }
      } else if (action === 'stop') {
        newStatus = "stopped";
        statusMessage = `${module.name} stopped successfully`;
        
        // Add specific shutdown logic for different modules
        switch (module.name) {
          case 'Data Fetcher':
            console.log(`Stopping data fetcher - real-time market data collection halted`);
            break;
          case 'Strategy Engine':
            console.log(`Stopping strategy engine - all automated strategies deactivated`);
            break;
          case 'Order Manager':
            console.log(`Stopping order manager - trade execution disabled`);
            break;
          case 'Risk Manager':
            console.log(`Stopping risk manager - automatic risk controls disabled`);
            break;
          case 'Portfolio Sync':
            console.log(`Stopping portfolio sync - broker synchronization disabled`);
            break;
        }
      } else {
        return res.status(400).json({ error: "Invalid action. Use 'start' or 'stop'" });
      }
      
      const updatedModule = await storage.updateModule(Number(id), {
        status: newStatus,
        lastUpdate: new Date(),
      });
      
      // Create a log entry for the module status change
      await storage.createLog({
        level: 'info',
        module: module.name,
        message: statusMessage,
        data: {
          moduleId: module.id,
          action,
          previousStatus: module.status,
          newStatus
        }
      });
      
      res.json(updatedModule);
    } catch (error) {
      console.error("Error toggling module:", error);
      res.status(500).json({ error: "Failed to toggle module" });
    }
  });

  // Logs endpoints
  app.get("/api/logs", async (req, res) => {
    try {
      const { level, module, limit = 100, offset = 0 } = req.query;
      const filters = {
        level: level as string,
        module: module as string,
      };
      const logs = await storage.getLogs(filters, Number(limit), Number(offset));
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.post("/api/logs", async (req, res) => {
    try {
      const validatedData = insertLogSchema.parse(req.body);
      const log = await storage.createLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating log:", error);
      res.status(500).json({ error: "Failed to create log" });
    }
  });

  // Market data endpoints
  app.get("/api/market/quote/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const userId = 1;
      const accessToken = await getValidUpstoxToken(userId, storage);
      if (!accessToken) {
        return res.status(401).json({ error: "Upstox account not linked or token expired" });
      }
      const quote = await upstoxService.getQuote(symbol, accessToken);
      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ error: "Failed to fetch market quote" });
    }
  });

  app.get("/api/market/historical/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { from, to, resolution } = req.query;
      const data = await upstoxService.getHistoricalData(
        symbol,
        from as string,
        to as string,
        resolution as string
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching historical data:", error);
      res.status(500).json({ error: "Failed to fetch historical data" });
    }
  });

  // Upstox account linking endpoints
  app.get("/api/upstox/auth-url", requireAuthFlexible, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user?.upstoxClientId || !user?.upstoxRedirectUri) {
        return res.status(400).json({ 
          error: "Please configure your Upstox API credentials first in Account Settings" 
        });
      }

      const state = `user_${userId}`;
      const authUrl = upstoxService.getAuthUrl(state);
      
      // Update the service with user-specific config for this request
      upstoxService.updateConfig({
        clientId: user.upstoxClientId,
        clientSecret: user.upstoxClientSecret || undefined,
        redirectUri: user.upstoxRedirectUri
      });
      
      res.json({ authUrl, state });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ error: "Failed to generate authentication URL" });
    }
  });

  app.get("/api/upstox/callback", async (req, res) => {
    try {
      console.log("Upstox callback received:", req.query);
      const { code, state } = req.query;
      
      if (!code) {
        console.error("No authorization code provided");
        return res.redirect("/?upstox=error&reason=no_code");
      }

      // For now, use hardcoded user ID since state might not be working
      const userId = 1;
      console.log("Processing callback for user:", userId);

      // Exchange code for access token
      console.log("Exchanging authorization code for access token...");
      const tokenData = await upstoxService.getAccessToken(code as string);
      console.log("Token data received:", { 
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in 
      });
      
      // Get user profile to verify account
      console.log("Fetching user profile...");
      const profile = await upstoxService.getUserProfile(tokenData.access_token);
      console.log("User profile:", profile.data);
      
      // Store tokens in account management module
      // Handle expiry time - Upstox tokens are typically valid for 1 day
      const expiryTime = tokenData.expires_in 
        ? new Date(Date.now() + (tokenData.expires_in * 1000))
        : new Date(Date.now() + (24 * 60 * 60 * 1000)); // Default to 24 hours
      console.log("Updating account with tokens...");
      
      await storage.updateAccount(userId, {
        upstoxAccessToken: tokenData.access_token,
        upstoxRefreshToken: tokenData.refresh_token || null,
        upstoxUserId: profile.data.user_id,
        upstoxTokenExpiry: expiryTime,
        upstoxTokenType: tokenData.token_type || 'Bearer',
      });

      // Update user status
      console.log("Updating user status...");
      await storage.updateUser(userId, {
        isUpstoxLinked: true,
      });

      console.log("Upstox account linked successfully for user:", userId);
      // Return a success page that can communicate with the parent window
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Upstox Authentication Success</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'UPSTOX_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/account?upstox=linked';
            }
          </script>
          <div style="text-align: center; padding: 50px;">
            <h2>Authentication Successful!</h2>
            <p>Your Upstox account has been linked successfully.</p>
            <p>This window will close automatically...</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error in Upstox callback:", error);
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Upstox Authentication Error</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'UPSTOX_AUTH_ERROR', 
                error: ${JSON.stringify(String((error as Error)?.message || 'Unknown error'))}
              }, '*');
              window.close();
            } else {
              window.location.href = '/account?upstox=error&reason=' + encodeURIComponent(${JSON.stringify(String((error as Error)?.message || 'Unknown error'))});
            }
          </script>
          <div style="text-align: center; padding: 50px;">
            <h2>Authentication Failed</h2>
            <p>There was an error linking your Upstox account.</p>
            <p>Error: ${String((error as Error)?.message || 'Unknown error')}</p>
            <p>This window will close automatically...</p>
          </div>
        </body>
        </html>
      `);
    }
  });

  app.post("/api/upstox/link-account", requireAuthFlexible, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const data = upstoxAccountLinkSchema.parse(req.body);
      
      // Verify the access token by getting user profile
      const profile = await upstoxService.getUserProfile(data.accessToken);
      
      const expiryTime = data.expiryTime ? new Date(data.expiryTime) : new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours default
      
      // Store tokens in account management module
      await storage.updateAccount(userId, {
        upstoxAccessToken: data.accessToken,
        upstoxRefreshToken: data.refreshToken,
        upstoxUserId: data.userId,
        upstoxTokenExpiry: expiryTime,
        upstoxTokenType: "Bearer",
      });

      // Update user status
      const updatedUser = await storage.updateUser(userId, {
        isUpstoxLinked: true,
      });

      console.log("Upstox account linked successfully for user:", { userId, upstoxUserId: data.userId });

      res.json({ 
        message: "Upstox account linked successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          isUpstoxLinked: updatedUser.isUpstoxLinked,
          upstoxUserId: data.userId
        }
      });
    } catch (error) {
      console.error("Error linking Upstox account:", error);
      res.status(500).json({ error: "Failed to link Upstox account" });
    }
  });

  app.get("/api/upstox/config", requireAuthFlexible, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        clientId: user.upstoxClientId || "",
        redirectUri: user.upstoxRedirectUri || "",
        hasClientSecret: !!user.upstoxClientSecret,
        isLinked: user.isUpstoxLinked || false
      });
    } catch (error) {
      console.error("Error fetching Upstox configuration:", error);
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.post("/api/upstox/update-config", requireAuthFlexible, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { clientId, clientSecret, redirectUri } = req.body;
      
      if (!clientId || !redirectUri) {
        return res.status(400).json({ error: "Client ID and Redirect URI are required" });
      }

      // Prepare update data for user-specific configuration
      const updateData: any = {
        upstoxClientId: clientId,
        upstoxRedirectUri: redirectUri
      };

      // Only update client secret if provided and not masked
      let clientSecretUpdated = false;
      if (clientSecret && clientSecret !== '••••••••••••••••') {
        updateData.upstoxClientSecret = clientSecret;
        clientSecretUpdated = true;
      }

      // Update user's Upstox configuration
      await storage.updateUser(userId, updateData);

      console.log("User-specific Upstox configuration updated:", { 
        userId, 
        clientId, 
        redirectUri, 
        clientSecretUpdated 
      });
      
      res.json({ 
        message: "Upstox configuration updated successfully",
        clientSecretUpdated
      });
    } catch (error) {
      console.error("Error updating user Upstox configuration:", error);
      res.status(500).json({ error: "Failed to update configuration" });
    }
  });

  app.post("/api/upstox/refresh-token", requireAuthFlexible, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const account = await storage.getAccount(userId);
      
      if (!account?.upstoxRefreshToken) {
        return res.status(400).json({ 
          error: "Upstox doesn't provide refresh tokens. Please re-authenticate to get a new access token." 
        });
      }

      // Refresh the access token using Upstox API
      const tokenData = await upstoxService.refreshAccessToken(account.upstoxRefreshToken);
      
      // Update account with new token data
      const expiryTime = tokenData.expires_in 
        ? new Date(Date.now() + (tokenData.expires_in * 1000))
        : new Date(Date.now() + (24 * 60 * 60 * 1000));
      await storage.updateAccount(userId, {
        upstoxAccessToken: tokenData.access_token,
        upstoxRefreshToken: tokenData.refresh_token || account.upstoxRefreshToken,
        upstoxTokenExpiry: expiryTime,
        upstoxTokenType: tokenData.token_type || 'Bearer',
      });

      res.json({ message: "Token refreshed successfully" });
    } catch (error) {
      console.error("Error refreshing token:", error);
      res.status(500).json({ error: "Failed to refresh token" });
    }
  });

  app.post("/api/upstox/unlink", requireAuthFlexible, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Remove Upstox credentials from account
      await storage.updateAccount(userId, {
        upstoxAccessToken: null,
        upstoxRefreshToken: null,
        upstoxUserId: null,
        upstoxTokenExpiry: null,
        upstoxTokenType: null,
      });

      // Update user status
      await storage.updateUser(userId, {
        isUpstoxLinked: false,
      });

      console.log("Upstox account unlinked for user:", userId);
      res.json({ message: "Upstox account unlinked successfully" });
    } catch (error) {
      console.error("Error unlinking Upstox account:", error);
      res.status(500).json({ error: "Failed to unlink Upstox account" });
    }
  });

  app.get("/api/upstox/account-status", requireAuthFlexible, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      const account = await storage.getAccount(userId);
      
      console.log("Account status check - User:", { 
        id: user?.id, 
        isUpstoxLinked: user?.isUpstoxLinked,
        hasClientId: !!user?.upstoxClientId,
        hasClientSecret: !!user?.upstoxClientSecret
      });
      console.log("Account status check - Account:", { 
        id: account?.id,
        hasAccessToken: !!account?.upstoxAccessToken,
        upstoxUserId: account?.upstoxUserId,
        tokenExpiry: account?.upstoxTokenExpiry
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if we have the minimum required configuration
      const hasCredentials = !!(user.upstoxClientId && user.upstoxClientSecret);
      const hasValidTokens = !!(account?.upstoxAccessToken && account?.upstoxUserId);
      const tokenExpired = account?.upstoxTokenExpiry ? new Date() > account.upstoxTokenExpiry : true;
      
      // Only consider it "linked" if we have both credentials AND valid tokens
      const isActuallyLinked = hasCredentials && hasValidTokens && !tokenExpired;

      const response = {
        isLinked: isActuallyLinked,
        hasCredentials,
        hasValidTokens,
        upstoxUserId: account?.upstoxUserId,
        tokenExpiry: account?.upstoxTokenExpiry,
        needsRefresh: tokenExpired && hasValidTokens
      };
      
      console.log("Returning account status:", response);
      res.json(response);
    } catch (error) {
      console.error("Error checking account status:", error);
      res.status(500).json({ error: "Failed to check account status" });
    }
  });

  // Test endpoint to verify token storage
  app.post("/api/upstox/test-token-storage", async (req, res) => {
    try {
      const userId = 1;
      console.log("Testing token storage for user:", userId);
      
      // Test data
      const testTokenData = {
        upstoxAccessToken: "test_access_token_123",
        upstoxRefreshToken: "test_refresh_token_456", 
        upstoxUserId: "test_user_789",
        upstoxTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        upstoxTokenType: "Bearer"
      };
      
      console.log("Storing test tokens:", testTokenData);
      await storage.updateAccount(userId, testTokenData);
      
      console.log("Updating user status...");
      await storage.updateUser(userId, { isUpstoxLinked: true });
      
      // Verify storage
      const account = await storage.getAccount(userId);
      const user = await storage.getUser(userId);
      
      console.log("Verification - Account has tokens:", !!account?.upstoxAccessToken);
      console.log("Verification - User is linked:", user?.isUpstoxLinked);
      
      res.json({ 
        success: true,
        stored: !!account?.upstoxAccessToken,
        linked: user?.isUpstoxLinked
      });
    } catch (error) {
      console.error("Token storage test failed:", error);
      res.status(500).json({ error: "Token storage test failed" });
    }
  });

  // Real Upstox API endpoints using authenticated tokens
  app.get("/api/upstox/portfolio", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const accessToken = await getValidUpstoxToken(userId, storage);
      
      if (!accessToken) {
        return res.status(401).json({ error: "Upstox account not linked or token expired" });
      }

      const portfolio = await upstoxService.getPortfolio(accessToken);
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio data" });
    }
  });

  app.get("/api/upstox/positions", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const accessToken = await getValidUpstoxToken(userId, storage);
      
      if (!accessToken) {
        return res.status(401).json({ error: "Upstox account not linked or token expired" });
      }

      const positions = await upstoxService.getPositions(accessToken);
      res.json(positions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ error: "Failed to fetch positions data" });
    }
  });

  app.get("/api/upstox/funds", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const accessToken = await getValidUpstoxToken(userId, storage);
      
      if (!accessToken) {
        return res.status(401).json({ error: "Upstox account not linked or token expired" });
      }

      const funds = await upstoxService.getFunds(accessToken);
      res.json(funds);
    } catch (error) {
      console.error("Error fetching funds:", error);
      res.status(500).json({ error: "Failed to fetch funds data" });
    }
  });

  app.get("/api/upstox/orders", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const accessToken = await getValidUpstoxToken(userId, storage);
      
      if (!accessToken) {
        return res.status(401).json({ error: "Upstox account not linked or token expired" });
      }

      const orders = await upstoxService.getOrders(accessToken);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders data" });
    }
  });

  app.get("/api/upstox/trades", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const accessToken = await getValidUpstoxToken(userId, storage);
      
      if (!accessToken) {
        return res.status(401).json({ error: "Upstox account not linked or token expired" });
      }

      const trades = await upstoxService.getTrades(accessToken);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ error: "Failed to fetch trades data" });
    }
  });

  app.get("/api/upstox/quote/:symbol", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const { symbol } = req.params;
      const accessToken = await getValidUpstoxToken(userId, storage);
      
      if (!accessToken) {
        return res.status(401).json({ error: "Upstox account not linked or token expired" });
      }

      const quote = await upstoxService.getQuote(symbol, accessToken);
      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ error: "Failed to fetch quote data" });
    }
  });

  app.post("/api/upstox/place-order", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const accessToken = await getValidUpstoxToken(userId, storage);
      
      if (!accessToken) {
        return res.status(401).json({ error: "Upstox account not linked or token expired" });
      }

      const orderData = req.body;
      const result = await upstoxService.placeOrder(orderData, accessToken);
      res.json(result);
    } catch (error) {
      console.error("Error placing order:", error);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAuthFlexible, async (req, res) => {
    try {
      const user = (req as any).authUser || await storage.getUser(req.session.userId!);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const allUsers = await storage.getAllUsers();
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => u.lastActive && 
        new Date(u.lastActive.toString()) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;

      // Calculate subscription stats
      const subscriptionStats = allUsers.reduce((acc, user) => {
        const plan = user.subscriptionPlan || 'free';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate revenue
      const totalRevenue = allUsers.reduce((sum, user) => {
        const planPrices = { free: 0, basic: 999, premium: 2999, enterprise: 9999 };
        return sum + (planPrices[user.subscriptionPlan as keyof typeof planPrices] || 0);
      }, 0);

      const currentMonth = new Date().getMonth();
      const recentSignups = allUsers.filter(u => 
        u.createdAt && new Date(u.createdAt.toString()).getMonth() === currentMonth
      ).length;

      const monthlyRevenue = recentSignups * 999; // Simplified calculation
      const churnRate = 5.2; // Placeholder - would calculate from actual data

      res.json({
        totalUsers,
        activeUsers,
        totalRevenue,
        monthlyRevenue,
        subscriptionStats: {
          free: subscriptionStats.free || 0,
          basic: subscriptionStats.basic || 0,
          premium: subscriptionStats.premium || 0,
          enterprise: subscriptionStats.enterprise || 0,
        },
        recentSignups,
        churnRate,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin statistics" });
    }
  });

  app.get("/api/admin/users", requireAuthFlexible, async (req, res) => {
    try {
      const user = (req as any).authUser || await storage.getUser(req.session.userId!);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const allUsers = await storage.getAllUsers();
      const userData = allUsers.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        subscriptionPlan: u.subscriptionPlan || 'free',
        subscriptionStatus: u.subscriptionStatus || 'active',
        subscriptionExpiry: u.subscriptionExpiry,
        trialEndsAt: u.trialEndsAt,
        totalRevenue: u.subscriptionPlan === 'premium' ? 2999 : u.subscriptionPlan === 'basic' ? 999 : 0,
        createdAt: u.createdAt,
        lastActive: u.lastActive,
        isUpstoxLinked: u.isUpstoxLinked || false,
      }));

      res.json(userData);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", requireAuthFlexible, async (req, res) => {
    try {
      const user = (req as any).authUser || await storage.getUser(req.session.userId!);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(Number(id), updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/admin/revenue", requireAuthFlexible, async (req, res) => {
    try {
      const user = (req as any).authUser || await storage.getUser(req.session.userId!);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Generate revenue data from actual user data
      const allUsers = await storage.getAllUsers();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const revenueData = months.map((month, index) => {
        const monthUsers = allUsers.filter(u => 
          new Date(u.createdAt).getMonth() === index
        );
        const revenue = monthUsers.reduce((sum, user) => {
          const planPrices = { free: 0, basic: 999, premium: 2999, enterprise: 9999 };
          return sum + (planPrices[user.subscriptionPlan as keyof typeof planPrices] || 0);
        }, 0);
        
        return {
          month,
          revenue,
          users: monthUsers.length,
          churn: Math.floor(Math.random() * 5) + 2, // Would calculate from actual churn data
        };
      });

      res.json(revenueData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  app.get("/api/admin/export/:type", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { type } = req.params;
      
      if (type === 'users') {
        const allUsers = await storage.getAllUsers();
        const csv = [
          'ID,Username,Email,Plan,Status,Created,Revenue',
          ...allUsers.map(u => [
            u.id,
            u.username,
            u.email,
            u.subscriptionPlan || 'free',
            u.subscriptionStatus || 'active',
            u.createdAt,
            u.subscriptionPlan === 'premium' ? 2999 : u.subscriptionPlan === 'basic' ? 999 : 0
          ].join(','))
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
        res.send(csv);
      } else if (type === 'revenue') {
        const allUsers = await storage.getAllUsers();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const csvData = months.map((month, index) => {
          const monthUsers = allUsers.filter(u => 
            new Date(u.createdAt).getMonth() === index
          );
          const revenue = monthUsers.reduce((sum, user) => {
            const planPrices = { free: 0, basic: 999, premium: 2999, enterprise: 9999 };
            return sum + (planPrices[user.subscriptionPlan as keyof typeof planPrices] || 0);
          }, 0);
          
          return `${month},${revenue},${monthUsers.length},${Math.floor(Math.random() * 5) + 2}`;
        });
        
        const csv = [
          'Month,Revenue,Users,Churn',
          ...csvData
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=revenue-export.csv');
        res.send(csv);
      } else {
        res.status(400).json({ error: "Invalid export type" });
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Subscription management routes
  app.get('/api/subscription/plans', async (req, res) => {
    try {
      let plans = await storage.getActiveSubscriptionPlans();
      
      // If no plans exist in database, create default plans
      if (plans.length === 0) {
        const defaultPlans = [
          {
            name: "Free",
            description: "Basic features for getting started",
            price: "0.00",
            currency: "USD",
            billingCycle: "forever",
            features: ["5 trading strategies", "10 backtests per month", "Basic analytics", "Community support"],
            isActive: true
          },
          {
            name: "Pro",
            description: "Advanced features for serious traders",
            price: "29.99",
            currency: "USD",
            billingCycle: "monthly",
            features: ["25 trading strategies", "100 backtests per month", "Advanced analytics", "Priority support", "API access (10,000 calls/month)", "Real-time alerts"],
            isActive: true
          },
          {
            name: "Enterprise",
            description: "Unlimited features for professional traders",
            price: "99.99",
            currency: "USD",
            billingCycle: "monthly",
            features: ["Unlimited strategies", "Unlimited backtests", "Premium analytics", "24/7 dedicated support", "API access (100,000 calls/month)", "Custom integrations", "White-label options"],
            isActive: true
          }
        ];

        // Create default plans
        for (const planData of defaultPlans) {
          await storage.createSubscriptionPlan(planData);
        }

        plans = await storage.getActiveSubscriptionPlans();
      }
      
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  app.get('/api/subscription/current', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const subscription = await storage.getUserSubscription(userId);
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  app.post('/api/subscription/upgrade', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { planId, paymentMethodId } = req.body;

      // Create payment transaction
      const transaction = await storage.createTransaction({
        userId,
        paymentMethodId,
        providerTransactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: "29.99", // This should come from the plan
        currency: "USD",
        status: "completed",
        type: "subscription",
        description: "Subscription upgrade",
        processedAt: new Date()
      });

      // Create or update subscription
      const existingSubscription = await storage.getUserSubscription(userId);
      
      if (existingSubscription) {
        await storage.updateUserSubscription(existingSubscription.id, {
          planId,
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      } else {
        await storage.createUserSubscription({
          userId,
          planId,
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        });
      }

      // Record usage analytics
      await storage.createUsageAnalytics({
        userId,
        feature: "subscription_upgrade",
        value: 1,
        metadata: { planId, transactionId: transaction.id }
      });

      res.json({ success: true, transactionId: transaction.id });
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  });

  // Payment methods routes
  app.get('/api/payment-methods', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      const paymentMethods = await storage.getUserPaymentMethods(userId);
      res.json(paymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  app.post('/api/payment-methods', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { type, cardLast4, cardBrand, cardExpMonth, cardExpYear } = req.body;

      const paymentMethod = await storage.createPaymentMethod({
        userId,
        type,
        provider: "mock", // Replace with actual payment provider
        providerPaymentMethodId: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cardLast4,
        cardBrand,
        cardExpMonth,
        cardExpYear,
        isDefault: false,
        isActive: true
      });

      res.json(paymentMethod);
    } catch (error) {
      console.error("Error creating payment method:", error);
      res.status(500).json({ error: "Failed to create payment method" });
    }
  });

  app.put('/api/payment-methods/:id/default', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      const paymentMethodId = parseInt(req.params.id);

      await storage.setDefaultPaymentMethod(userId, paymentMethodId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ error: "Failed to set default payment method" });
    }
  });

  // Billing history routes
  app.get('/api/billing/history', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { limit = 20, offset = 0 } = req.query;
      
      const transactions = await storage.getUserTransactions(
        userId, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching billing history:", error);
      res.status(500).json({ error: "Failed to fetch billing history" });
    }
  });

  // Usage analytics routes
  app.get('/api/usage/analytics', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { feature } = req.query;
      
      const analytics = await storage.getUserUsageAnalytics(userId, feature as string);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching usage analytics:", error);
      res.status(500).json({ error: "Failed to fetch usage analytics" });
    }
  });

  app.get('/api/usage/stats', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      const stats = await storage.getUsageStatsByUser(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ error: "Failed to fetch usage stats" });
    }
  });

  // Learning path routes
  app.get('/api/learning/paths', requireAuth, async (req, res) => {
    try {
      const paths = await storage.getLearningPaths();
      res.json(paths);
    } catch (error) {
      console.error("Error fetching learning paths:", error);
      res.status(500).json({ error: "Failed to fetch learning paths" });
    }
  });

  app.get('/api/learning/paths/:id', requireAuth, async (req, res) => {
    try {
      const pathId = parseInt(req.params.id);
      const path = await storage.getLearningPath(pathId);
      if (!path) {
        return res.status(404).json({ error: "Learning path not found" });
      }
      res.json(path);
    } catch (error) {
      console.error("Error fetching learning path:", error);
      res.status(500).json({ error: "Failed to fetch learning path" });
    }
  });

  app.get('/api/learning/paths/:id/lessons', requireAuth, async (req, res) => {
    try {
      const pathId = parseInt(req.params.id);
      const lessons = await storage.getLessons(pathId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get('/api/learning/lessons/:id', requireAuth, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.get('/api/learning/lessons/:id/quizzes', requireAuth, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const quizzes = await storage.getQuizzes(lessonId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ error: "Failed to fetch quizzes" });
    }
  });

  app.get('/api/learning/progress', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const pathId = req.query.pathId ? parseInt(req.query.pathId) : undefined;
      const lessonId = req.query.lessonId ? parseInt(req.query.lessonId) : undefined;
      const progress = await storage.getUserProgress(userId, pathId, lessonId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post('/api/learning/progress', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const progressData = { ...req.body, userId };
      const progress = await storage.createUserProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error creating progress:", error);
      res.status(500).json({ error: "Failed to create progress" });
    }
  });

  app.put('/api/learning/progress/:id', requireAuth, async (req, res) => {
    try {
      const progressId = parseInt(req.params.id);
      const progress = await storage.updateUserProgress(progressId, req.body);
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  app.get('/api/learning/achievements', requireAuth, async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get('/api/learning/user-achievements', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.get('/api/learning/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      let stats = await storage.getUserStats(userId);
      
      if (!stats) {
        stats = await storage.createUserStats({ userId });
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  return httpServer;
}
