import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, ExternalLink, Unlink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface UpstoxStatus {
  isLinked: boolean;
  upstoxUserId?: string;
  tokenExpiry?: string;
  needsRefresh: boolean;
}

export default function Account() {
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();

  const { data: upstoxStatus, isLoading: statusLoading } = useQuery<UpstoxStatus>({
    queryKey: ["/api/upstox/account-status"],
  });

  const { data: accountData } = useQuery<{
    totalBalance: string;
    availableMargin: string;
    usedMargin: string;
  }>({
    queryKey: ["/api/account"],
  });

  const refreshTokenMutation = useMutation({
    mutationFn: () => apiRequest({
      method: "POST",
      url: "/api/upstox/refresh-token",
      body: {},
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upstox/account-status"] });
      toast({
        title: "Token Refreshed",
        description: "Your Upstox access token has been refreshed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh your Upstox access token.",
        variant: "destructive",
      });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: () => apiRequest({
      method: "DELETE",
      url: "/api/upstox/unlink-account",
      body: {},
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upstox/account-status"] });
      toast({
        title: "Account Unlinked",
        description: "Your Upstox account has been unlinked successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Unlink Failed",
        description: "Failed to unlink your Upstox account.",
        variant: "destructive",
      });
    },
  });

  const handleLinkAccount = async () => {
    try {
      setIsLinking(true);
      
      // Make API request to get auth URL
      const res = await apiRequest("GET", "/api/upstox/auth-url");
      const response: { authUrl: string } = await res.json();
      
      // Open Upstox OAuth in new window
      window.open(response.authUrl, "_blank");
      
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await apiRequest("GET", "/api/upstox/account-status");
          const status: UpstoxStatus = await statusRes.json();
          
          if (status.isLinked) {
            clearInterval(pollInterval);
            setIsLinking(false);
            queryClient.invalidateQueries({ queryKey: ["/api/upstox/account-status"] });
            toast({
              title: "Account Linked",
              description: "Your Upstox account has been linked successfully.",
            });
          }
        } catch (pollError) {
          console.error("Error polling status:", pollError);
        }
      }, 3000);
      
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsLinking(false);
      }, 300000);
      
    } catch (error) {
      setIsLinking(false);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate Upstox account linking.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upstox') === 'linked') {
      toast({
        title: "Account Linked",
        description: "Your Upstox account has been linked successfully.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('upstox') === 'error') {
      toast({
        title: "Linking Failed",
        description: "Failed to link your Upstox account. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  if (statusLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">Manage your trading account and integrations</p>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your trading account and integrations</p>
        </div>

        {/* Account Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Your trading account details and balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">
                  ₹{accountData?.totalBalance ? parseFloat(accountData.totalBalance).toLocaleString() : '0'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Available Margin</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{accountData?.availableMargin ? parseFloat(accountData.availableMargin).toLocaleString() : '0'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Used Margin</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{accountData?.usedMargin ? parseFloat(accountData.usedMargin).toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upstox Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Upstox Integration
              {upstoxStatus?.isLinked ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Connect your Upstox account for real-time trading and market data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upstoxStatus?.isLinked ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Upstox User ID</p>
                    <p className="font-medium">{upstoxStatus.upstoxUserId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Token Status</p>
                    <div className="flex items-center gap-2">
                      {upstoxStatus.needsRefresh ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                      {upstoxStatus.tokenExpiry && (
                        <span className="text-sm text-muted-foreground">
                          Expires: {new Date(upstoxStatus.tokenExpiry).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {upstoxStatus.needsRefresh && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your Upstox access token has expired. Please refresh it to continue trading.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => refreshTokenMutation.mutate()}
                    disabled={refreshTokenMutation.isPending}
                    variant="outline"
                  >
                    Refresh Token
                  </Button>
                  <Button
                    onClick={() => unlinkMutation.mutate()}
                    disabled={unlinkMutation.isPending}
                    variant="destructive"
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Unlink Account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Connect your Upstox account to enable live trading, real-time market data, and portfolio synchronization.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Benefits of linking your Upstox account:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Execute trades directly from strategies</li>
                    <li>• Real-time portfolio and position updates</li>
                    <li>• Live market data and quotes</li>
                    <li>• Automated strategy execution</li>
                    <li>• Risk management and position tracking</li>
                  </ul>
                </div>

                <Button
                  onClick={handleLinkAccount}
                  disabled={isLinking}
                  className="w-full sm:w-auto"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {isLinking ? "Connecting..." : "Connect Upstox Account"}
                </Button>
                
                {isLinking && (
                  <p className="text-sm text-muted-foreground">
                    Please complete the authorization in the opened window. This page will update automatically.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Advanced settings for API access and trading parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Trading Mode</p>
                  <p className="font-medium">Paper Trading</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Management</p>
                  <p className="font-medium">Enabled</p>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Currently in demo mode. All trades are simulated for testing purposes.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}