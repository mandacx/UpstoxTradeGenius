import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUpIcon, EyeIcon, EyeOffIcon, CheckIcon } from "lucide-react";

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    subscriptionPlan: "demo"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account created successfully!",
        description: "Welcome to TradingPro AI. You can now start exploring.",
      });
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      setError(error.message || "Failed to create account");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.username || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    const { confirmPassword, ...signupData } = formData;
    signupMutation.mutate(signupData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const plans = [
    {
      id: "demo",
      name: "Demo",
      price: "Free",
      features: ["5 AI strategies", "Basic backtesting", "Demo trading", "Email support"]
    },
    {
      id: "basic",
      name: "Basic",
      price: "₹2,999/mo",
      features: ["Unlimited strategies", "Live trading (₹5L)", "Real-time data", "Priority support"]
    },
    {
      id: "pro",
      name: "Professional",
      price: "₹7,999/mo",
      features: ["Unlimited capital", "Advanced risk mgmt", "API access", "Dedicated support"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUpIcon className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">TradingPro AI</span>
            </div>
          </Link>
          <p className="text-gray-400">Start your AI-powered trading journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sign Up Form */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Create Account</CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert className="bg-red-500/20 border-red-500/50">
                    <AlertDescription className="text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Username *</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="johndoe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {signupMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <div className="text-center text-gray-400">
                  Already have an account?{" "}
                  <Link href="/login">
                    <span className="text-blue-400 hover:text-blue-300 cursor-pointer">
                      Sign in here
                    </span>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Plan Selection */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h3>
              <p className="text-gray-400">Start with demo mode and upgrade anytime</p>
            </div>

            <div className="space-y-4">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    formData.subscriptionPlan === plan.id
                      ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => setFormData({ ...formData, subscriptionPlan: plan.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.subscriptionPlan === plan.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-400'
                        }`}>
                          {formData.subscriptionPlan === plan.id && (
                            <CheckIcon className="w-2 h-2 text-white" />
                          )}
                        </div>
                        <h4 className="text-lg font-semibold text-white">{plan.name}</h4>
                        {plan.id === "demo" && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <div className="text-lg font-bold text-white">{plan.price}</div>
                    </div>
                    
                    <div className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckIcon className="w-3 h-3 text-green-400" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>• Demo mode includes full platform access with simulated trading</p>
              <p>• Upgrade to paid plans for live trading capabilities</p>
              <p>• All plans include real market data from Upstox</p>
              <p>• Cancel or change your plan anytime</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/">
            <Button variant="link" className="text-gray-400 hover:text-white">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}