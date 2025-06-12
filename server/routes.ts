import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { generateStrategy } from "./openai";
import { runBacktest } from "./backtesting";
import { upstoxService } from "./upstox";
import { insertStrategySchema, insertBacktestSchema, insertLogSchema } from "@shared/schema";

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

  return httpServer;
}
