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

  private calculateRSI(prices: number[], period: number = 14): number[] {
    if (prices.length < period + 1) {
      return [];
    }
    
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate initial gains and losses
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const rsiValues: number[] = [];
    
    // Calculate first RSI value using simple moving average
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
    
    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
    
    // Calculate subsequent RSI values using exponential moving average
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      if (avgLoss === 0) {
        rsiValues.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsiValues.push(100 - (100 / (1 + rs)));
      }
    }
    
    return rsiValues;
  }

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
    const userId = 1;
    const accessToken = await getValidUpstoxToken(userId, storage);
    
    if (!accessToken) {
      throw new Error("Upstox access token not available. Please link your Upstox account to fetch historical data.");
    }

    try {
      console.log(`Fetching historical data for ${symbol} from Upstox API`);
      
      // Convert symbol to Upstox format
      const upstoxSymbol = this.convertSymbolToUpstox(symbol);
      
      // Convert timeframe to Upstox format
      const upstoxTimeframe = this.convertTimeframeToUpstox(timeframe);
      console.log(`Converting timeframe: ${timeframe} -> ${upstoxTimeframe}`);
      
      // Format dates for Upstox API (YYYY-MM-DD)
      const fromDate = startDate.toISOString().split('T')[0];
      const toDate = endDate.toISOString().split('T')[0];
      
      const data = await upstoxService.getHistoricalData(
        upstoxSymbol,
        fromDate,
        toDate,
        accessToken,
        upstoxTimeframe
      );
      
      if (!data || data.length === 0) {
        throw new Error(`No historical data available for ${symbol} from ${fromDate} to ${toDate}`);
      }

      console.log(`Retrieved ${data.length} candles for ${symbol}`);
      return this.formatUpstoxData(data);
      
    } catch (error) {
      console.error(`Failed to fetch Upstox data for ${symbol}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Cannot fetch historical data from Upstox: ${errorMessage}`);
    }
  }

  private convertSymbolToUpstox(symbol: string): string {
    // Map common symbols to Upstox instrument keys
    const symbolMapping: { [key: string]: string } = {
      'NIFTY': 'NSE_INDEX|Nifty 50',
      'BANKNIFTY': 'NSE_INDEX|Nifty Bank',
      'RELIANCE': 'NSE_EQ|INE002A01018',
      'TCS': 'NSE_EQ|INE467B01029',
      'HDFCBANK': 'NSE_EQ|INE040A01034',
      'INFY': 'NSE_EQ|INE009A01021',
      'ICICIBANK': 'NSE_EQ|INE090A01021',
      'HINDUNILVR': 'NSE_EQ|INE030A01027',
      'ITC': 'NSE_EQ|INE154A01025',
      'KOTAKBANK': 'NSE_EQ|INE237A01028'
    };
    
    return symbolMapping[symbol] || `NSE_EQ|${symbol}`;
  }

  private convertTimeframeToUpstox(timeframe: string): string {
    const mapping: { [key: string]: string } = {
      '1minute': '1minute',
      '5minute': '1minute', // Upstox doesn't support 5minute, use 1minute
      '15minute': '30minute', // Upstox doesn't support 15minute, use 30minute
      '30minute': '30minute',
      '1hour': '30minute', // Upstox doesn't support 1hour, use 30minute
      '1day': 'day'
    };
    return mapping[timeframe] || 'day';
  }

  private formatUpstoxData(data: any[]): any[] {
    return data.map(candle => ({
      timestamp: new Date(candle.timestamp).toISOString(),
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume || 0)
    }));
  }

  private generateRealisticMockData(symbol: string, timeframe: string, startDate: Date, endDate: Date): any[] {
    const data = [];
    const currentDate = new Date(startDate);
    const basePrice = symbol.includes('NIFTY') ? 18000 : 100;
    let currentPrice = basePrice;

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

      // Scale volatility based on timeframe
      const volatilityScale = minutes < 60 ? 0.003 : 0.01; // Lower volatility for shorter timeframes
      const maxChange = volatilityScale * Math.sqrt(minutes / 60); // Adjusted for timeframe
      const change = (Math.random() - 0.5) * maxChange * 2;
      
      const open = currentPrice;
      let close = open * (1 + change);
      
      // Mean reversion to prevent unrealistic drift
      const driftFromBase = (currentPrice - basePrice) / basePrice;
      if (Math.abs(driftFromBase) > 0.3) { // If price drifted more than 30% from base
        const reversion = -driftFromBase * 0.1; // 10% reversion towards base
        close = open * (1 + change + reversion);
      }
      
      // Ensure price stays within reasonable bounds
      const minPrice = basePrice * 0.5; // 50% of base price
      const maxPrice = basePrice * 2.0; // 200% of base price
      close = Math.max(minPrice, Math.min(maxPrice, close));
      
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);
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
        // Calculate RSI for the current data window
        const prices = previousCandles.map(candle => candle.close);
        const rsiValues = this.calculateRSI(prices, 14);
        const currentRSI = rsiValues[rsiValues.length - 1];

        const vm = new VM({
          timeout: 1000,
          sandbox: {
            data: { [symbol]: previousCandles },
            currentPrice: currentCandle.close,
            position: currentPosition,
            portfolio: {
              cash: currentCapital,
              positions: { [symbol]: currentPosition }
            },
            parameters: {
              rsiPeriod: 14,
              maxPositionSize: 0.1
            },
            rsi: (prices: number[], period: number) => this.calculateRSI(prices, period),
            buy: (symbol: string, quantity: number, price: number, timestamp: string) => {
              return { action: 'BUY', quantity, price, timestamp, reason: `RSI Buy Signal (RSI: ${currentRSI?.toFixed(2)})` };
            },
            sell: (symbol: string, quantity: number, price: number, timestamp: string) => {
              return { action: 'SELL', quantity, price, timestamp, reason: `RSI Sell Signal (RSI: ${currentRSI?.toFixed(2)})` };
            },
            console: { log: () => {} }
          }
        });

        const signal = vm.run(`
          // Simplified RSI strategy execution
          (function() {
            try {
              const prices = data['${symbol}'].map(point => point.close);
              const rsiValues = rsi(prices, 14);
              const currentRsi = rsiValues[rsiValues.length - 1];
              
              if (!currentRsi || isNaN(currentRsi)) {
                return { action: 'HOLD', reason: 'Invalid RSI calculation' };
              }
              
              const currentPosition = portfolio.positions['${symbol}'] || 0;
              const cash = portfolio.cash;
              const currentPrice = prices[prices.length - 1];
              
              // Buy signal: RSI between 30-50 and no position
              if (currentRsi > 30 && currentRsi <= 50 && currentPosition === 0) {
                const quantity = Math.floor((cash * 0.1) / currentPrice);
                if (quantity > 0) {
                  return buy('${symbol}', quantity, currentPrice, new Date().toISOString());
                }
              }
              
              // Sell signal: RSI >= 70 and has position
              if (currentRsi >= 70 && currentPosition > 0) {
                return sell('${symbol}', currentPosition, currentPrice, new Date().toISOString());
              }
              
              return { action: 'HOLD', reason: \`RSI: \${currentRsi.toFixed(2)} - No signal\` };
            } catch (e) {
              return { action: 'HOLD', reason: 'Strategy error: ' + e.message };
            }
          })()
        `);

        // Price validation helper
        const isValidPrice = (entryPrice: number, exitPrice: number) => {
          const priceChange = Math.abs((exitPrice - entryPrice) / entryPrice);
          return priceChange <= 0.5; // Max 50% price change per trade
        };

        // Process trading signals
        if (signal.action === 'BUY' && currentPosition <= 0) {
          // Close short position if any
          if (openTrade && openTrade.side === 'SELL') {
            // Validate exit price is reasonable
            if (!isValidPrice(openTrade.entryPrice, currentCandle.close)) {
              console.warn(`Skipping unrealistic trade: entry ${openTrade.entryPrice}, exit ${currentCandle.close}`);
              continue;
            }
            
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
              symbol: completedTrade.symbol,
              side: completedTrade.side,
              quantity: completedTrade.quantity,
              entryPrice: completedTrade.entryPrice.toString(),
              exitPrice: completedTrade.exitPrice.toString(),
              entryTime: new Date(completedTrade.entryTime),
              exitTime: new Date(completedTrade.exitTime),
              pnl: completedTrade.pnl.toString(),
              pnlPercent: completedTrade.pnlPercent.toString(),
              status: completedTrade.status,
              reason: completedTrade.reason
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
            // Validate exit price is reasonable
            if (!isValidPrice(openTrade.entryPrice, currentCandle.close)) {
              console.warn(`Skipping unrealistic trade: entry ${openTrade.entryPrice}, exit ${currentCandle.close}`);
              continue;
            }
            
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
              symbol: completedTrade.symbol,
              side: completedTrade.side,
              quantity: completedTrade.quantity,
              entryPrice: completedTrade.entryPrice.toString(),
              exitPrice: completedTrade.exitPrice.toString(),
              entryTime: new Date(completedTrade.entryTime),
              exitTime: new Date(completedTrade.exitTime),
              pnl: completedTrade.pnl.toString(),
              pnlPercent: completedTrade.pnlPercent.toString(),
              status: completedTrade.status,
              reason: completedTrade.reason
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
      
      // Price validation helper
      const isValidPrice = (entryPrice: number, exitPrice: number) => {
        const priceChange = Math.abs((exitPrice - entryPrice) / entryPrice);
        return priceChange <= 0.5; // Max 50% price change per trade
      };
      
      // Validate exit price is reasonable for end-of-backtest closing
      if (isValidPrice(openTrade.entryPrice, lastCandle.close)) {
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
          symbol: completedTrade.symbol,
          side: completedTrade.side,
          quantity: completedTrade.quantity,
          entryPrice: completedTrade.entryPrice.toString(),
          exitPrice: completedTrade.exitPrice.toString(),
          entryTime: new Date(completedTrade.entryTime),
          exitTime: new Date(completedTrade.exitTime),
          pnl: completedTrade.pnl.toString(),
          pnlPercent: completedTrade.pnlPercent.toString(),
          status: completedTrade.status,
          reason: completedTrade.reason
        });
      } else {
        console.warn(`Skipping unrealistic end-of-backtest trade: entry ${openTrade.entryPrice}, exit ${lastCandle.close}`);
      }
    }

    const result: BacktestResult = {
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