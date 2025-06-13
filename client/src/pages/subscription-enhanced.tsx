import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Crown, 
  Check, 
  CreditCard, 
  Calendar, 
  TrendingUp,
  BarChart3,
  Clock,
  DollarSign,
  Plus,
  Star,
  Shield,
  Zap
} from "lucide-react";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  currency: string;
  billingCycle: string;
  features: string[];
  isActive: boolean;
}

interface PaymentMethod {
  id: number;
  type: string;
  cardLast4: string;
  cardBrand: string;
  cardExpMonth: number;
  cardExpYear: number;
  isDefault: boolean;
}

interface Transaction {
  id: number;
  amount: string;
  currency: string;
  status: string;
  type: string;
  description: string;
  createdAt: string;
  processedAt: string;
}

interface UsageStats {
  feature: string;
  totalValue: number;
}

export default function SubscriptionEnhanced() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const { toast } = useToast();

  // Fetch subscription plans
  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription/plans"],
  });

  // Fetch current subscription
  const { data: currentSubscription } = useQuery({
    queryKey: ["/api/subscription/current"],
  });

  // Fetch payment methods
  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  // Fetch billing history
  const { data: billingHistory = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/billing/history"],
  });

  // Fetch usage stats
  const { data: usageStats = [] } = useQuery<UsageStats[]>({
    queryKey: ["/api/usage/stats"],
  });

  // Subscription upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: async ({ planId, paymentMethodId }: { planId: number; paymentMethodId: number }) => {
      const response = await apiRequest("POST", "/api/subscription/upgrade", {
        planId,
        paymentMethodId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been successfully upgraded!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
      setShowPaymentDialog(false);
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to upgrade subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add payment method mutation
  const addPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest("POST", "/api/payment-methods", paymentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Method Added",
        description: "Your payment method has been successfully added!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      setShowAddPaymentDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Payment Method",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (planId: number) => {
    const defaultPaymentMethod = paymentMethods.find(pm => pm.isDefault);
    
    if (!defaultPaymentMethod) {
      toast({
        title: "No Payment Method",
        description: "Please add a payment method first.",
        variant: "destructive",
      });
      return;
    }

    setSelectedPlan(planId);
    setShowPaymentDialog(true);
  };

  const confirmUpgrade = () => {
    if (selectedPlan) {
      const defaultPaymentMethod = paymentMethods.find(pm => pm.isDefault);
      if (defaultPaymentMethod) {
        upgradeMutation.mutate({
          planId: selectedPlan,
          paymentMethodId: defaultPaymentMethod.id
        });
      }
    }
  };

  const handleAddPaymentMethod = (formData: FormData) => {
    const cardNumber = formData.get('cardNumber') as string;
    const expiry = formData.get('expiry') as string;
    const [expMonth, expYear] = expiry.split('/');
    
    addPaymentMutation.mutate({
      type: 'card',
      cardLast4: cardNumber.slice(-4),
      cardBrand: 'Visa', // This would normally be detected
      cardExpMonth: parseInt(expMonth),
      cardExpYear: parseInt(`20${expYear}`)
    });
  };

  // Get usage data for display
  const getUsageDisplay = () => {
    const apiCalls = usageStats.find(s => s.feature === 'api_calls')?.totalValue || 0;
    const strategies = usageStats.find(s => s.feature === 'strategies_created')?.totalValue || 0;
    const backtests = usageStats.find(s => s.feature === 'backtests_run')?.totalValue || 0;

    return {
      apiCalls: { used: apiCalls, limit: 10000 },
      strategies: { used: strategies, limit: 25 },
      backtests: { used: backtests, limit: 100 }
    };
  };

  const usageData = getUsageDisplay();

  // Default plans when no data is available
  const defaultPlans = [
    {
      id: 1,
      name: "Free",
      price: "0",
      billingCycle: "forever",
      features: ["5 trading strategies", "10 backtests per month", "Basic analytics", "Community support"],
      current: !currentSubscription
    },
    {
      id: 2,
      name: "Pro",
      price: "29.99",
      billingCycle: "monthly",
      features: ["25 trading strategies", "100 backtests per month", "Advanced analytics", "Priority support", "API access (10,000 calls/month)", "Real-time alerts"],
      current: !!currentSubscription,
      popular: true
    },
    {
      id: 3,
      name: "Enterprise",
      price: "99.99",
      billingCycle: "monthly",
      features: ["Unlimited strategies", "Unlimited backtests", "Premium analytics", "24/7 dedicated support", "API access (100,000 calls/month)", "Custom integrations", "White-label options"],
      current: false
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription & Billing</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription, view usage, and billing history
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Subscription Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-2xl">Current Subscription</CardTitle>
                <CardDescription>Your active plan and billing information</CardDescription>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-medium">
                    {currentSubscription ? 'Pro Plan' : 'Free Plan'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {currentSubscription?.status || 'Active'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {currentSubscription ? '$29.99/month' : 'Free'}
                  </p>
                  {currentSubscription?.endDate && (
                    <p className="text-sm text-muted-foreground">
                      Next billing: {new Date(currentSubscription.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {paymentMethods.length > 0 ? 'Update Payment' : 'Add Payment Method'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Payment Method</DialogTitle>
                      <DialogDescription>
                        Add a new payment method to your account
                      </DialogDescription>
                    </DialogHeader>
                    <form action={handleAddPaymentMethod} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" name="cardNumber" placeholder="1234 5678 9012 3456" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" name="expiry" placeholder="MM/YY" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" name="cvv" placeholder="123" required />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={addPaymentMutation.isPending}>
                        {addPaymentMutation.isPending ? 'Adding...' : 'Add Payment Method'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          {paymentMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Your saved payment methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{method.cardBrand} •••• {method.cardLast4}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.cardExpMonth}/{method.cardExpYear}
                          </p>
                        </div>
                      </div>
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usage Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageData.apiCalls.used.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {usageData.apiCalls.limit.toLocaleString()} calls this month
                </p>
                <Progress 
                  value={(usageData.apiCalls.used / usageData.apiCalls.limit) * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trading Strategies</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageData.strategies.used}</div>
                <p className="text-xs text-muted-foreground">
                  of {usageData.strategies.limit} strategies created
                </p>
                <Progress 
                  value={(usageData.strategies.used / usageData.strategies.limit) * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Backtests</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageData.backtests.used}</div>
                <p className="text-xs text-muted-foreground">
                  of {usageData.backtests.limit} backtests this month
                </p>
                <Progress 
                  value={(usageData.backtests.used / usageData.backtests.limit) * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {(plans.length > 0 ? plans : defaultPlans).map((plan, index) => (
              <Card 
                key={plan.id || index} 
                className={`relative ${(plan as any).current || (currentSubscription?.planId === plan.id) ? 'border-primary' : ''} ${(plan as any).popular || plan.name === "Pro" ? 'border-2 border-primary' : ''}`}
              >
                {((plan as any).popular || plan.name === "Pro") && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                {((plan as any).current || (currentSubscription?.planId === plan.id)) && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Current</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      ${plan.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{(plan as any).billingCycle || (plan as any).period || plan.billingCycle}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {((plan as any).features || plan.features).map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={(plan as any).current || (currentSubscription?.planId === plan.id) ? "secondary" : "default"}
                    disabled={(plan as any).current || (currentSubscription?.planId === plan.id)}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {(plan as any).current || (currentSubscription?.planId === plan.id) ? "Current Plan" : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                Detailed breakdown of your platform usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {usageStats.map((stat) => (
                  <Card key={stat.feature}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {stat.feature.replace('_', ' ')}
                          </p>
                          <p className="text-2xl font-bold">{stat.totalValue}</p>
                        </div>
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {usageStats.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No usage data available yet. Start using the platform to see your analytics!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your past invoices and payment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingHistory.length > 0 ? (
                  billingHistory.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()} • {transaction.type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${transaction.amount}</p>
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          className={transaction.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No billing history available yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subscription Upgrade</DialogTitle>
            <DialogDescription>
              You are about to upgrade your subscription. This will be charged to your default payment method.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">Selected Plan: Pro</p>
              <p className="text-lg font-bold">$29.99/month</p>
            </div>
            {paymentMethods.find(pm => pm.isDefault) && (
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>
                    {paymentMethods.find(pm => pm.isDefault)?.cardBrand} •••• {paymentMethods.find(pm => pm.isDefault)?.cardLast4}
                  </span>
                </div>
              </div>
            )}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmUpgrade} disabled={upgradeMutation.isPending} className="flex-1">
                {upgradeMutation.isPending ? 'Processing...' : 'Confirm Upgrade'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}