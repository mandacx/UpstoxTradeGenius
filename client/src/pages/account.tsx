import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Unlink, ExternalLink, Link, Copy, Eye, EyeOff, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UpstoxStatus {
  isLinked: boolean;
  upstoxUserId?: string;
  tokenExpiry?: string;
  needsRefresh: boolean;
}

export default function Account() {
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    clientId: 'd1ea1855-3820-424d-83b3-771e08c5b9cc',
    clientSecret: 'a1b2c3d4e5f6g7h8i9j0',
    redirectUri: ''
  });
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

  const { data: savedConfig } = useQuery<{
    clientId?: string;
    redirectUri?: string;
    hasClientSecret: boolean;
  }>({
    queryKey: ["/api/upstox/config"],
  });

  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/upstox/refresh-token", {});
      return res.json();
    },
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
        description: "Failed to refresh Upstox token. Please re-link your account.",
        variant: "destructive",
      });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/upstox/unlink", {});
      return res.json();
    },
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
        description: "Failed to unlink Upstox account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (config: typeof configForm) => {
      const res = await apiRequest("POST", "/api/upstox/update-config", config);
      if (!res.ok) {
        throw new Error(`Failed to update configuration: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      setIsEditingConfig(false);
      toast({
        title: "Configuration Updated",
        description: "Your Upstox API configuration has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Configuration update error:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update API configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLinkAccount = async () => {
    try {
      setIsLinking(true);
      
      const res = await apiRequest("GET", "/api/upstox/auth-url");
      const response: { authUrl: string } = await res.json();
      
      window.open(response.authUrl, "_blank");
      
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

  const handleUnlinkAccount = async () => {
    setIsUnlinking(true);
    try {
      await unlinkMutation.mutateAsync();
    } finally {
      setIsUnlinking(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const handleStartEdit = () => {
    setConfigForm({
      clientId: savedConfig?.clientId || 'd1ea1855-3820-424d-83b3-771e08c5b9cc',
      clientSecret: savedConfig?.hasClientSecret ? '••••••••••••••••' : 'a1b2c3d4e5f6g7h8i9j0',
      redirectUri: savedConfig?.redirectUri || `${window.location.origin}/api/upstox/callback`
    });
    setIsEditingConfig(true);
  };

  const handleCancelEdit = () => {
    setIsEditingConfig(false);
    setConfigForm({
      clientId: savedConfig?.clientId || 'd1ea1855-3820-424d-83b3-771e08c5b9cc',
      clientSecret: savedConfig?.hasClientSecret ? '••••••••••••••••' : 'a1b2c3d4e5f6g7h8i9j0',
      redirectUri: savedConfig?.redirectUri || `${window.location.origin}/api/upstox/callback`
    });
  };

  const handleSaveConfig = async () => {
    try {
      await updateConfigMutation.mutateAsync(configForm);
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const handleConfigChange = (field: keyof typeof configForm, value: string) => {
    setConfigForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    // Initialize redirectUri with current origin
    setConfigForm(prev => ({
      ...prev,
      redirectUri: `${window.location.origin}/api/upstox/callback`
    }));

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upstox') === 'linked') {
      toast({
        title: "Account Linked",
        description: "Your Upstox account has been linked successfully.",
      });
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

        {/* Upstox Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Upstox Configuration
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
              View and manage your Upstox API configuration and connection settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Configuration Display */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">API Configuration</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Production</Badge>
                  {!isEditingConfig ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEdit}
                      className="h-8"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveConfig}
                        disabled={updateConfigMutation.isPending}
                        className="h-8"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-8"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Client ID */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm text-muted-foreground">Client ID</Label>
                    {!isEditingConfig && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(configForm.clientId, 'Client ID')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {isEditingConfig ? (
                    <Input
                      value={configForm.clientId}
                      onChange={(e) => handleConfigChange('clientId', e.target.value)}
                      placeholder="Enter Upstox Client ID"
                      className="font-mono text-sm"
                    />
                  ) : (
                    <p className="font-mono text-sm bg-background p-2 rounded border">
                      {configForm.clientId}
                    </p>
                  )}
                </div>

                {/* Client Secret */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm text-muted-foreground">Client Secret</Label>
                    {!isEditingConfig && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowClientSecret(!showClientSecret)}
                        >
                          {showClientSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(configForm.clientSecret, 'Client Secret')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditingConfig ? (
                    <Input
                      type={showClientSecret ? "text" : "password"}
                      value={configForm.clientSecret}
                      onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
                      placeholder="Enter Upstox Client Secret"
                      className="font-mono text-sm"
                    />
                  ) : (
                    <p className="font-mono text-sm bg-background p-2 rounded border">
                      {showClientSecret ? configForm.clientSecret : '••••••••••••••••••••'}
                    </p>
                  )}
                  {isEditingConfig && (
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowClientSecret(!showClientSecret)}
                        className="h-6 px-2 text-xs"
                      >
                        {showClientSecret ? <EyeOff className="w-2 h-2 mr-1" /> : <Eye className="w-2 h-2 mr-1" />}
                        {showClientSecret ? "Hide" : "Show"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Redirect URI */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm text-muted-foreground">Redirect URI</Label>
                    {!isEditingConfig && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(configForm.redirectUri || `${window.location.origin}/api/upstox/callback`, 'Redirect URI')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {isEditingConfig ? (
                    <Input
                      value={configForm.redirectUri}
                      onChange={(e) => handleConfigChange('redirectUri', e.target.value)}
                      placeholder="Enter redirect URI"
                      className="font-mono text-sm"
                    />
                  ) : (
                    <p className="font-mono text-sm bg-background p-2 rounded border">
                      {configForm.redirectUri || `${window.location.origin}/api/upstox/callback`}
                    </p>
                  )}
                  {isEditingConfig && (
                    <p className="text-xs text-muted-foreground mt-1">
                      This should match the redirect URI configured in your Upstox app settings
                    </p>
                  )}
                </div>
              </div>

              {isEditingConfig && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Changes to API configuration will require re-linking your Upstox account if it's currently connected.
                  </AlertDescription>
                </Alert>
              )}
            </div>

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
                    onClick={handleUnlinkAccount}
                    disabled={isUnlinking}
                    variant="destructive"
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Unlink Account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Connect your Upstox account to enable live trading, real-time market data, and portfolio synchronization.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Benefits of linking your Upstox account:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                      <li>• Execute trades directly from the platform</li>
                      <li>• Access real-time market data and quotes</li>
                      <li>• Sync your portfolio and positions</li>
                      <li>• View live account balance and margins</li>
                      <li>• Get automated trade notifications</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="text-sm font-medium">Setup Instructions:</p>
                    <ol className="text-sm text-muted-foreground mt-1 space-y-1">
                      <li>1. Ensure you have an active Upstox trading account</li>
                      <li>2. Click "Connect to Upstox" below to start OAuth flow</li>
                      <li>3. Login with your Upstox credentials in the popup window</li>
                      <li>4. Grant permission for API access</li>
                      <li>5. You'll be redirected back and account will be linked</li>
                    </ol>
                  </div>
                </div>

                <Button
                  onClick={handleLinkAccount}
                  disabled={isLinking}
                  className="w-full"
                  size="lg"
                >
                  {isLinking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Connecting to Upstox...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      Connect to Upstox
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trading Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Configuration</CardTitle>
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
                <div>
                  <p className="text-sm text-muted-foreground">Max Position Size</p>
                  <p className="font-medium">₹50,000 per trade</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stop Loss</p>
                  <p className="font-medium">2% automatic</p>
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