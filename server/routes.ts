import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { generateStrategy } from "./openai";
import { runBacktest } from "./backtesting";
import { upstoxService, getValidUpstoxToken } from "./upstox";
import { configService } from "./config-service";
import { insertStrategySchema, insertBacktestSchema, insertLogSchema, upstoxAuthSchema, upstoxAccountLinkSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize configuration service
  await configService.initialize();
  
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

  app.post("/api/upstox/link-account", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
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

  app.get("/api/upstox/config", async (req, res) => {
    try {
      const config = await configService.getUpstoxConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching Upstox configuration:", error);
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.post("/api/upstox/update-config", async (req, res) => {
    try {
      const { clientId, clientSecret, redirectUri } = req.body;
      
      // Validate required fields (client secret is optional for updates)
      if (!clientId || !redirectUri) {
        return res.status(400).json({ error: "Client ID and Redirect URI are required" });
      }

      // Save configuration to database
      await storage.setConfiguration({
        key: "upstox_client_id",
        value: clientId,
        description: "Upstox API Client ID"
      });

      await storage.setConfiguration({
        key: "upstox_redirect_uri",
        value: redirectUri,
        description: "Upstox OAuth Redirect URI"
      });

      // Only update client secret if provided
      let clientSecretUpdated = false;
      if (clientSecret && clientSecret !== '••••••••••••••••') {
        await storage.setConfiguration({
          key: "upstox_client_secret", 
          value: clientSecret,
          description: "Upstox API Client Secret",
          isSecret: true
        });
        clientSecretUpdated = true;
      }

      // Get current configuration for Upstox service update
      const currentSecret = await storage.getConfiguration("upstox_client_secret");
      const configUpdate: any = { clientId, redirectUri };
      if (currentSecret) {
        configUpdate.clientSecret = currentSecret.value;
      }

      // Update the Upstox service configuration
      upstoxService.updateConfig(configUpdate);
      
      console.log("API Configuration updated and saved to database:", { 
        clientId, 
        redirectUri, 
        clientSecretUpdated 
      });
      
      res.json({ 
        message: "API configuration updated successfully",
        config: {
          clientId,
          redirectUri,
          clientSecretUpdated
        }
      });
    } catch (error) {
      console.error("Error updating API configuration:", error);
      res.status(500).json({ error: "Failed to update API configuration" });
    }
  });

  app.post("/api/upstox/refresh-token", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
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

  app.post("/api/upstox/unlink", async (req, res) => {
    try {
      const userId = 1; // In real app, get from session
      
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
      const account = await storage.getAccount(userId);
      
      console.log("Account status check - User:", { 
        id: user?.id, 
        isUpstoxLinked: user?.isUpstoxLinked 
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

      const response = {
        isLinked: user.isUpstoxLinked || false,
        upstoxUserId: account?.upstoxUserId,
        tokenExpiry: account?.upstoxTokenExpiry,
        needsRefresh: account?.upstoxTokenExpiry ? new Date() > account.upstoxTokenExpiry : false
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

  return httpServer;
}
