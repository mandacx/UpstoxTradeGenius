import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { generateStrategy } from "./openai";
import { runBacktest } from "./backtesting";
import { upstoxService } from "./upstox";
import { insertStrategySchema, insertBacktestSchema, insertLogSchema, upstoxAuthSchema, upstoxAccountLinkSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Temporarily disable WebSocket to prevent crashes
  // const wss = new WebSocketServer({ server: httpServer });
  // setupWebSocket(wss);

  // Account endpoints
  app.get("/api/account", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const account = await storage.getAccount(userId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ error: "Failed to fetch account data" });
    }
  });

  // Positions endpoints
  app.get("/api/positions", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const positions = await storage.getPositions(userId);
      res.json(positions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  app.get("/api/positions/open", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const positions = await storage.getOpenPositions(userId);
      res.json(positions);
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
  app.get("/api/backtests", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const backtests = await storage.getBacktests(userId);
      res.json(backtests);
    } catch (error) {
      console.error("Error fetching backtests:", error);
      res.status(500).json({ error: "Failed to fetch backtests" });
    }
  });

  app.post("/api/backtests", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const validatedData = insertBacktestSchema.parse({
        ...req.body,
        userId,
      });
      
      const backtest = await storage.createBacktest(validatedData);
      
      // Run backtest asynchronously
      runBacktest(backtest.id).catch(error => {
        console.error("Backtest execution failed:", error);
        storage.updateBacktest(backtest.id, { 
          status: "error",
          completedAt: new Date()
        });
      });
      
      res.status(201).json(backtest);
    } catch (error) {
      console.error("Error creating backtest:", error);
      res.status(500).json({ error: "Failed to create backtest" });
    }
  });

  app.get("/api/backtests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const backtest = await storage.getBacktest(Number(id));
      if (!backtest) {
        return res.status(404).json({ error: "Backtest not found" });
      }
      res.json(backtest);
    } catch (error) {
      console.error("Error fetching backtest:", error);
      res.status(500).json({ error: "Failed to fetch backtest" });
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
      const module = await storage.getModule(Number(id));
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      const newStatus = module.status === "running" ? "stopped" : "running";
      const updatedModule = await storage.updateModule(Number(id), {
        status: newStatus,
        lastUpdate: new Date(),
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
      const quote = await upstoxService.getQuote(symbol);
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
  app.get("/api/upstox/auth-url", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const state = `user_${userId}`;
      const authUrl = upstoxService.getAuthUrl(state);
      res.json({ authUrl, state });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ error: "Failed to generate authentication URL" });
    }
  });

  app.get("/api/upstox/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).json({ error: "Authorization code not provided" });
      }

      // Extract user ID from state
      const userId = state?.toString().split('_')[1];
      if (!userId) {
        return res.status(400).json({ error: "Invalid state parameter" });
      }

      // Exchange code for access token
      const tokenData = await upstoxService.getAccessToken(code as string);
      
      // Get user profile to verify account
      const profile = await upstoxService.getUserProfile(tokenData.access_token);
      
      // Update user with Upstox credentials
      const expiryTime = new Date(Date.now() + (tokenData.expires_in * 1000));
      await storage.updateUser(parseInt(userId), {
        upstoxUserId: profile.data.user_id,
        upstoxAccessToken: tokenData.access_token,
        upstoxRefreshToken: tokenData.refresh_token,
        upstoxTokenExpiry: expiryTime,
        isUpstoxLinked: true,
      });

      // Redirect to dashboard with success message
      res.redirect("/?upstox=linked");
    } catch (error) {
      console.error("Error in Upstox callback:", error);
      res.redirect("/?upstox=error");
    }
  });

  app.post("/api/upstox/link-account", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const data = upstoxAccountLinkSchema.parse(req.body);
      
      // Verify the access token by getting user profile
      const profile = await upstoxService.getUserProfile(data.accessToken);
      
      const expiryTime = data.expiryTime ? new Date(data.expiryTime) : new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours default
      
      // Update user with Upstox credentials
      const updatedUser = await storage.updateUser(userId, {
        upstoxUserId: data.userId,
        upstoxAccessToken: data.accessToken,
        upstoxRefreshToken: data.refreshToken,
        upstoxTokenExpiry: expiryTime,
        isUpstoxLinked: true,
      });

      res.json({ 
        message: "Upstox account linked successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          isUpstoxLinked: updatedUser.isUpstoxLinked,
          upstoxUserId: updatedUser.upstoxUserId
        }
      });
    } catch (error) {
      console.error("Error linking Upstox account:", error);
      res.status(500).json({ error: "Failed to link Upstox account" });
    }
  });

  app.post("/api/upstox/refresh-token", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const user = await storage.getUser(userId);
      
      if (!user?.upstoxRefreshToken) {
        return res.status(400).json({ error: "No refresh token available" });
      }

      // Refresh the access token
      const tokenData = await upstoxService.refreshAccessToken(user.upstoxRefreshToken);
      
      // Update user with new token
      const expiryTime = new Date(Date.now() + (tokenData.expires_in * 1000));
      await storage.updateUser(userId, {
        upstoxAccessToken: tokenData.access_token,
        upstoxRefreshToken: tokenData.refresh_token || user.upstoxRefreshToken,
        upstoxTokenExpiry: expiryTime,
      });

      res.json({ message: "Token refreshed successfully" });
    } catch (error) {
      console.error("Error refreshing token:", error);
      res.status(500).json({ error: "Failed to refresh token" });
    }
  });

  app.delete("/api/upstox/unlink-account", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      
      // Remove Upstox credentials
      await storage.updateUser(userId, {
        upstoxUserId: null,
        upstoxAccessToken: null,
        upstoxRefreshToken: null,
        upstoxTokenExpiry: null,
        isUpstoxLinked: false,
      });

      res.json({ message: "Upstox account unlinked successfully" });
    } catch (error) {
      console.error("Error unlinking Upstox account:", error);
      res.status(500).json({ error: "Failed to unlink Upstox account" });
    }
  });

  app.get("/api/upstox/account-status", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        isLinked: user.isUpstoxLinked || false,
        upstoxUserId: user.upstoxUserId,
        tokenExpiry: user.upstoxTokenExpiry,
        needsRefresh: user.upstoxTokenExpiry ? new Date() > user.upstoxTokenExpiry : false
      });
    } catch (error) {
      console.error("Error checking account status:", error);
      res.status(500).json({ error: "Failed to check account status" });
    }
  });

  return httpServer;
}
