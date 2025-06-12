import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PortfolioChart from "@/components/portfolio-chart";
import PositionsTable from "@/components/positions-table";
import AIStrategyBuilder from "@/components/ai-strategy-builder";
import BacktestResults from "@/components/backtest-results";
import ModuleStatus from "@/components/module-status";
import { ArrowUpIcon, ArrowDownIcon, WalletIcon, TrendingUpIcon, BriefcaseIcon, ChartLineIcon } from "lucide-react";

export default function Dashboard() {
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["/api/account"],
  });

  const { data: positions } = useQuery({
    queryKey: ["/api/positions/open"],
  });

  if (accountLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-trading-card border-trading-border">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-32 mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activePositionsCount = positions?.length || 0;
  const totalPositionsValue = positions?.reduce((sum: number, pos: any) => 
    sum + (parseFloat(pos.currentPrice || pos.avgPrice) * pos.quantity), 0
  ) || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Balance</p>
                <p className="text-2xl font-bold mt-1">
                  ₹{account?.totalBalance ? parseFloat(account.totalBalance).toLocaleString() : "0"}
                </p>
              </div>
              <div className="w-12 h-12 bg-trading-blue/10 rounded-lg flex items-center justify-center">
                <WalletIcon className="w-6 h-6 text-trading-blue" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpIcon className="w-4 h-4 text-profit-green mr-1" />
              <span className="text-profit-green">+₹3,250 (1.34%)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Available Margin</p>
                <p className="text-2xl font-bold mt-1">
                  ₹{account?.availableMargin ? parseFloat(account.availableMargin).toLocaleString() : "0"}
                </p>
              </div>
              <div className="w-12 h-12 bg-profit-green/10 rounded-lg flex items-center justify-center">
                <ChartLineIcon className="w-6 h-6 text-profit-green" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-gray-400">Used: </span>
              <span className="ml-1">₹{account?.usedMargin ? parseFloat(account.usedMargin).toLocaleString() : "0"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Today's P&L</p>
                <p className={`text-2xl font-bold mt-1 ${
                  account?.todayPnL && parseFloat(account.todayPnL) >= 0 
                    ? 'text-profit-green' 
                    : 'text-loss-red'
                }`}>
                  {account?.todayPnL && parseFloat(account.todayPnL) >= 0 ? '+' : ''}
                  ₹{account?.todayPnL ? parseFloat(account.todayPnL).toLocaleString() : "0"}
                </p>
              </div>
              <div className="w-12 h-12 bg-profit-green/10 rounded-lg flex items-center justify-center">
                <TrendingUpIcon className="w-6 h-6 text-profit-green" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-gray-400">Realized P&L: </span>
              <span className="ml-1 text-profit-green">
                +₹{account?.realizedPnL ? parseFloat(account.realizedPnL).toLocaleString() : "0"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Positions</p>
                <p className="text-2xl font-bold mt-1">{activePositionsCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-gray-400">Total Holdings: </span>
              <span className="ml-1">₹{totalPositionsValue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Chart */}
        <div className="lg:col-span-2">
          <PortfolioChart />
        </div>

        {/* AI Strategy Builder */}
        <div>
          <AIStrategyBuilder />
        </div>
      </div>

      {/* Trading Tabs */}
      <div className="bg-trading-card rounded-xl border border-trading-border">
        <div className="flex border-b border-trading-border">
          <button className="px-6 py-4 text-sm font-medium text-trading-blue border-b-2 border-trading-blue">
            Open Positions
          </button>
        </div>
        <div className="p-6">
          <PositionsTable />
        </div>
      </div>

      {/* Backtesting Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <ChartLineIcon className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold">Backtesting Engine</h3>
              </div>
              <Button className="bg-trading-blue hover:bg-blue-600 text-white">
                New Test
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Strategy Selection
                </label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-trading-blue focus:outline-none">
                  <option value="">Select a strategy...</option>
                </select>
              </div>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                Run Backtest
              </Button>
            </div>
          </CardContent>
        </Card>

        <BacktestResults />
      </div>

      {/* Module Status */}
      <ModuleStatus />
    </div>
  );
}
