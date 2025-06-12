import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BellIcon, UserIcon, LogOut, Settings, User, CheckCircle2, AlertTriangle, Info, RefreshCw } from "lucide-react";
import { wsManager } from "@/lib/websocket";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface UserData {
  id: number;
  username: string;
  isUpstoxLinked: boolean;
  upstoxUserId?: string;
}

export default function Topbar() {
  const [, setLocation] = useLocation();
  const [marketStatus, setMarketStatus] = useState<"open" | "closed" | "pre-open">("open");
  const [marketTime, setMarketTime] = useState<string>("");
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "success",
      title: "Strategy Executed",
      message: "RSI Mean Reversion strategy executed successfully",
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: "2",
      type: "warning", 
      title: "Token Expiry",
      message: "Your Upstox access token will expire in 2 hours",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      read: false
    },
    {
      id: "3",
      type: "info",
      title: "Backtest Complete",
      message: "Your moving average strategy backtest has finished",
      timestamp: new Date(Date.now() - 600000).toISOString(),
      read: true
    }
  ]);

  const { data: upstoxStatus } = useQuery<{
    isLinked: boolean;
    upstoxUserId?: string;
    needsRefresh: boolean;
  }>({
    queryKey: ["/api/upstox/account-status"],
  });

  const { data: accountData } = useQuery<{
    totalBalance: string;
    availableMargin: string;
    usedMargin: string;
  }>({
    queryKey: ["/api/account"],
  });

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

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleAccountClick = () => {
    setLocation("/account");
  };

  const { toast } = useToast();

  const refreshDataMutation = useMutation({
    mutationFn: async () => {
      // Invalidate all queries to refresh data
      await queryClient.invalidateQueries();
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Data Refreshed",
        description: "All dashboard data has been refreshed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refreshDataMutation.mutate();
  };

  const handleLogout = () => {
    // In a real app, this would clear auth tokens
    console.log("Logging out...");
  };

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
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshDataMutation.isPending}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshDataMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-loss-red border-0 flex items-center justify-center p-0">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-trading-card border-trading-border" align="end">
              <div className="p-4 border-b border-trading-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-auto p-1"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-trading-border last:border-b-0 cursor-pointer hover:bg-gray-700/50 ${
                        !notification.read ? 'bg-blue-500/10' : ''
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No notifications
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 h-auto p-2 hover:bg-gray-700 transition-colors">
                <div className="text-right">
                  <p className="text-sm font-medium">Demo User</p>
                  <p className="text-xs text-gray-400">
                    {upstoxStatus?.isLinked 
                      ? `ID: ${upstoxStatus.upstoxUserId || 'Connected'}`
                      : 'Account not linked'
                    }
                  </p>
                </div>
                <div className="w-8 h-8 bg-trading-blue rounded-full flex items-center justify-center relative">
                  <UserIcon className="w-4 h-4 text-white" />
                  {upstoxStatus?.isLinked && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-trading-card"></div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-trading-card border-trading-border" align="end">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">Demo User</p>
                <p className="text-xs text-gray-400">
                  Balance: ₹{accountData?.totalBalance ? parseFloat(accountData.totalBalance).toLocaleString() : '0'}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-trading-border" />
              <DropdownMenuItem 
                onClick={handleAccountClick}
                className="hover:bg-gray-700 cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-trading-border" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="hover:bg-gray-700 cursor-pointer text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
