import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CrownIcon, 
  CheckIcon, 
  CalendarIcon,
  CreditCardIcon,
  TrendingUpIcon,
  ZapIcon,
  BarChart3,
  DollarSign,
  Users,
  Activity,
  ArrowUpIcon,
  ArrowDownIcon,
  AlertTriangle
} from "lucide-react";

interface UserData {
  id: number;
  username: string;
  email: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionExpiry: string | null;
  trialEndsAt: string | null;
}

interface UsageStats {
  strategiesUsed: number;
  backtestsRun: number;
  apiCallsThisMonth: number;
  tradingVolume: number;
  maxStrategies: number | "unlimited";
  maxBacktests: number | "unlimited";
  maxApiCalls: number | "unlimited";
}

export default function Subscription() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState("");

  const { data: user } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
  });

  const { data: usageStats } = useQuery<UsageStats>({
    queryKey: ["/api/subscription/usage"],
    enabled: !!user,
  });

  const { data: billingHistory } = useQuery({
    queryKey: ["/api/subscription/billing-history"],
    enabled: !!user,
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/subscription/upgrade", { planId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
      toast({
        title: "Plan Updated",
        description: "Your subscription has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    },
  });

  const plans = [
    {
      id: "demo",
      name: "Demo",
      price: "Free",
      period: "30-day trial",
      color: "bg-gray-500",
      popular: false,
      features: [
        "Demo trading only",
        "5 strategies",
        "10 backtests per month",
        "Basic analytics",
        "Community support"
      ],
      limits: {
        strategies: 5,
        backtests: 10,
        apiCalls: 1000,
        tradingCapital: 0
      }
    },
    {
      id: "basic",
      name: "Basic",
      price: "₹999",
      period: "per month",
      color: "bg-blue-500",
      popular: false,
      features: [
        "Live trading",
        "25 strategies",
        "100 backtests per month",
        "Advanced analytics",
        "Email support",
        "Real-time data"
      ],
      limits: {
        strategies: 25,
        backtests: 100,
        apiCalls: 10000,
        tradingCapital: 500000
      }
    },
    {
      id: "premium",
      name: "Premium",
      price: "₹2,999",
      period: "per month",
      color: "bg-purple-500",
      popular: true,
      features: [
        "Everything in Basic",
        "Unlimited strategies",
        "Unlimited backtests",
        "Advanced AI insights",
        "Priority support",
        "Portfolio optimization",
        "Risk management tools"
      ],
      limits: {
        strategies: "unlimited",
        backtests: "unlimited",
        apiCalls: 100000,
        tradingCapital: 5000000
      }
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "₹9,999",
      period: "per month",
      color: "bg-gold-500",
      popular: false,
      features: [
        "Everything in Premium",
        "White-label solution",
        "Custom integrations",
        "Dedicated support",
        "Custom training",
        "SLA guarantee",
        "Multi-user access"
      ],
      limits: {
        strategies: "unlimited",
        backtests: "unlimited",
        apiCalls: "unlimited",
        tradingCapital: "unlimited"
      }
    }
  ];

  const currentPlan = plans.find(p => p.id === user?.subscriptionPlan) || plans[0];
  const trialDaysLeft = user?.trialEndsAt ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  const usagePercentages = useMemo(() => {
    if (!usageStats) return {};
    
    return {
      strategies: currentPlan.limits.strategies === "unlimited" ? 0 : 
        (usageStats.strategiesUsed / currentPlan.limits.strategies) * 100,
      backtests: currentPlan.limits.backtests === "unlimited" ? 0 : 
        (usageStats.backtestsRun / currentPlan.limits.backtests) * 100,
      apiCalls: currentPlan.limits.apiCalls === "unlimited" ? 0 : 
        (usageStats.apiCallsThisMonth / currentPlan.limits.apiCalls) * 100,
    };
  }, [usageStats, currentPlan]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Subscription Management</h1>
        <p className="text-gray-400">Manage your subscription, track usage, and upgrade your plan</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="plans">Upgrade Plans</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Plan Status */}
          <Card className="bg-trading-card border-trading-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CrownIcon className="w-5 h-5 text-yellow-500" />
                  <span>Current Plan</span>
                </div>
                <Badge variant={user?.subscriptionStatus === "active" ? "default" : "destructive"}>
                  {user?.subscriptionStatus?.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{currentPlan.name}</h3>
                  <div className="text-2xl font-bold text-blue-400">{currentPlan.price}</div>
                  <div className="text-gray-400">{currentPlan.period}</div>
                  
                  {user?.subscriptionPlan === "demo" && trialDaysLeft > 0 && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-400 mb-1">Trial expires in {trialDaysLeft} days</div>
                      <Progress value={(30 - trialDaysLeft) / 30 * 100} className="h-2" />
                    </div>
                  )}
                  
                  {user?.subscriptionExpiry && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-400">Next billing: {new Date(user.subscriptionExpiry).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Plan Features</h4>
                  <div className="space-y-2">
                    {currentPlan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckIcon className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    {user?.subscriptionPlan !== "enterprise" && (
                      <Button 
                        className="w-full" 
                        onClick={() => setSelectedPlan("premium")}
                      >
                        <TrendingUpIcon className="w-4 h-4 mr-2" />
                        Upgrade Plan
                      </Button>
                    )}
                    <Button variant="outline" className="w-full">
                      <CreditCardIcon className="w-4 h-4 mr-2" />
                      Update Payment
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-trading-card border-trading-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Strategies</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats?.strategiesUsed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  of {currentPlan.limits.strategies === "unlimited" ? "unlimited" : currentPlan.limits.strategies}
                </p>
                {currentPlan.limits.strategies !== "unlimited" && (
                  <Progress value={usagePercentages.strategies || 0} className="h-1 mt-2" />
                )}
              </CardContent>
            </Card>

            <Card className="bg-trading-card border-trading-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Backtests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats?.backtestsRun || 0}</div>
                <p className="text-xs text-muted-foreground">
                  this month
                </p>
                {currentPlan.limits.backtests !== "unlimited" && (
                  <Progress value={usagePercentages.backtests || 0} className="h-1 mt-2" />
                )}
              </CardContent>
            </Card>

            <Card className="bg-trading-card border-trading-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <ZapIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(usageStats?.apiCallsThisMonth || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  this month
                </p>
                {currentPlan.limits.apiCalls !== "unlimited" && (
                  <Progress value={usagePercentages.apiCalls || 0} className="h-1 mt-2" />
                )}
              </CardContent>
            </Card>

            <Card className="bg-trading-card border-trading-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trading Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(usageStats?.tradingVolume || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  this month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card className="bg-trading-card border-trading-border">
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Usage Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Strategies Used</span>
                      <span className="text-sm text-gray-400">
                        {usageStats?.strategiesUsed || 0} / {currentPlan.limits.strategies === "unlimited" ? "∞" : currentPlan.limits.strategies}
                      </span>
                    </div>
                    <Progress value={usagePercentages.strategies || 0} className="h-3" />
                    {(usagePercentages.strategies || 0) > 80 && (
                      <div className="flex items-center mt-1 text-xs text-yellow-500">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Consider upgrading to avoid limits
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Monthly Backtests</span>
                      <span className="text-sm text-gray-400">
                        {usageStats?.backtestsRun || 0} / {currentPlan.limits.backtests === "unlimited" ? "∞" : currentPlan.limits.backtests}
                      </span>
                    </div>
                    <Progress value={usagePercentages.backtests || 0} className="h-3" />
                    {(usagePercentages.backtests || 0) > 80 && (
                      <div className="flex items-center mt-1 text-xs text-yellow-500">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Consider upgrading to avoid limits
                      </div>
                    )}
                  </div>
                </div>

                {/* Monthly Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card className="bg-gray-800/50">
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-400">Average Performance</div>
                      <div className="text-xl font-semibold text-green-400">+12.4%</div>
                      <div className="flex items-center text-xs text-green-400">
                        <ArrowUpIcon className="w-3 h-3 mr-1" />
                        +2.1% from last month
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50">
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-400">Win Rate</div>
                      <div className="text-xl font-semibold text-blue-400">68.2%</div>
                      <div className="flex items-center text-xs text-green-400">
                        <ArrowUpIcon className="w-3 h-3 mr-1" />
                        +4.5% from last month
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50">
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-400">Risk Score</div>
                      <div className="text-xl font-semibold text-yellow-400">6.8/10</div>
                      <div className="flex items-center text-xs text-red-400">
                        <ArrowDownIcon className="w-3 h-3 mr-1" />
                        -0.3 from last month
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${
                  plan.id === user?.subscriptionPlan 
                    ? 'ring-2 ring-blue-500 bg-blue-950/30' 
                    : 'bg-trading-card'
                } border-trading-border hover:shadow-lg transition-shadow`}
              >
                {plan.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold text-blue-400">{plan.price}</div>
                  <div className="text-sm text-gray-400">{plan.period}</div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-700">
                    {plan.id === user?.subscriptionPlan ? (
                      <Button className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => upgradeMutation.mutate(plan.id)}
                        disabled={upgradeMutation.isPending}
                      >
                        {upgradeMutation.isPending ? "Processing..." : 
                         plan.id === "demo" ? "Downgrade" : "Upgrade"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className="bg-trading-card border-trading-border">
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingHistory?.length > 0 ? (
                  billingHistory.map((bill: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium">{bill.description}</div>
                        <div className="text-sm text-gray-400">{new Date(bill.date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(bill.amount)}</div>
                        <Badge variant={bill.status === "paid" ? "default" : "destructive"}>
                          {bill.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <CreditCardIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No billing history available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}