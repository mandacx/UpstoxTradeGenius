import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { PlayIcon, ChartBarIcon, TrendingUpIcon, TrendingDownIcon, StopCircleIcon, EyeIcon, CalendarIcon } from "lucide-react";

export default function Backtesting() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBacktest, setSelectedBacktest] = useState<any>(null);
  const [showTradesModal, setShowTradesModal] = useState(false);
  const { toast } = useToast();

  const { data: backtests = [], isLoading } = useQuery({
    queryKey: ["/api/backtests"],
    refetchInterval: 2000, // Refetch every 2 seconds for progress updates
  });

  const { data: strategies = [] } = useQuery({
    queryKey: ["/api/strategies"],
  });

  const { data: selectedBacktestTrades = [] } = useQuery({
    queryKey: ["/api/backtests", selectedBacktest?.id, "trades"],
    enabled: !!selectedBacktest,
  });

  const createBacktestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/backtests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backtests"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Backtest Started",
        description: "Your backtest has been started and will complete shortly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start backtest",
        variant: "destructive",
      });
    },
  });

  const cancelBacktestMutation = useMutation({
    mutationFn: async (backtestId: number) => {
      const response = await apiRequest("POST", `/api/backtests/${backtestId}/cancel`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backtests"] });
      toast({
        title: "Backtest Cancelled",
        description: "The backtest has been cancelled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel backtest",
        variant: "destructive",
      });
    },
  });

  const handleCreateBacktest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name"),
      strategyId: Number(formData.get("strategyId")),
      symbol: formData.get("symbol"),
      timeframe: formData.get("timeframe"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      initialCapital: Number(formData.get("initialCapital")),
    };
    
    createBacktestMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-600",
      running: "bg-blue-600 animate-pulse",
      completed: "bg-green-600",
      cancelled: "bg-gray-600",
      error: "bg-red-600"
    };
    return variants[status as keyof typeof variants] || "bg-gray-600";
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Number(value));
  };

  const formatPercentage = (value: string | number) => {
    return `${(Number(value) * 100).toFixed(2)}%`;
  };

  // Stock/Index options
  const symbolOptions = [
    { value: "NIFTY", label: "NIFTY 50" },
    { value: "BANKNIFTY", label: "BANK NIFTY" },
    { value: "RELIANCE", label: "Reliance Industries" },
    { value: "TCS", label: "Tata Consultancy Services" },
    { value: "HDFCBANK", label: "HDFC Bank" },
    { value: "INFY", label: "Infosys" },
    { value: "ICICIBANK", label: "ICICI Bank" },
    { value: "HINDUNILVR", label: "Hindustan Unilever" },
    { value: "ITC", label: "ITC Limited" },
    { value: "KOTAKBANK", label: "Kotak Mahindra Bank" }
  ];

  // Timeframe options
  const timeframeOptions = [
    { value: "1minute", label: "1 Minute" },
    { value: "5minute", label: "5 Minutes" },
    { value: "15minute", label: "15 Minutes" },
    { value: "1hour", label: "1 Hour" },
    { value: "1day", label: "1 Day" }
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-trading-card rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const runningBacktests = backtests.filter((bt: any) => bt.status === 'running');
  const completedBacktests = backtests.filter((bt: any) => bt.status === 'completed');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Strategy Backtesting</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlayIcon className="w-4 h-4 mr-2" />
              New Backtest
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-trading-card border-trading-border">
            <DialogHeader>
              <DialogTitle>Create New Backtest</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBacktest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Backtest Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="My Strategy Backtest"
                    required 
                    className="bg-trading-dark border-trading-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strategyId">Strategy</Label>
                  <Select name="strategyId" required>
                    <SelectTrigger className="bg-trading-dark border-trading-border">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent className="bg-trading-card border-trading-border">
                      {strategies.map((strategy: any) => (
                        <SelectItem key={strategy.id} value={strategy.id.toString()}>
                          {strategy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Stock/Index</Label>
                  <Select name="symbol" required>
                    <SelectTrigger className="bg-trading-dark border-trading-border">
                      <SelectValue placeholder="Select symbol" />
                    </SelectTrigger>
                    <SelectContent className="bg-trading-card border-trading-border">
                      {symbolOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select name="timeframe" required>
                    <SelectTrigger className="bg-trading-dark border-trading-border">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent className="bg-trading-card border-trading-border">
                      {timeframeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate" 
                    name="startDate" 
                    type="date"
                    required 
                    className="bg-trading-dark border-trading-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    id="endDate" 
                    name="endDate" 
                    type="date"
                    required 
                    className="bg-trading-dark border-trading-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialCapital">Initial Capital (₹)</Label>
                <Input 
                  id="initialCapital" 
                  name="initialCapital" 
                  type="number"
                  placeholder="100000"
                  min="1000"
                  required 
                  className="bg-trading-dark border-trading-border"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-trading-border"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createBacktestMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createBacktestMutation.isPending ? "Starting..." : "Start Backtest"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Running Backtests */}
      {runningBacktests.length > 0 && (
        <Card className="bg-trading-card border-trading-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              Running Backtests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {runningBacktests.map((backtest: any) => (
                <div key={backtest.id} className="p-4 bg-trading-dark rounded-lg border border-trading-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{backtest.name}</h3>
                      <p className="text-sm text-gray-400">
                        {backtest.symbol} • {backtest.timeframe}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelBacktestMutation.mutate(backtest.id)}
                      disabled={cancelBacktestMutation.isPending}
                      className="border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      <StopCircleIcon className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{backtest.progress || 0}%</span>
                    </div>
                    <Progress value={backtest.progress || 0} className="h-2" />
                    <p className="text-xs text-gray-400">{backtest.progressMessage || "Processing..."}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Backtests */}
      <Card className="bg-trading-card border-trading-border">
        <CardHeader>
          <CardTitle>Backtest Results</CardTitle>
        </CardHeader>
        <CardContent>
          {completedBacktests.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ChartBarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No completed backtests yet</p>
              <p className="text-sm">Start your first backtest to see results here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedBacktests.map((backtest: any) => (
                <Card key={backtest.id} className="bg-trading-dark border-trading-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold mb-1">{backtest.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{backtest.symbol} • {backtest.timeframe}</span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {new Date(backtest.startDate).toLocaleDateString()} - {new Date(backtest.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusBadge(backtest.status)} text-white`}>
                          {backtest.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBacktest(backtest);
                            setShowTradesModal(true);
                          }}
                          className="border-trading-border"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View Trades
                        </Button>
                      </div>
                    </div>
                    
                    {backtest.status === 'completed' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {formatPercentage(backtest.totalReturn || 0)}
                          </div>
                          <div className="text-xs text-gray-400">Total Return</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {(backtest.sharpeRatio || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400">Sharpe Ratio</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">
                            {formatPercentage(backtest.maxDrawdown || 0)}
                          </div>
                          <div className="text-xs text-gray-400">Max Drawdown</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {backtest.totalTrades || 0}
                          </div>
                          <div className="text-xs text-gray-400">Total Trades</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trades Modal */}
      <Dialog open={showTradesModal} onOpenChange={setShowTradesModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden bg-trading-card border-trading-border">
          <DialogHeader>
            <DialogTitle>
              Backtest Trades - {selectedBacktest?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {selectedBacktestTrades && selectedBacktestTrades.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-trading-border">
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>Exit Price</TableHead>
                    <TableHead>Entry Time</TableHead>
                    <TableHead>Exit Time</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>P&L %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedBacktestTrades.map((trade: any) => (
                    <TableRow key={trade.id} className="border-trading-border">
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge className={trade.side === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                          {trade.side}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.quantity}</TableCell>
                      <TableCell>{formatCurrency(trade.entryPrice)}</TableCell>
                      <TableCell>
                        {trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(trade.entryTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {trade.exitTime ? new Date(trade.exitTime).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          Number(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          Number(trade.pnlPercent) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.pnlPercent ? formatPercentage(trade.pnlPercent / 100) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={trade.status === 'closed' ? 'bg-gray-600' : 'bg-yellow-600'}>
                          {trade.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No trades available for this backtest</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}