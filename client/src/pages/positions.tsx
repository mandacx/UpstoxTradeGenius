import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";

export default function Positions() {
  const { data: positions, isLoading } = useQuery({
    queryKey: ["/api/positions"],
  });

  const { data: openPositions } = useQuery({
    queryKey: ["/api/positions/open"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-trading-card rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalPnL = positions?.reduce((sum: number, pos: any) => 
    sum + (parseFloat(pos.pnl || "0")), 0
  ) || 0;

  const totalPositions = positions?.length || 0;
  const profitablePositions = positions?.filter((pos: any) => 
    parseFloat(pos.pnl || "0") > 0
  ).length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Positions</h1>
          <p className="text-gray-400">Manage your trading positions</p>
        </div>
        <Button className="bg-trading-blue hover:bg-blue-600 text-white">
          New Position
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Positions</p>
                <p className="text-2xl font-bold mt-1">{totalPositions}</p>
              </div>
              <TrendingUpIcon className="w-8 h-8 text-trading-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Profitable</p>
                <p className="text-2xl font-bold mt-1 text-profit-green">{profitablePositions}</p>
              </div>
              <TrendingUpIcon className="w-8 h-8 text-profit-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total P&L</p>
                <p className={`text-2xl font-bold mt-1 ${
                  totalPnL >= 0 ? 'text-profit-green' : 'text-loss-red'
                }`}>
                  {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString()}
                </p>
              </div>
              {totalPnL >= 0 ? (
                <TrendingUpIcon className="w-8 h-8 text-profit-green" />
              ) : (
                <TrendingDownIcon className="w-8 h-8 text-loss-red" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card className="bg-trading-card border-trading-border">
        <CardHeader>
          <CardTitle>All Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {!positions || positions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No positions found. Start trading to see your positions here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Avg Price</th>
                    <th className="pb-3">Current Price</th>
                    <th className="pb-3">P&L</th>
                    <th className="pb-3">Day Change</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {positions.map((position: any) => {
                    const pnl = parseFloat(position.pnl || "0");
                    const dayChange = parseFloat(position.dayChange || "0");
                    
                    return (
                      <tr key={position.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-trading-blue/10 rounded-lg flex items-center justify-center">
                              <span className="text-trading-blue text-xs font-bold">
                                {position.symbol.substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{position.symbol}</p>
                              <p className="text-xs text-gray-400">{position.exchange}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">{position.quantity}</td>
                        <td className="py-4">₹{parseFloat(position.avgPrice).toFixed(2)}</td>
                        <td className="py-4">
                          ₹{position.currentPrice ? parseFloat(position.currentPrice).toFixed(2) : parseFloat(position.avgPrice).toFixed(2)}
                        </td>
                        <td className="py-4">
                          <span className={`font-medium ${
                            pnl >= 0 ? 'text-profit-green' : 'text-loss-red'
                          }`}>
                            {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center">
                            {dayChange >= 0 ? (
                              <ArrowUpIcon className="w-3 h-3 text-profit-green mr-1" />
                            ) : (
                              <ArrowDownIcon className="w-3 h-3 text-loss-red mr-1" />
                            )}
                            <span className={dayChange >= 0 ? 'text-profit-green' : 'text-loss-red'}>
                              {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant={position.isOpen ? "default" : "secondary"}>
                            {position.isOpen ? "Open" : "Closed"}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="flex space-x-2">
                            {position.isOpen && (
                              <>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Sell
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                >
                                  Modify
                                </Button>
                              </>
                            )}
                          </div>
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
