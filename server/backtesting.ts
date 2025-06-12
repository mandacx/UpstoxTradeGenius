import { storage } from "./storage";
import { upstoxService } from "./upstox";
import { VM } from "vm2";

interface BacktestResult {
  trades: Array<{
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    timestamp: string;
    pnl?: number;
  }>;
  metrics: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    avgTrade: number;
    volatility: number;
  };
  equity_curve: Array<{
    timestamp: string;
    value: number;
  }>;
}

class BacktestingEngine {
  async runBacktest(backtestId: number): Promise<void> {
    try {
      const backtest = await storage.getBacktest(backtestId);
      if (!backtest) {
        throw new Error("Backtest not found");
      }

      const strategy = await storage.getStrategy(backtest.strategyId!);
      if (!strategy) {
        throw new Error("Strategy not found");
      }

      // Update status to running
      await storage.updateBacktest(backtestId, {
        status: "running",
      });

      // Get historical data for the date range
      const symbols = this.extractSymbolsFromStrategy(strategy.code);
      const historicalData = await this.getHistoricalDataForBacktest(
        symbols,
        backtest.startDate,
        backtest.endDate
      );

      // Run the backtest simulation
      const results = await this.simulateStrategy(
        strategy.code,
        strategy.parameters,
        historicalData,
        Number(backtest.initialCapital)
      );

      // Calculate metrics
      const metrics = this.calculateMetrics(results, Number(backtest.initialCapital));

      // Update backtest with results
      await storage.updateBacktest(backtestId, {
        status: "completed",
        finalValue: metrics.finalValue,
        totalReturn: metrics.totalReturn,
        sharpeRatio: metrics.sharpeRatio,
        maxDrawdown: metrics.maxDrawdown,
        winRate: metrics.winRate,
        totalTrades: metrics.totalTrades,
        results: results,
        completedAt: new Date(),
      });

      console.log(`Backtest ${backtestId} completed successfully`);
    } catch (error) {
      console.error(`Backtest ${backtestId} failed:`, error);
      await storage.updateBacktest(backtestId, {
        status: "error",
        completedAt: new Date(),
      });
      throw error;
    }
  }

