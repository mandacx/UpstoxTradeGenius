import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, Unlink, ExternalLink, Link, Copy, Eye, EyeOff, Edit, Save, X, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UpstoxStatus {
  isLinked: boolean;
  hasCredentials: boolean;
  hasValidTokens: boolean;
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
    clientId: '',
    clientSecret: '',
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
    isLinked?: boolean;
  }>({
    queryKey: ["/api/upstox/config"],
  });

  // Update config form when savedConfig loads
  useEffect(() => {
    if (savedConfig) {
      setConfigForm({
        clientId: savedConfig.clientId || '',
        clientSecret: savedConfig.hasClientSecret ? '••••••••••••••••' : '',
        redirectUri: savedConfig.redirectUri || `${window.location.origin}/api/upstox/callback`
      });
    }
  }, [savedConfig]);

  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/upstox/refresh-token", {});
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to refresh token');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upstox/account-status"] });
      toast({
        title: "Token Refreshed",
        description: "Your Upstox access token has been refreshed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh Not Available",
        description: error.message || "Upstox doesn't support token refresh. Please re-authenticate to get a new token.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/upstox/config"] });
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
      
      // Open popup and listen for messages
      const popup = window.open(
        response.authUrl, 
        "upstox-auth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );
      
      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'UPSTOX_AUTH_SUCCESS') {
          setIsLinking(false);
          // Refresh all data after successful account linking
          queryClient.invalidateQueries();
          toast({
            title: "Account Linked",
            description: "Your Upstox account has been linked successfully. All data is now refreshing.",
          });
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'UPSTOX_AUTH_ERROR') {
          setIsLinking(false);
          toast({
            title: "Connection Failed",
            description: event.data.error || "Failed to link Upstox account.",
            variant: "destructive",
          });
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Fallback: Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsLinking(false);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);
      
    } catch (error) {
      setIsLinking(false);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate Upstox account linking.",
        variant: "destructive",
      });
    }
  };

  // Alias for the connect button in the new layout
  const handleLinkUpstox = handleLinkAccount;

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
      clientId: savedConfig?.clientId || '',
      clientSecret: savedConfig?.hasClientSecret ? '••••••••••••••••' : '',
      redirectUri: savedConfig?.redirectUri || `${window.location.origin}/api/upstox/callback`
    });
    setIsEditingConfig(true);
  };

  const handleCancelEdit = () => {
    setIsEditingConfig(false);
    setConfigForm({
      clientId: savedConfig?.clientId || '',
      clientSecret: savedConfig?.hasClientSecret ? '••••••••••••••••' : '',
      redirectUri: savedConfig?.redirectUri || `${window.location.origin}/api/upstox/callback`
    });
  };

  const handleSaveConfig = async () => {
    try {
      // Don't send masked client secret, only send if it's been changed
      const configToSave: any = { ...configForm };
      if (configToSave.clientSecret === '••••••••••••••••') {
        // If client secret is still masked, exclude it from the update
        delete configToSave.clientSecret;
      }
      
      // Only proceed if we have actual values to save
      if (!configToSave.clientId || !configToSave.redirectUri) {
        toast({
          title: "Validation Error",
          description: "Client ID and Redirect URI are required.",
          variant: "destructive",
        });
        return;
      }

      await updateConfigMutation.mutateAsync(configToSave as any);
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
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : upstoxStatus?.hasCredentials ? (
                <Badge variant="secondary">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Configured - Not Linked
                </Badge>
              ) : (
                <Badge variant="outline">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              View and manage your Upstox API configuration and connection settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Configuration Status Alert */}
            {!upstoxStatus?.isLinked && (
              <Alert className={
                !upstoxStatus?.hasCredentials 
                  ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
                  : upstoxStatus?.hasValidTokens 
                    ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
                    : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
              }>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {!upstoxStatus?.hasCredentials ? (
                    <>
                      <strong>Setup Required:</strong> Configure your Upstox API credentials below to enable trading features. 
                      You'll need to create an app in your Upstox Developer Console first.
                    </>
                  ) : !upstoxStatus?.hasValidTokens ? (
                    <>
                      <strong>Authentication Required:</strong> Your Upstox API credentials are configured but you need to 
                      link your account to enable live trading features.
                    </>
                  ) : upstoxStatus?.needsRefresh ? (
                    <>
                      <strong>Token Expired:</strong> Your Upstox access token has expired. Please re-authenticate to 
                      continue using live trading features.
                    </>
                  ) : (
                    <>
                      <strong>Almost Ready:</strong> Credentials configured, please complete the linking process.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* API Configuration Display */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">API Configuration</h3>
                <div className="flex items-center gap-2">
                  {savedConfig?.clientId && savedConfig?.hasClientSecret ? (
                    <Badge className="bg-green-100 text-green-800">Configured</Badge>
                  ) : (
                    <Badge variant="destructive">Not Configured</Badge>
                  )}
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
                      {configForm.clientId || <span className="text-muted-foreground italic">Not configured</span>}
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

            {/* Connect to Upstox Button */}
            {savedConfig?.clientId && savedConfig?.hasClientSecret && !upstoxStatus?.isLinked && (
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                <Button
                  onClick={handleLinkUpstox}
                  disabled={isLinking}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLinking ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      Connect to Upstox
                    </>
                  )}
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Click to authenticate with Upstox and link your trading account. This will open a secure Upstox login window.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {/* Connection Status */}
            {savedConfig?.clientId && savedConfig?.hasClientSecret ? (
              upstoxStatus?.isLinked ? (
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
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your Upstox API credentials are configured but your account is not yet linked. Connect now to enable live trading and real-time data.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Benefits of linking your account:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                      <li>• Execute trades directly from strategies</li>
                      <li>• Access real-time market data and quotes</li>
                      <li>• Sync portfolio and positions automatically</li>
                      <li>• View live account balance and margins</li>
                    </ul>
                  </div>
                </div>
              )
            ) : (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Configuration Required:</strong> Please configure your Upstox API credentials above before connecting your account.
                </AlertDescription>
              </Alert>
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