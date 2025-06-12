export interface Quote {
  symbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface HistoricalDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioData {
  timestamp: string;
  value: number;
}

export interface ModuleStatusType {
  id: number;
  name: string;
  description: string;
  status: "running" | "stopped" | "error";
  lastUpdate: string;
  errorMessage?: string;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  channel?: string;
  timestamp: string;
}

export interface BacktestMetrics {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  avgTrade: number;
  volatility: number;
  finalValue: number;
}

export interface TradingStrategy {
  id: number;
  name: string;
  description: string;
  code: string;
  parameters: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: number;
  symbol: string;
  exchange: string;
  quantity: number;
  avgPrice: string;
  currentPrice?: string;
  pnl?: string;
  dayChange?: string;
  isOpen: boolean;
}

export interface Trade {
  id: number;
  symbol: string;
  exchange: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: string;
  orderType: string;
  status: string;
  pnl?: string;
  executedAt: string;
  strategyId?: number;
}

export interface Account {
  totalBalance?: string;
  availableMargin?: string;
  usedMargin?: string;
  todayPnL?: string;
  realizedPnL?: string;
}

export interface LogEntry {
  id: number;
  module: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: any;
  createdAt: string;
}
