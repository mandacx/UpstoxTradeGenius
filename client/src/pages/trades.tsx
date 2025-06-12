import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchIcon, FilterIcon, DownloadIcon } from "lucide-react";
import { useState } from "react";

export default function Trades() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: trades, isLoading } = useQuery({
    queryKey: ["/api/trades"],
  });

  const { data: tradeHistory } = useQuery({
    queryKey: ["/api/trades/history"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-trading-card rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const allTrades = trades || [];
  const filteredTrades = allTrades.filter((trade: any) => {
    const matchesSearch = trade.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || trade.side.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  const totalTrades = allTrades.length;
  const totalVolume = allTrades.reduce((sum: number, trade: any) => 
    sum + (trade.quantity * parseFloat(trade.price)), 0
  );
  const totalPnL = allTrades.reduce((sum: number, trade: any) => 
    sum + parseFloat(trade.pnl || "0"), 0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trade History</h1>
          <p className="text-gray-400">View and analyze your trading activity</p>
        </div>
        <Button className="bg-trading-blue hover:bg-blue-600 text-white">
          <DownloadIcon className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div>
              <p className="text-gray-400 text-sm">Total Trades</p>
              <p className="text-2xl font-bold mt-1">{totalTrades}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div>
              <p className="text-gray-400 text-sm">Total Volume</p>
              <p className="text-2xl font-bold mt-1">₹{totalVolume.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div>
              <p className="text-gray-400 text-sm">Total P&L</p>
              <p className={`text-2xl font-bold mt-1 ${
                totalPnL >= 0 ? 'text-profit-green' : 'text-loss-red'
              }`}>
                {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-trading-card border-trading-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                  <FilterIcon className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  <SelectItem value="buy">Buy Orders</SelectItem>
                  <SelectItem value="sell">Sell Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card className="bg-trading-card border-trading-border">
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {search || filter !== "all" ? "No trades match your filter criteria." : "No trades found. Start trading to see your trade history here."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Side</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Value</th>
                    <th className="pb-3">P&L</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Strategy</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredTrades.map((trade: any) => {
                    const pnl = parseFloat(trade.pnl || "0");
                    const value = trade.quantity * parseFloat(trade.price);
                    
                    return (
                      <tr key={trade.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="py-4">
                          <div>
                            <p className="font-medium">
                              {new Date(trade.executedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(trade.executedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-trading-blue/10 rounded-lg flex items-center justify-center">
                              <span className="text-trading-blue text-xs font-bold">
                                {trade.symbol.substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{trade.symbol}</p>
                              <p className="text-xs text-gray-400">{trade.exchange}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant={trade.side === "BUY" ? "default" : "destructive"}>
                            {trade.side}
                          </Badge>
                        </td>
                        <td className="py-4">{trade.quantity}</td>
                        <td className="py-4">₹{parseFloat(trade.price).toFixed(2)}</td>
                        <td className="py-4">₹{value.toFixed(2)}</td>
                        <td className="py-4">
                          {pnl !== 0 && (
                            <span className={`font-medium ${
                              pnl >= 0 ? 'text-profit-green' : 'text-loss-red'
                            }`}>
                              {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <Badge variant={trade.status === "COMPLETE" ? "default" : "secondary"}>
                            {trade.status}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <span className="text-xs text-gray-400">
                            {trade.strategyId ? `Strategy ${trade.strategyId}` : "Manual"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
