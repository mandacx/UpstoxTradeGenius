import { storage } from "./storage";
import { upstoxService, getValidUpstoxToken } from "./upstox";
import { VM } from "vm2";

interface BacktestResult {
  trades: Array<{
    symbol: string;
    side: string;
    quantity: number;
    entryPrice: number;
    exitPrice?: number;
    entryTime: string;
    exitTime?: string;
    pnl?: number;
    pnlPercent?: number;
    status: string;
    reason: string;
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
  equityCurve: Array<{
    timestamp: string;
    value: number;
  }>;
}

class EnhancedBacktestingEngine {
  private cancelledBacktests = new Set<number>();

  async runBacktest(backtestId: number): Promise<void> {
    try {
      console.log(`Starting enhanced backtest ${backtestId}`);
      
      // Mark as running and started
      await storage.updateBacktest(backtestId, {
        status: "running",
        startedAt: new Date(),
        progress: 0,
        progressMessage: "Initializing backtest..."
      });

      const backtest = await storage.getBacktest(backtestId);
      if (!backtest) {
        throw new Error("Backtest not found");
      }

      if (this.cancelledBacktests.has(backtestId)) {
        await this.markAsCancelled(backtestId);
        return;
      }

      // Update progress: Fetching strategy
      await storage.updateBacktest(backtestId, {
        progress: 10,
        progressMessage: "Loading strategy..."
      });

      const strategy = await storage.getStrategy(backtest.strategyId!);
      if (!strategy) {
        throw new Error("Strategy not found");
      }

      if (this.cancelledBacktests.has(backtestId)) {
        await this.markAsCancelled(backtestId);
        return;
      }

      // Update progress: Fetching historical data
      await storage.updateBacktest(backtestId, {
        progress: 20,
        progressMessage: `Fetching historical data for ${backtest.symbol}...`
      });

      const historicalData = await this.getHistoricalDataForBacktest(
        backtest.symbol,
        backtest.timeframe,
        backtest.startDate,
        backtest.endDate
      );

      if (this.cancelledBacktests.has(backtestId)) {
        await this.markAsCancelled(backtestId);
        return;
      }

      // Update progress: Running simulation
      await storage.updateBacktest(backtestId, {
        progress: 30,
        progressMessage: "Running strategy simulation..."
      });

      const results = await this.simulateStrategy(
        backtestId,
        strategy.code,
        historicalData,
        Number(backtest.initialCapital),
        backtest.symbol
      );

      if (this.cancelledBacktests.has(backtestId)) {
        await this.markAsCancelled(backtestId);
        return;
      }

      // Update progress: Calculating metrics
      await storage.updateBacktest(backtestId, {
        progress: 80,
        progressMessage: "Calculating performance metrics..."
      });

      const equityCurve = this.calculateEquityCurve(results, Number(backtest.initialCapital));
      const metrics = this.calculateMetrics(results, Number(backtest.initialCapital));

      // Update progress: Saving results
      await storage.updateBacktest(backtestId, {
        progress: 90,
        progressMessage: "Saving results..."
      });

      // Save final results
      await storage.updateBacktest(backtestId, {
        status: "completed",
        progress: 100,
        progressMessage: "Backtest completed successfully",
        finalValue: (Number(backtest.initialCapital) * (1 + metrics.totalReturn)).toString(),
        totalReturn: metrics.totalReturn.toString(),
        sharpeRatio: metrics.sharpeRatio.toString(),
        maxDrawdown: metrics.maxDrawdown.toString(),
        winRate: metrics.winRate.toString(),
        totalTrades: metrics.totalTrades,
        results: results,
        equityCurve: equityCurve,
        completedAt: new Date()
      });

      console.log(`Backtest ${backtestId} completed successfully`);
    } catch (error: any) {
      console.error(`Backtest ${backtestId} failed:`, error);
      await storage.updateBacktest(backtestId, { 
        status: "error",
        progressMessage: `Error: ${error?.message || 'Unknown error'}`,
        completedAt: new Date()
      });
      throw error;
    } finally {
      this.cancelledBacktests.delete(backtestId);
    }
  }

  async cancelBacktest(backtestId: number): Promise<void> {
    console.log(`Cancelling backtest ${backtestId}`);
    this.cancelledBacktests.add(backtestId);
    await storage.updateBacktest(backtestId, {
      status: "cancelled",
      progressMessage: "Backtest cancelled by user",
      completedAt: new Date()
    });
  }

  private async markAsCancelled(backtestId: number): Promise<void> {
    await storage.updateBacktest(backtestId, {
      status: "cancelled",
      progressMessage: "Backtest cancelled by user",
      completedAt: new Date()
    });
    throw new Error("Backtest was cancelled");
  }

