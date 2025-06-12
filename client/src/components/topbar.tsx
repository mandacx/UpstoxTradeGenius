import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BellIcon, UserIcon } from "lucide-react";
import { wsManager } from "@/lib/websocket";

export default function Topbar() {
  const [marketStatus, setMarketStatus] = useState<"open" | "closed" | "pre-open">("open");
  const [marketTime, setMarketTime] = useState<string>("");
  const [notifications, setNotifications] = useState(2);

  useEffect(() => {
    // Update time every second
    const updateTime = () => {
      const now = new Date();
      setMarketTime(now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Kolkata"
      }));
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Subscribe to market status updates
    wsManager.subscribeToMarketStatus((data) => {
      setMarketStatus(data.status);
    });

    return () => {
      clearInterval(timeInterval);
      wsManager.offMessage('market_status');
    };
  }, []);

  const getMarketStatusColor = () => {
    switch (marketStatus) {
      case "open":
        return "text-profit-green";
      case "closed":
        return "text-loss-red";
      case "pre-open":
        return "text-yellow-500";
      default:
        return "text-gray-400";
    }
  };

  const getMarketStatusText = () => {
    switch (marketStatus) {
      case "open":
        return "Market Open";
      case "closed":
        return "Market Closed";
      case "pre-open":
        return "Pre-Market";
      default:
        return "Market Status";
    }
  };

  return (
    <header className="bg-trading-card border-b border-trading-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-semibold">Trading Dashboard</h2>
          <div className="flex items-center space-x-4 text-sm">
            {/* Market Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                marketStatus === "open" ? "bg-profit-green" :
                marketStatus === "pre-open" ? "bg-yellow-500" : "bg-loss-red"
              }`}></div>
              <span className={getMarketStatusColor()}>{getMarketStatusText()}</span>
            </div>
            <div className="text-gray-400">
              NSE: <span className="text-white">{marketTime}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <BellIcon className="w-5 h-5" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-loss-red border-0 flex items-center justify-center p-0">
                {notifications}
              </Badge>
            )}
          </Button>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium">Trader John</p>
              <p className="text-xs text-gray-400">ID: UP123456</p>
            </div>
            <div className="w-8 h-8 bg-trading-blue rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
