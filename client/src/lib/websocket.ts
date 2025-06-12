import { Quote, WebSocketMessage } from "@/types/trading";

class WebSocketManager {
  private ws: WebSocket | null = null;
  private subscriptions: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  connect() {
    try {
      const wsUrl = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      this.ws = new WebSocket(`${wsUrl}//${wsHost}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Re-subscribe to previous subscriptions
        this.subscriptions.forEach(channel => {
          this.subscribe(channel);
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const { type, channel, data } = message;
    
    // Handle different message types
    switch (type) {
      case 'market_data':
        if (channel) {
          const handler = this.messageHandlers.get(channel);
          if (handler) {
            handler(data);
          }
        }
        break;
        
      case 'portfolio_update':
        const portfolioHandler = this.messageHandlers.get('portfolio');
        if (portfolioHandler) {
          portfolioHandler(data);
        }
        break;
        
      case 'trade_update':
        const tradeHandler = this.messageHandlers.get('trades');
        if (tradeHandler) {
          tradeHandler(data);
        }
        break;
        
      case 'strategy_update':
        const strategyHandler = this.messageHandlers.get('strategies');
        if (strategyHandler) {
          strategyHandler(data);
        }
        break;
        
      case 'backtest_update':
        const backtestHandler = this.messageHandlers.get('backtests');
        if (backtestHandler) {
          backtestHandler(data);
        }
        break;
        
      case 'module_update':
        const moduleHandler = this.messageHandlers.get('modules');
        if (moduleHandler) {
          moduleHandler(data);
        }
        break;
        
      case 'connection':
      case 'auth':
      case 'subscription':
        console.log(`WebSocket ${type}:`, data);
        break;
        
      case 'error':
        console.error('WebSocket error:', message.data);
        break;
        
      default:
        console.log('Unknown message type:', type, data);
    }
  }

  subscribe(channel: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel: channel
      }));
      this.subscriptions.add(channel);
    }
  }

  unsubscribe(channel: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        channel: channel
      }));
      this.subscriptions.delete(channel);
    }
  }

  authenticate(userId: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'auth',
        userId: userId
      }));
    }
  }

  onMessage(channel: string, handler: (data: any) => void) {
    this.messageHandlers.set(channel, handler);
  }

  offMessage(channel: string) {
    this.messageHandlers.delete(channel);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.messageHandlers.clear();
  }

  ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  // Convenience methods for common subscriptions
  subscribeToQuote(symbol: string, handler: (quote: Quote) => void) {
    const channel = `quote:${symbol}`;
    this.onMessage(channel, handler);
    this.subscribe(channel);
  }

  subscribeToPortfolio(handler: (data: any) => void) {
    this.onMessage('portfolio', handler);
    this.subscribe('portfolio');
  }

  subscribeToTrades(handler: (data: any) => void) {
    this.onMessage('trades', handler);
    this.subscribe('trades');
  }

  subscribeToStrategies(handler: (data: any) => void) {
    this.onMessage('strategies', handler);
    this.subscribe('strategies');
  }

  subscribeToBacktests(handler: (data: any) => void) {
    this.onMessage('backtests', handler);
    this.subscribe('backtests');
  }

  subscribeToModules(handler: (data: any) => void) {
    this.onMessage('modules', handler);
    this.subscribe('modules');
  }

  subscribeToMarketStatus(handler: (data: any) => void) {
    this.onMessage('market_status', handler);
    this.subscribe('market_status');
  }
}

export const wsManager = new WebSocketManager();

// Auto-connect when the module is loaded
if (typeof window !== 'undefined') {
  wsManager.connect();
  
  // Authenticate with default user ID (in real app, get from auth context)
  wsManager.authenticate(1);
  
  // Ping every 30 seconds to keep connection alive
  setInterval(() => {
    wsManager.ping();
  }, 30000);
}
