import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { TrendingUpIcon, EyeIcon, EyeOffIcon } from "lucide-react";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: async (userData) => {
      // Store auth token and user data for session persistence
      if (userData.authToken) {
        localStorage.setItem('authToken', userData.authToken);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      
      // Invalidate auth queries and force page reload to ensure proper state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Force page reload to ensure authentication state is properly set
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="flex items-center justify-center space-x-2 mb-4 cursor-pointer">
              <TrendingUpIcon className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">TradingPro AI</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your trading account</p>
        </div>

        {/* Login Form */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername" className="text-white">Email or Username</Label>
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder="Enter your email or username"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  {...register("emailOrUsername")}
                />
                {errors.emailOrUsername && (
                  <Alert className="bg-red-500/20 border-red-500/30">
                    <AlertDescription className="text-red-300">
                      {errors.emailOrUsername.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-10"
                    {...register("password")}
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
                {errors.password && (
                  <Alert className="bg-red-500/20 border-red-500/30">
                    <AlertDescription className="text-red-300">
                      {errors.password.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Don't have an account?{" "}
                <Link href="/signup">
                  <span className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                    Sign up here
                  </span>
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="text-center">
                <h3 className="text-white font-medium mb-3">Demo Credentials</h3>
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-left">
                  <div className="text-sm space-y-1">
                    <div className="text-gray-300">
                      <span className="text-blue-300">Email:</span> demo@tradingpro.ai
                    </div>
                    <div className="text-gray-300">
                      <span className="text-blue-300">Password:</span> password
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Use these credentials to explore the demo features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}