  private extractSymbolsFromStrategy(code: string): string[] {
    // Extract symbols from strategy code
    const symbolMatches = code.match(/(?:symbol|instrument)[\s]*[=:][\s]*['"`]([^'"`]+)['"`]/gi);
    const symbols = symbolMatches ? symbolMatches.map(match => {
      const symbolMatch = match.match(/['"`]([^'"`]+)['"`]/);
      return symbolMatch ? symbolMatch[1] : null;
    }).filter(Boolean) : [];
    
    return symbols.length > 0 ? symbols as string[] : ["RELIANCE"]; // Default symbol
  }

  private async getHistoricalDataForBacktest(
    symbols: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {};
    
    for (const symbol of symbols) {
      try {
        const historicalData = await upstoxService.getHistoricalData(
          symbol,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          "1day"
        );
        data[symbol] = historicalData;
      } catch (error) {
        console.error(`Failed to fetch data for ${symbol}:`, error);
        // Use mock data if API fails
        data[symbol] = this.generateMockData(startDate, endDate);
      }
    }
    
    return data;
  }

  private generateMockData(startDate: Date, endDate: Date): any[] {
    const data = [];
    const current = new Date(startDate);
    let price = 1000 + Math.random() * 2000; // Random starting price between 1000-3000
    
    while (current <= endDate) {
      const change = (Math.random() - 0.5) * 0.02; // ±1% daily change
      price *= (1 + change);
      
      const high = price * (1 + Math.random() * 0.01);
      const low = price * (1 - Math.random() * 0.01);
      const volume = Math.floor(10000 + Math.random() * 90000);
      
      data.push({
        timestamp: current.toISOString(),
        open: price,
        high,
        low,
        close: price,
        volume,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return data;
  }

  private async simulateStrategy(
    code: string,
    parameters: any,
    historicalData: Record<string, any[]>,
    initialCapital: number
  ): Promise<BacktestResult> {
    const vm = new VM({
      timeout: 30000, // 30 second timeout
      sandbox: {
        console: {
          log: (...args: any[]) => console.log('[Strategy]', ...args),
          error: (...args: any[]) => console.error('[Strategy]', ...args),
        },
        Math,
        Date,
        data: historicalData,
        parameters: parameters || {},
        trades: [] as any[],
        portfolio: { cash: initialCapital, positions: {} as Record<string, number> },
        
        // Trading functions
        buy: function(symbol: string, quantity: number, price: number, timestamp: string) {
          const cost = quantity * price;
          if (this.portfolio.cash >= cost) {
            this.portfolio.cash -= cost;
            this.portfolio.positions[symbol] = (this.portfolio.positions[symbol] || 0) + quantity;
            this.trades.push({
              symbol,
              side: 'BUY',
              quantity,
              price,
              timestamp,
            });
          }
        },
        
        sell: function(symbol: string, quantity: number, price: number, timestamp: string) {
          if ((this.portfolio.positions[symbol] || 0) >= quantity) {
            this.portfolio.cash += quantity * price;
            this.portfolio.positions[symbol] = (this.portfolio.positions[symbol] || 0) - quantity;
            this.trades.push({
              symbol,
              side: 'SELL',
              quantity,
              price,
              timestamp,
            });
          }
        },
        
        // Technical indicators (simplified)
        sma: function(prices: number[], period: number): number[] {
          const sma = [];
          for (let i = period - 1; i < prices.length; i++) {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
          }
          return sma;
        },
        
        rsi: function(prices: number[], period: number = 14): number[] {
          const changes = [];
          for (let i = 1; i < prices.length; i++) {
            changes.push(prices[i] - prices[i - 1]);
          }
          
          const rsi = [];
          for (let i = period; i < changes.length; i++) {
            const gains = changes.slice(i - period, i).filter(x => x > 0);
            const losses = changes.slice(i - period, i).filter(x => x < 0).map(x => -x);
            
            const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
            const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
            
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            rsi.push(100 - (100 / (1 + rs)));
          }
          return rsi;
        },
      },
    });

    try {
      // Execute the strategy
      vm.run(code);
      
      const trades = vm.run('trades');
      const portfolio = vm.run('portfolio');
      
      // Calculate equity curve
      const equity_curve = this.calculateEquityCurve(trades, initialCapital, historicalData);
      
      return {
        trades: trades || [],
        metrics: {} as any, // Will be calculated separately
        equity_curve,
      };
    } catch (error) {
      console.error("Strategy execution failed:", error);
      throw new Error(`Strategy execution failed: ${error.message}`);
    }
  }

  private calculateEquityCurve(
    trades: any[],
    initialCapital: number,
    historicalData: Record<string, any[]>
  ): Array<{ timestamp: string; value: number }> {
    const curve = [];
    let portfolioValue = initialCapital;
    const positions: Record<string, number> = {};
    
    // Get all unique timestamps and sort them
    const allTimestamps = new Set<string>();
    Object.values(historicalData).forEach(data => {
      data.forEach(point => allTimestamps.add(point.timestamp));
    });
    
    const sortedTimestamps = Array.from(allTimestamps).sort();
    
    let tradeIndex = 0;
    
    for (const timestamp of sortedTimestamps) {
      // Process trades at this timestamp
      while (tradeIndex < trades.length && trades[tradeIndex].timestamp <= timestamp) {
        const trade = trades[tradeIndex];
        if (trade.side === 'BUY') {
          positions[trade.symbol] = (positions[trade.symbol] || 0) + trade.quantity;
          portfolioValue -= trade.quantity * trade.price;
        } else {
          positions[trade.symbol] = (positions[trade.symbol] || 0) - trade.quantity;
          portfolioValue += trade.quantity * trade.price;
        }
        tradeIndex++;
      }
      
      // Calculate current portfolio value
      let currentValue = portfolioValue;
      for (const [symbol, quantity] of Object.entries(positions)) {
        if (quantity > 0 && historicalData[symbol]) {
          const dataPoint = historicalData[symbol].find(d => d.timestamp === timestamp);
          if (dataPoint) {
            currentValue += quantity * dataPoint.close;
          }
        }
      }
      
      curve.push({ timestamp, value: currentValue });
    }
    
    return curve;
  }

  private calculateMetrics(results: BacktestResult, initialCapital: number) {
    const { trades, equity_curve } = results;
    
    if (equity_curve.length === 0) {
      return {
        finalValue: initialCapital,
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        totalTrades: 0,
        avgTrade: 0,
        volatility: 0,
      };
    }
    
    const finalValue = equity_curve[equity_curve.length - 1].value;
    const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;
    
    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < equity_curve.length; i++) {
      const dailyReturn = (equity_curve[i].value - equity_curve[i - 1].value) / equity_curve[i - 1].value;
      returns.push(dailyReturn);
    }
    
    // Calculate Sharpe ratio (assuming risk-free rate of 5%)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const returnStdDev = Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = returnStdDev === 0 ? 0 : (avgReturn - 0.0002) / returnStdDev; // Daily risk-free rate ~0.02%
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = equity_curve[0].value;
    
    for (const point of equity_curve) {
      if (point.value > peak) {
        peak = point.value;
      }
      const drawdown = (peak - point.value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Calculate win rate
    const profitableTrades = trades.filter(trade => trade.pnl && trade.pnl > 0).length;
    const winRate = trades.length > 0 ? (profitableTrades / trades.length) * 100 : 0;
    
    // Calculate average trade
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const avgTrade = trades.length > 0 ? totalPnL / trades.length : 0;
    
    // Calculate volatility (annualized)
    const volatility = returnStdDev * Math.sqrt(252) * 100; // 252 trading days
    
    return {
      finalValue,
      totalReturn,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      winRate,
      totalTrades: trades.length,
      avgTrade,
      volatility,
    };
  }
}

const backtestingEngine = new BacktestingEngine();

export async function runBacktest(backtestId: number): Promise<void> {
  return backtestingEngine.runBacktest(backtestId);
}
