import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
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
  const { user } = useAuth();
  const { toast } = useToast();
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Perform complete logout cleanup
      performCompleteLogout();
    },
    onError: () => {
      // Even if the server request fails, clear all authentication data
      performCompleteLogout();
    },
  });

  const performCompleteLogout = () => {
    // Clear all authentication data
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
    
    // Clear all cookies with different paths and domains
    const cookiesToClear = [
      'connect.sid', 'session', 'auth', 'auth_token', 'authToken',
      'user_session', 'admin_token', 'trading_session'
    ];
    
    cookiesToClear.forEach(cookieName => {
      // Clear for current path
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      // Clear for root path
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      // Clear without domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    // Clear all cookies using the split method as fallback
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    
    // Force complete page refresh to landing page
    setTimeout(() => {
      window.location.replace("/");
    }, 500);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
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
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-semibold text-foreground">TradingPro AI Dashboard</h2>
          <div className="flex items-center space-x-4 text-sm">
            {/* Market Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                marketStatus === "open" ? "bg-profit-green" :
                marketStatus === "pre-open" ? "bg-yellow-500" : "bg-loss-red"
              }`}></div>
              <span className={getMarketStatusColor()}>{getMarketStatusText()}</span>
            </div>
            <div className="text-muted-foreground">
              NSE: <span className="text-foreground">{marketTime}</span>
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
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshDataMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-loss-red border-0 flex items-center justify-center p-0">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
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
                      className={`p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-accent/50 ${
                        !notification.read ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 
                     user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.username || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/preferences")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAccountClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