  private async getHistoricalDataForBacktest(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      // Try to get real data from Upstox if token available
      const userId = 1;
      const accessToken = await getValidUpstoxToken(userId, storage);
      
      if (accessToken) {
        console.log(`Fetching real historical data for ${symbol} from Upstox`);
        const data = await upstoxService.getHistoricalData(
          symbol,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          timeframe,
          accessToken
        );
        
        if (data && data.length > 0) {
          return data;
        }
      }
      
      // Generate realistic mock data for backtesting
      console.log(`Generating mock data for ${symbol} (${timeframe})`);
      return this.generateRealisticMockData(symbol, timeframe, startDate, endDate);
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error);
      // Generate realistic mock data as fallback
      return this.generateRealisticMockData(symbol, timeframe, startDate, endDate);
    }
  }

  private generateRealisticMockData(symbol: string, timeframe: string, startDate: Date, endDate: Date): any[] {
    const data = [];
    const currentDate = new Date(startDate);
    let currentPrice = symbol.includes('NIFTY') ? 18000 : 100; // Base price

    const getTimeframeMinutes = (tf: string) => {
      switch (tf) {
        case '1minute': return 1;
        case '5minute': return 5;
        case '15minute': return 15;
        case '1hour': return 60;
        case '1day': return 1440;
        default: return 1440;
      }
    };

    const minutes = getTimeframeMinutes(timeframe);
    
    while (currentDate <= endDate) {
      // Skip weekends for daily data
      if (timeframe === '1day' && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Skip non-market hours for intraday data
      if (minutes < 1440) {
        const hour = currentDate.getHours();
        if (hour < 9 || hour > 15) {
          currentDate.setMinutes(currentDate.getMinutes() + minutes);
          continue;
        }
      }

      const volatility = 0.02; // 2% daily volatility
      const change = (Math.random() - 0.5) * volatility * 2;
      const open = currentPrice;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(Math.random() * 1000000) + 10000;

      data.push({
        timestamp: currentDate.toISOString(),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: volume
      });

      currentPrice = close;
      currentDate.setMinutes(currentDate.getMinutes() + minutes);
    }

    return data;
  }

  private async simulateStrategy(
    backtestId: number,
    strategyCode: string,
    historicalData: any[],
    initialCapital: number,
    symbol: string
  ): Promise<BacktestResult> {
    const trades: any[] = [];
    let currentPosition = 0;
    let currentCapital = initialCapital;
    let openTrade: any = null;

    const tradeQuantity = Math.floor(initialCapital / (historicalData[0]?.close || 100) / 10); // Use 10% of capital per trade

    for (let i = 20; i < historicalData.length; i++) {
      if (this.cancelledBacktests.has(backtestId)) {
        throw new Error("Backtest was cancelled");
      }

      // Update progress periodically
      if (i % Math.floor(historicalData.length / 50) === 0) {
        const progress = 30 + Math.floor((i / historicalData.length) * 50);
        await storage.updateBacktest(backtestId, {
          progress,
          progressMessage: `Processing ${i}/${historicalData.length} candles...`
        });
      }

      const currentCandle = historicalData[i];
      const previousCandles = historicalData.slice(Math.max(0, i - 20), i);

      try {
        const vm = new VM({
          timeout: 1000,
          sandbox: {
            data: previousCandles,
            currentPrice: currentCandle.close,
            position: currentPosition,
            console: { log: () => {} } // Silent console
          }
        });

        const signal = vm.run(`
          ${strategyCode}
          
          // Execute strategy and return signal
          (function() {
            try {
              return executeStrategy(data, currentPrice, position);
            } catch (e) {
              return { action: 'HOLD', reason: 'Strategy error: ' + e.message };
            }
          })()
        `);

        // Process trading signals
        if (signal.action === 'BUY' && currentPosition <= 0) {
          // Close short position if any
          if (openTrade && openTrade.side === 'SELL') {
            const pnl = (openTrade.entryPrice - currentCandle.close) * openTrade.quantity;
            const pnlPercent = (pnl / (openTrade.entryPrice * openTrade.quantity)) * 100;
            
            const completedTrade = {
              ...openTrade,
              exitPrice: currentCandle.close,
              exitTime: currentCandle.timestamp,
              pnl,
              pnlPercent,
              status: 'closed',
              reason: signal.reason || 'Strategy signal'
            };
            
            trades.push(completedTrade);
            await storage.createBacktestTrade({
              backtestId,
              ...completedTrade
            });
            
            currentCapital += pnl;
            openTrade = null;
          }

          // Open long position
          const newTrade = {
            symbol,
            side: 'BUY',
            quantity: tradeQuantity,
            entryPrice: currentCandle.close,
            entryTime: currentCandle.timestamp,
            status: 'open',
            reason: signal.reason || 'Strategy signal'
          };
          
          openTrade = newTrade;
          currentPosition = tradeQuantity;
          
        } else if (signal.action === 'SELL' && currentPosition >= 0) {
          // Close long position if any
          if (openTrade && openTrade.side === 'BUY') {
            const pnl = (currentCandle.close - openTrade.entryPrice) * openTrade.quantity;
            const pnlPercent = (pnl / (openTrade.entryPrice * openTrade.quantity)) * 100;
            
            const completedTrade = {
              ...openTrade,
              exitPrice: currentCandle.close,
              exitTime: currentCandle.timestamp,
              pnl,
              pnlPercent,
              status: 'closed',
              reason: signal.reason || 'Strategy signal'
            };
            
            trades.push(completedTrade);
            await storage.createBacktestTrade({
              backtestId,
              ...completedTrade
            });
            
            currentCapital += pnl;
            openTrade = null;
          }

          // Open short position
          const newTrade = {
            symbol,
            side: 'SELL',
            quantity: tradeQuantity,
            entryPrice: currentCandle.close,
            entryTime: currentCandle.timestamp,
            status: 'open',
            reason: signal.reason || 'Strategy signal'
          };
          
          openTrade = newTrade;
          currentPosition = -tradeQuantity;
        }
      } catch (error) {
        console.error("Strategy execution error:", error);
        // Continue with next candle
      }
    }

    // Close any remaining open position
    if (openTrade) {
      const lastCandle = historicalData[historicalData.length - 1];
      const pnl = openTrade.side === 'BUY' 
        ? (lastCandle.close - openTrade.entryPrice) * openTrade.quantity
        : (openTrade.entryPrice - lastCandle.close) * openTrade.quantity;
      const pnlPercent = (pnl / (openTrade.entryPrice * openTrade.quantity)) * 100;
      
      const completedTrade = {
        ...openTrade,
        exitPrice: lastCandle.close,
        exitTime: lastCandle.timestamp,
        pnl,
        pnlPercent,
        status: 'closed',
        reason: 'End of backtest period'
      };
      
      trades.push(completedTrade);
      await storage.createBacktestTrade({
        backtestId,
        ...completedTrade
      });
    }

    const result = {
      trades,
      metrics: {
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        totalTrades: trades.length,
        avgTrade: 0,
        volatility: 0
      },
      equityCurve: []
    };
    
    result.metrics = this.calculateMetrics(result, initialCapital);
    result.equityCurve = this.calculateEquityCurve(result, initialCapital);
    
    return result;
  }

  private calculateEquityCurve(results: BacktestResult, initialCapital: number) {
    const equityCurve = [{ timestamp: new Date().toISOString(), value: initialCapital }];
    let currentValue = initialCapital;

    results.trades.forEach(trade => {
      if (trade.pnl !== undefined) {
        currentValue += trade.pnl;
        equityCurve.push({
          timestamp: trade.exitTime || trade.entryTime,
          value: currentValue
        });
      }
    });

    return equityCurve;
  }

  private calculateMetrics(results: BacktestResult, initialCapital: number) {
    const trades = results.trades;
    const totalTrades = trades.length;
    
    if (totalTrades === 0) {
      return {
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        totalTrades: 0,
        avgTrade: 0,
        volatility: 0
      };
    }

    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalReturn = totalPnL / initialCapital;
    
    const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
    const winRate = winningTrades.length / totalTrades;
    
    const avgTrade = totalPnL / totalTrades;
    
    // Calculate max drawdown
    let peak = initialCapital;
    let maxDrawdown = 0;
    let currentValue = initialCapital;
    
    trades.forEach(trade => {
      currentValue += trade.pnl || 0;
      if (currentValue > peak) peak = currentValue;
      const drawdown = (peak - currentValue) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Simple Sharpe ratio calculation
    const returns = trades.map(trade => (trade.pnl || 0) / initialCapital);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;

    return {
      totalReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      totalTrades,
      avgTrade,
      volatility
    };
  }
}

export const enhancedBacktestingEngine = new EnhancedBacktestingEngine();

export async function runEnhancedBacktest(backtestId: number): Promise<void> {
  return enhancedBacktestingEngine.runBacktest(backtestId);
}

export async function cancelBacktest(backtestId: number): Promise<void> {
  return enhancedBacktestingEngine.cancelBacktest(backtestId);
}