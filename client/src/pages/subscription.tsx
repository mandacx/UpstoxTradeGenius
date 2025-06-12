import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CrownIcon, 
  CheckIcon, 
  CalendarIcon,
  CreditCardIcon,
  TrendingUpIcon,
  ZapIcon
} from "lucide-react";

export default function Subscription() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState("");

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/subscription/upgrade", { planId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
      period: "Forever",
      color: "bg-gray-500",
      features: [
        "5 AI-generated strategies",
        "Basic backtesting",
        "Demo trading mode",
        "Email support",
        "Basic analytics"
      ],
      limits: {
        strategies: 5,
        backtests: 10,
        tradingCapital: 0
      }
    },
    {
      id: "basic",
      name: "Basic",
      price: "₹2,999",
      period: "per month",
      color: "bg-blue-500",
      popular: false,
      features: [
        "Unlimited AI strategies",
        "Advanced backtesting",
        "Live trading (₹5L limit)",
        "Real-time data",
        "Advanced analytics",
        "Priority support"
      ],
      limits: {
        strategies: "unlimited",
        backtests: "unlimited",
        tradingCapital: 500000
      }
    },
    {
      id: "pro",
      name: "Professional",
      price: "₹7,999",
      period: "per month",
      color: "bg-purple-500",
      popular: true,
      features: [
        "Everything in Basic",
        "Unlimited trading capital",
        "Advanced risk management",
        "Custom indicators",
        "API access",
        "Dedicated support",
        "Strategy marketplace"
      ],
      limits: {
        strategies: "unlimited",
        backtests: "unlimited",
        tradingCapital: "unlimited"
      }
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      period: "Contact us",
      color: "bg-gold-500",
      features: [
        "Everything in Pro",
        "White-label solution",
        "Custom integrations",
        "On-premise deployment",
        "Dedicated account manager",
        "SLA guarantee",
        "Training & consulting"
      ],
      limits: {
        strategies: "unlimited",
        backtests: "unlimited",
        tradingCapital: "unlimited"
      }
    }
  ];

  const currentPlan = plans.find(p => p.id === user?.subscriptionPlan) || plans[0];
  const trialDaysLeft = user?.trialEndsAt ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Subscription Management</h1>
        <p className="text-gray-400">Manage your TradingPro AI subscription and billing</p>
      </div>

      {/* Current Plan */}
      <Card className="bg-trading-card border-trading-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CrownIcon className="w-5 h-5 text-yellow-500" />
            <span>Current Plan</span>
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
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Plan Features</h4>
              <div className="space-y-2">
                {currentPlan.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckIcon className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Usage Limits</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Strategies:</span>
                  <span className="text-white">{currentPlan.limits.strategies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Backtests:</span>
                  <span className="text-white">{currentPlan.limits.backtests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trading Capital:</span>
                  <span className="text-white">
                    {currentPlan.limits.tradingCapital === 0 ? "Demo only" : 
                     currentPlan.limits.tradingCapital === "unlimited" ? "Unlimited" : 
                     `₹${(currentPlan.limits.tradingCapital / 100000).toFixed(1)}L`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative transition-all duration-300 hover:scale-105 ${
                plan.id === user?.subscriptionPlan 
                  ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/50' 
                  : 'bg-trading-card border-trading-border hover:border-blue-500/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                </div>
              )}
              
              {plan.id === user?.subscriptionPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white">Current</Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-white text-center">{plan.name}</CardTitle>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{plan.price}</div>
                  <div className="text-gray-400 text-sm">{plan.period}</div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {plan.id !== user?.subscriptionPlan && (
                  <Button 
                    onClick={() => {
                      if (plan.id === "enterprise") {
                        window.open("mailto:sales@tradingpro.ai?subject=Enterprise Plan Inquiry", "_blank");
                      } else {
                        upgradeMutation.mutate(plan.id);
                      }
                    }}
                    disabled={upgradeMutation.isPending}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    {plan.id === "enterprise" ? "Contact Sales" : 
                     plan.price === "Free" ? "Downgrade" : "Upgrade"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing Information */}
      {user?.subscriptionPlan !== "demo" && (
        <Card className="bg-trading-card border-trading-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCardIcon className="w-5 h-5" />
              <span>Billing Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Next Billing Date</h4>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-white">
                    {user?.subscriptionExpiry ? 
                      new Date(user.subscriptionExpiry).toLocaleDateString() : 
                      "Not set"
                    }
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Status</h4>
                <Badge className={`${
                  user?.subscriptionStatus === "active" ? "bg-green-500/20 text-green-400" :
                  user?.subscriptionStatus === "cancelled" ? "bg-red-500/20 text-red-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {user?.subscriptionStatus?.charAt(0).toUpperCase() + user?.subscriptionStatus?.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Comparison */}
      <Card className="bg-trading-card border-trading-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ZapIcon className="w-5 h-5" />
            <span>Why Upgrade?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <TrendingUpIcon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">Live Trading</h4>
              <p className="text-gray-400 text-sm">Execute strategies with real money and authentic market data</p>
            </div>
            <div className="text-center">
              <ZapIcon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">Advanced Features</h4>
              <p className="text-gray-400 text-sm">Access premium indicators, risk management, and API integrations</p>
            </div>
            <div className="text-center">
              <CrownIcon className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">Priority Support</h4>
              <p className="text-gray-400 text-sm">Get dedicated support and faster response times</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}