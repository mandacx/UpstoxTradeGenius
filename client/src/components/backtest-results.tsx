import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUpIcon, TrendingDownIcon, BarChart3Icon } from "lucide-react";
import { wsManager } from "@/lib/websocket";
import { useEffect, useState } from "react";

export default function BacktestResults() {
  const [latestBacktest, setLatestBacktest] = useState<any>(null);

  const { data: backtests } = useQuery({
    queryKey: ["/api/backtests"],
  });

  useEffect(() => {
    if (backtests && backtests.length > 0) {
      // Find the latest completed backtest
      const completed = backtests.filter((b: any) => b.status === "completed");
      if (completed.length > 0) {
        setLatestBacktest(completed[0]); // Most recent first
      }
    }
  }, [backtests]);

  useEffect(() => {
    // Subscribe to backtest updates
    wsManager.subscribeToBacktests((data) => {
      if (data.status === "completed") {
        setLatestBacktest(data);
      }
    });

    return () => {
      wsManager.offMessage('backtests');
    };
  }, []);

  if (!latestBacktest) {
    return (
      <Card className="bg-trading-card border-trading-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Latest Backtest Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Backtest Results</h3>
            <p className="text-gray-400 text-sm mb-4">
              Run your first backtest to see performance metrics here.
            </p>
            <Button className="bg-trading-blue hover:bg-blue-600 text-white">
              Start Backtest
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalReturn = parseFloat(latestBacktest.totalReturn || "0");
  const sharpeRatio = parseFloat(latestBacktest.sharpeRatio || "0");
  const maxDrawdown = parseFloat(latestBacktest.maxDrawdown || "0");
  const winRate = parseFloat(latestBacktest.winRate || "0");

  return (
    <Card className="bg-trading-card border-trading-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Latest Backtest Results</CardTitle>
          <Badge variant="default" className="bg-profit-green/10 text-profit-green border-profit-green/20">
            Completed
          </Badge>
        </div>
        <p className="text-sm text-gray-400">{latestBacktest.name}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total Return</p>
            <div className="flex items-center mt-1">
              {totalReturn >= 0 ? (
                <TrendingUpIcon className="w-4 h-4 text-profit-green mr-1" />
              ) : (
                <TrendingDownIcon className="w-4 h-4 text-loss-red mr-1" />
              )}
              <p className={`text-xl font-bold ${
                totalReturn >= 0 ? 'text-profit-green' : 'text-loss-red'
              }`}>
                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Sharpe Ratio</p>
            <p className="text-xl font-bold mt-1">{sharpeRatio.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Max Drawdown</p>
            <p className="text-xl font-bold text-loss-red mt-1">-{maxDrawdown.toFixed(1)}%</p>
          </div>
          
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Win Rate</p>
            <p className="text-xl font-bold mt-1">{winRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Performance Metrics</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Total Trades:</span>
              <span>{latestBacktest.totalTrades || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Initial Capital:</span>
              <span>₹{parseFloat(latestBacktest.initialCapital || "0").toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Final Value:</span>
              <span className={totalReturn >= 0 ? 'text-profit-green' : 'text-loss-red'}>
                ₹{parseFloat(latestBacktest.finalValue || latestBacktest.initialCapital || "0").toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Period:</span>
              <span>
                {new Date(latestBacktest.startDate).toLocaleDateString()} - {new Date(latestBacktest.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full bg-trading-blue hover:bg-blue-600 text-white">
          View Detailed Analysis
        </Button>
      </CardContent>
    </Card>
  );
}
