import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUpIcon, 
  TrendingDownIcon,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  AlertTriangle,
  Award,
  Calendar,
  Download
} from "lucide-react";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("1M");
  const [selectedMetric, setSelectedMetric] = useState("returns");

  // Fetch analytics data
  const { data: portfolioData } = useQuery({
    queryKey: ["/api/analytics/portfolio", timeRange],
  });

  const { data: performanceData } = useQuery({
    queryKey: ["/api/analytics/performance", timeRange],
  });

  const { data: strategyData } = useQuery({
    queryKey: ["/api/analytics/strategies"],
  });

  const { data: riskMetrics } = useQuery({
    queryKey: ["/api/analytics/risk"],
  });

  // Sample data for demonstration
  const portfolioEquityCurve = [
    { date: "2024-01", value: 100000, benchmark: 100000 },
    { date: "2024-02", value: 105200, benchmark: 102100 },
    { date: "2024-03", value: 108900, benchmark: 103800 },
    { date: "2024-04", value: 112400, benchmark: 101200 },
    { date: "2024-05", value: 118700, benchmark: 105600 },
    { date: "2024-06", value: 125300, benchmark: 108900 },
    { date: "2024-07", value: 131800, benchmark: 112300 },
    { date: "2024-08", value: 128600, benchmark: 115600 },
    { date: "2024-09", value: 135400, benchmark: 118900 },
    { date: "2024-10", value: 142100, benchmark: 121200 },
    { date: "2024-11", value: 148900, benchmark: 124500 },
    { date: "2024-12", value: 156200, benchmark: 127800 }
  ];

  const monthlyReturns = [
    { month: "Jan", returns: 5.2, benchmark: 2.1, volatility: 12.3 },
    { month: "Feb", returns: 3.5, benchmark: 1.7, volatility: 11.8 },
    { month: "Mar", returns: 3.2, benchmark: -2.6, volatility: 15.2 },
    { month: "Apr", returns: 3.1, benchmark: 4.4, volatility: 9.7 },
    { month: "May", returns: 5.6, benchmark: 2.3, volatility: 13.4 },
    { month: "Jun", returns: 5.6, benchmark: 3.1, volatility: 10.9 },
    { month: "Jul", returns: 5.2, benchmark: 3.1, volatility: 12.1 },
    { month: "Aug", returns: -2.4, benchmark: 2.9, volatility: 16.8 },
    { month: "Sep", returns: 5.3, benchmark: 2.9, volatility: 11.2 },
    { month: "Oct", returns: 4.9, benchmark: 1.9, volatility: 9.8 },
    { month: "Nov", returns: 4.8, benchmark: 2.7, volatility: 10.4 },
    { month: "Dec", returns: 4.9, benchmark: 2.6, volatility: 11.6 }
  ];

  const strategyPerformance = [
    { name: "RSI Mean Reversion", returns: 24.8, sharpe: 1.89, maxDrawdown: -8.2, trades: 156, winRate: 68.2 },
    { name: "Momentum Breakout", returns: 18.4, sharpe: 1.45, maxDrawdown: -12.1, trades: 89, winRate: 61.8 },
    { name: "Pairs Trading", returns: 12.6, sharpe: 1.23, maxDrawdown: -5.8, trades: 234, winRate: 58.4 },
    { name: "Options Strategies", returns: 16.2, sharpe: 1.67, maxDrawdown: -7.4, trades: 67, winRate: 72.1 }
  ];

  const sectorAllocation = [
    { name: "Technology", value: 35, color: "#8884d8" },
    { name: "Financial", value: 25, color: "#82ca9d" },
    { name: "Healthcare", value: 20, color: "#ffc658" },
    { name: "Consumer", value: 15, color: "#ff7300" },
    { name: "Others", value: 5, color: "#00ff88" }
  ];

  const riskAnalysis = {
    var: -8.4,
    cvar: -12.8,
    sharpeRatio: 1.67,
    sortinoRatio: 2.34,
    maxDrawdown: -12.1,
    beta: 0.89,
    alpha: 4.2,
    correlationToMarket: 0.72
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 0 
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Comprehensive portfolio and strategy analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1W">1 Week</SelectItem>
              <SelectItem value="1M">1 Month</SelectItem>
              <SelectItem value="3M">3 Months</SelectItem>
              <SelectItem value="6M">6 Months</SelectItem>
              <SelectItem value="1Y">1 Year</SelectItem>
              <SelectItem value="ALL">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-trading-card border-trading-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">+56.2%</div>
            <p className="text-xs text-muted-foreground">
              vs benchmark +27.8%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <Award className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.67</div>
            <p className="text-xs text-muted-foreground">
              Excellent risk-adjusted returns
            </p>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <TrendingDownIcon className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">-12.1%</div>
            <p className="text-xs text-muted-foreground">
              Within acceptable limits
            </p>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">65.4%</div>
            <p className="text-xs text-muted-foreground">
              Above average performance
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Portfolio Value Chart */}
          <Card className="bg-trading-card border-trading-border">
            <CardHeader>
              <CardTitle>Portfolio Value vs Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={portfolioEquityCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                    name="Portfolio"
                  />
                  <Area
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#6B7280"
                    fill="#6B7280"
                    fillOpacity={0.1}
                    name="Benchmark"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Returns */}
          <Card className="bg-trading-card border-trading-border">
            <CardHeader>
              <CardTitle>Monthly Returns Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="returns" fill="#10B981" name="Portfolio Returns" />
                  <Bar dataKey="benchmark" fill="#6B7280" name="Benchmark Returns" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-trading-card border-trading-border">
              <CardHeader>
                <CardTitle>Risk-Adjusted Returns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Sharpe Ratio</span>
                  <span className="font-semibold text-green-400">1.67</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Sortino Ratio</span>
                  <span className="font-semibold text-green-400">2.34</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Calmar Ratio</span>
                  <span className="font-semibold text-green-400">4.64</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Information Ratio</span>
                  <span className="font-semibold text-green-400">1.23</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-trading-card border-trading-border">
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Volatility (Annual)</span>
                  <span className="font-semibold">18.4%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">VaR (95%)</span>
                  <span className="font-semibold text-red-400">-8.4%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Max Drawdown</span>
                  <span className="font-semibold text-red-400">-12.1%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Beta</span>
                  <span className="font-semibold">0.89</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rolling Returns */}
          <Card className="bg-trading-card border-trading-border">
            <CardHeader>
              <CardTitle>Rolling Returns (12M)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="returns"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Portfolio"
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#6B7280"
                    strokeWidth={2}
                    name="Benchmark"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          {/* Strategy Performance Table */}
          <Card className="bg-trading-card border-trading-border">
            <CardHeader>
              <CardTitle>Strategy Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Strategy</th>
                      <th className="text-right py-3 px-4">Returns</th>
                      <th className="text-right py-3 px-4">Sharpe</th>
                      <th className="text-right py-3 px-4">Max DD</th>
                      <th className="text-right py-3 px-4">Trades</th>
                      <th className="text-right py-3 px-4">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategyPerformance.map((strategy, index) => (
                      <tr key={index} className="border-b border-gray-800">
                        <td className="py-3 px-4 font-medium">{strategy.name}</td>
                        <td className={`text-right py-3 px-4 font-semibold ${
                          strategy.returns > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(strategy.returns)}
                        </td>
                        <td className="text-right py-3 px-4">{strategy.sharpe.toFixed(2)}</td>
                        <td className="text-right py-3 px-4 text-red-400">
                          {formatPercent(strategy.maxDrawdown)}
                        </td>
                        <td className="text-right py-3 px-4">{strategy.trades}</td>
                        <td className="text-right py-3 px-4 text-blue-400">
                          {strategy.winRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          {/* Risk Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-trading-card border-trading-border">
              <CardHeader>
                <CardTitle>Value at Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">VaR (95% confidence)</span>
                    <span className="text-red-400 font-semibold">-8.4%</span>
                  </div>
                  <Progress value={84} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">CVaR (Expected Shortfall)</span>
                    <span className="text-red-400 font-semibold">-12.8%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div className="pt-2 text-xs text-gray-400">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Risk levels are within acceptable parameters
                </div>
              </CardContent>
            </Card>

            <Card className="bg-trading-card border-trading-border">
              <CardHeader>
                <CardTitle>Market Correlation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Beta (Market Sensitivity)</span>
                  <span className="font-semibold">0.89</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Alpha (Excess Return)</span>
                  <span className="font-semibold text-green-400">+4.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Correlation</span>
                  <span className="font-semibold">0.72</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">R-Squared</span>
                  <span className="font-semibold">0.52</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Volatility Chart */}
          <Card className="bg-trading-card border-trading-border">
            <CardHeader>
              <CardTitle>Rolling Volatility (30D)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="volatility"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="Volatility %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
          {/* Sector Allocation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-trading-card border-trading-border">
              <CardHeader>
                <CardTitle>Sector Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sectorAllocation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectorAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-trading-card border-trading-border">
              <CardHeader>
                <CardTitle>Allocation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sectorAllocation.map((sector, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: sector.color }}
                      />
                      <span className="text-gray-300">{sector.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{sector.value}%</span>
                      <div className="text-xs text-gray-400">
                        {formatCurrency(sector.value * 1562 * 10)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}