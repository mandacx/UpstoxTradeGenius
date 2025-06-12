import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { wsManager } from "@/lib/websocket";
import { useEffect, useState } from "react";
import { Position } from "@/types/trading";

export default function PositionsTable() {
  const [positions, setPositions] = useState<Position[]>([]);

  const { data: initialPositions, isLoading } = useQuery({
    queryKey: ["/api/positions/open"],
  });

  useEffect(() => {
    if (initialPositions) {
      setPositions(initialPositions);
    }
  }, [initialPositions]);

  useEffect(() => {
    // Subscribe to real-time position updates
    wsManager.subscribeToPortfolio((data) => {
      if (data.positions) {
        setPositions(data.positions);
      }
    });

    return () => {
      wsManager.offMessage('portfolio');
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse h-16 bg-gray-800/50 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No open positions found. Start trading to see your positions here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
            <th className="pb-3">Symbol</th>
            <th className="pb-3">Qty</th>
            <th className="pb-3">Avg Price</th>
            <th className="pb-3">LTP</th>
            <th className="pb-3">P&L</th>
            <th className="pb-3">Day Change</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {positions.map((position) => {
            const pnl = parseFloat(position.pnl || "0");
            const dayChange = parseFloat(position.dayChange || "0");
            const currentPrice = position.currentPrice ? parseFloat(position.currentPrice) : parseFloat(position.avgPrice);
            
            return (
              <tr key={position.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
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
                <td className="py-4 font-medium">{position.quantity}</td>
                <td className="py-4">₹{parseFloat(position.avgPrice).toFixed(2)}</td>
                <td className="py-4">₹{currentPrice.toFixed(2)}</td>
                <td className="py-4">
                  <span className={`font-medium ${
                    pnl >= 0 ? 'text-profit-green' : 'text-loss-red'
                  }`}>
                    {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toFixed(2)}
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
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs px-3 py-1 h-7"
                    >
                      Sell
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs px-3 py-1 h-7 border-gray-600 hover:bg-gray-700"
                    >
                      Modify
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
