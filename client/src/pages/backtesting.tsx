import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { PlayIcon, ChartBarIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";

export default function Backtesting() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: backtests, isLoading } = useQuery({
    queryKey: ["/api/backtests"],
  });

  const { data: strategies } = useQuery({
    queryKey: ["/api/strategies"],
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

  const handleCreateBacktest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      strategyId: parseInt(formData.get("strategyId") as string),
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
      initialCapital: parseFloat(formData.get("initialCapital") as string),
    };
    createBacktestMutation.mutate(data);
  };

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

  const completedBacktests = backtests?.filter((b: any) => b.status === "completed") || [];
  const runningBacktests = backtests?.filter((b: any) => b.status === "running") || [];
  const avgReturn = completedBacktests.length > 0 
    ? completedBacktests.reduce((sum: number, b: any) => sum + parseFloat(b.totalReturn || "0"), 0) / completedBacktests.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backtesting Engine</h1>
          <p className="text-gray-400">Test your strategies against historical data</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-trading-blue hover:bg-blue-600 text-white">
              <PlayIcon className="w-4 h-4 mr-2" />
              New Backtest
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-trading-card border-trading-border">
            <DialogHeader>
              <DialogTitle>Create New Backtest</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateBacktest} className="space-y-4">
              <div>
                <Label htmlFor="name">Backtest Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Strategy Backtest"
                  required
                  className="bg-gray-700 border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="strategyId">Select Strategy</Label>
                <Select name="strategyId" required>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Choose a strategy..." />
                  </SelectTrigger>
                  <SelectContent>
                    {strategies?.map((strategy: any) => (
                      <SelectItem key={strategy.id} value={strategy.id.toString()}>
                        {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue="2024-01-01"
                    required
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue="2024-12-31"
                    required
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="initialCapital">Initial Capital (₹)</Label>
                <Input
                  id="initialCapital"
                  name="initialCapital"
                  type="number"
                  defaultValue="100000"
                  min="1000"
                  step="1000"
                  required
                  className="bg-gray-700 border-gray-600"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createBacktestMutation.isPending}
                  className="bg-trading-blue hover:bg-blue-600 text-white"
                >
                  {createBacktestMutation.isPending ? "Starting..." : "Start Backtest"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div>
              <p className="text-gray-400 text-sm">Total Backtests</p>
              <p className="text-2xl font-bold mt-1">{backtests?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div>
              <p className="text-gray-400 text-sm">Running</p>
              <p className="text-2xl font-bold mt-1 text-yellow-500">{runningBacktests.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div>
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold mt-1 text-profit-green">{completedBacktests.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div>
              <p className="text-gray-400 text-sm">Avg Return</p>
              <p className={`text-2xl font-bold mt-1 ${
                avgReturn >= 0 ? 'text-profit-green' : 'text-loss-red'
              }`}>
                {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backtests List */}
      <div className="grid grid-cols-1 gap-4">
        {!backtests || backtests.length === 0 ? (
          <Card className="bg-trading-card border-trading-border">
            <CardContent className="p-8 text-center">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Backtests Yet</h3>
              <p className="text-gray-400 mb-4">
                Create your first backtest to evaluate strategy performance.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-trading-blue hover:bg-blue-600 text-white"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Start Backtest
              </Button>
            </CardContent>
          </Card>
        ) : (
          backtests.map((backtest: any) => {
            const totalReturn = parseFloat(backtest.totalReturn || "0");
            const sharpeRatio = parseFloat(backtest.sharpeRatio || "0");
            const maxDrawdown = parseFloat(backtest.maxDrawdown || "0");
            const winRate = parseFloat(backtest.winRate || "0");

            return (
              <Card key={backtest.id} className="bg-trading-card border-trading-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{backtest.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(backtest.startDate).toLocaleDateString()} - {new Date(backtest.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      backtest.status === "completed" ? "default" :
                      backtest.status === "running" ? "secondary" : "destructive"
                    }>
                      {backtest.status}
                    </Badge>
                  </div>

                  {backtest.status === "completed" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Total Return</p>
                        <p className={`text-xl font-bold mt-1 ${
                          totalReturn >= 0 ? 'text-profit-green' : 'text-loss-red'
                        }`}>
                          {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Sharpe Ratio</p>
                        <p className="text-xl font-bold mt-1">{sharpeRatio.toFixed(2)}</p>
                      </div>
                      
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Max Drawdown</p>
                        <p className="text-xl font-bold text-loss-red mt-1">-{maxDrawdown.toFixed(1)}%</p>
                      </div>
                      
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Win Rate</p>
                        <p className="text-xl font-bold mt-1">{winRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  )}

                  {backtest.status === "running" && (
                    <div className="p-4 bg-yellow-500/10 rounded-lg">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent mr-2"></div>
                        <span className="text-yellow-500">Backtest in progress...</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      Capital: ₹{parseFloat(backtest.initialCapital).toLocaleString()}
                      {backtest.totalTrades && (
                        <span className="ml-4">Trades: {backtest.totalTrades}</span>
                      )}
                    </div>
                    {backtest.status === "completed" && (
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
