import { WebSocketServer, WebSocket } from "ws";
import { upstoxService } from "./upstox";
import { storage } from "./storage";

interface Client {
  ws: WebSocket;
  userId?: number;
  subscriptions: Set<string>;
}

class WebSocketManager {
  private clients: Set<Client> = new Set();
  private marketDataInterval?: NodeJS.Timeout;
  private portfolioUpdateInterval?: NodeJS.Timeout;

  setup(wss: WebSocketServer) {
    wss.on("connection", (ws: WebSocket) => {
      const client: Client = {
        ws,
        subscriptions: new Set(),
      };

      this.clients.add(client);
      console.log("WebSocket client connected");

      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(client, message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          this.sendError(client, "Invalid message format");
        }
      });

      ws.on("close", () => {
        this.clients.delete(client);
        console.log("WebSocket client disconnected");
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(client);
      });

      // Send initial connection confirmation
      this.sendMessage(client, {
        type: "connection",
        status: "connected",
        timestamp: new Date().toISOString(),
      });
    });

    // Start periodic updates
    this.startMarketDataUpdates();
    this.startPortfolioUpdates();
  }

  private handleMessage(client: Client, message: any) {
    switch (message.type) {
      case "auth":
        client.userId = message.userId;
        this.sendMessage(client, {
          type: "auth",
          status: "authenticated",
          userId: message.userId,
        });
        break;

      case "subscribe":
        if (message.channel) {
          client.subscriptions.add(message.channel);
          this.sendMessage(client, {
            type: "subscription",
            channel: message.channel,
            status: "subscribed",
          });
        }
        break;

      case "unsubscribe":
        if (message.channel) {
          client.subscriptions.delete(message.channel);
          this.sendMessage(client, {
            type: "subscription",
            channel: message.channel,
            status: "unsubscribed",
          });
        }
        break;

      case "ping":
        this.sendMessage(client, {
          type: "pong",
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        this.sendError(client, `Unknown message type: ${message.type}`);
    }
  }

  private sendMessage(client: Client, message: any) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private sendError(client: Client, error: string) {
    this.sendMessage(client, {
      type: "error",
      message: error,
      timestamp: new Date().toISOString(),
    });
  }

  private broadcast(message: any, channel?: string) {
    this.clients.forEach((client) => {
      if (!channel || client.subscriptions.has(channel)) {
        this.sendMessage(client, message);
      }
    });
  }

  private startMarketDataUpdates() {
    // Update market data every 5 seconds
    this.marketDataInterval = setInterval(async () => {
      try {
        // Get list of symbols that clients are subscribed to
        const subscribedSymbols = new Set<string>();
        this.clients.forEach(client => {
          client.subscriptions.forEach(sub => {
            if (sub.startsWith("quote:")) {
              subscribedSymbols.add(sub.replace("quote:", ""));
            }
          });
        });

        // Fetch quotes for subscribed symbols
        for (const symbol of subscribedSymbols) {
          try {
            const quote = await upstoxService.getQuote(symbol);
            this.broadcast({
              type: "market_data",
              channel: `quote:${symbol}`,
              data: quote,
              timestamp: new Date().toISOString(),
            }, `quote:${symbol}`);
          } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
          }
        }

        // Broadcast general market status
        this.broadcast({
          type: "market_status",
          data: {
            status: "open", // In real implementation, determine actual market status
            timestamp: new Date().toISOString(),
          },
        }, "market_status");
      } catch (error) {
        console.error("Error in market data update:", error);
      }
    }, 5000);
  }

  private startPortfolioUpdates() {
    // Update portfolio data every 30 seconds
    this.portfolioUpdateInterval = setInterval(async () => {
      try {
        // Update positions for authenticated clients
        const authenticatedClients = Array.from(this.clients).filter(
          client => client.userId && client.subscriptions.has("portfolio")
        );

        for (const client of authenticatedClients) {
          try {
            const positions = await storage.getOpenPositions(client.userId!);
            const account = await storage.getAccount(client.userId!);

            this.sendMessage(client, {
              type: "portfolio_update",
              data: {
                positions,
                account,
              },
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.error(`Error updating portfolio for user ${client.userId}:`, error);
          }
        }
      } catch (error) {
        console.error("Error in portfolio update:", error);
      }
    }, 30000);
  }

  // Public methods for sending specific updates
  async sendTradeUpdate(userId: number, trade: any) {
    const message = {
      type: "trade_update",
      data: trade,
      timestamp: new Date().toISOString(),
    };

    this.clients.forEach(client => {
      if (client.userId === userId && client.subscriptions.has("trades")) {
        this.sendMessage(client, message);
      }
    });
  }

  async sendStrategyUpdate(userId: number, strategy: any) {
    const message = {
      type: "strategy_update",
      data: strategy,
      timestamp: new Date().toISOString(),
    };

    this.clients.forEach(client => {
      if (client.userId === userId && client.subscriptions.has("strategies")) {
        this.sendMessage(client, message);
      }
    });
  }

  async sendBacktestUpdate(userId: number, backtest: any) {
    const message = {
      type: "backtest_update",
      data: backtest,
      timestamp: new Date().toISOString(),
    };

    this.clients.forEach(client => {
      if (client.userId === userId && client.subscriptions.has("backtests")) {
        this.sendMessage(client, message);
      }
    });
  }

  async sendModuleUpdate(module: any) {
    const message = {
      type: "module_update",
      data: module,
      timestamp: new Date().toISOString(),
    };

    this.broadcast(message, "modules");
  }

  cleanup() {
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
    }
    if (this.portfolioUpdateInterval) {
      clearInterval(this.portfolioUpdateInterval);
    }
  }
}

const wsManager = new WebSocketManager();

export function setupWebSocket(wss: WebSocketServer) {
  wsManager.setup(wss);
}

export { wsManager };
