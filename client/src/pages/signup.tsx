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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { TrendingUpIcon, EyeIcon, EyeOffIcon, CheckIcon } from "lucide-react";

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const termsChecked = watch("terms");

  const signupMutation = useMutation({
    mutationFn: async (data: Omit<SignupFormData, "confirmPassword" | "terms">) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome to TradingPro AI!",
        description: "Your account has been created successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupFormData) => {
    const { confirmPassword, terms, ...signupData } = data;
    signupMutation.mutate(signupData);
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
          <h1 className="text-3xl font-bold text-white mb-2">Join TradingPro AI</h1>
          <p className="text-gray-400">Create your account and start trading with AI</p>
        </div>

        {/* Signup Form */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  {...register("username")}
                />
                {errors.username && (
                  <Alert className="bg-red-500/20 border-red-500/30">
                    <AlertDescription className="text-red-300">
                      {errors.username.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  {...register("email")}
                />
                {errors.email && (
                  <Alert className="bg-red-500/20 border-red-500/30">
                    <AlertDescription className="text-red-300">
                      {errors.email.message}
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
                    placeholder="Create a password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-10"
                    {...register("confirmPassword")}
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
                {errors.confirmPassword && (
                  <Alert className="bg-red-500/20 border-red-500/30">
                    <AlertDescription className="text-red-300">
                      {errors.confirmPassword.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsChecked}
                    onCheckedChange={(checked) => setValue("terms", !!checked)}
                    className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-1"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm text-gray-300 leading-relaxed cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link href="/terms">
                      <span className="text-blue-400 hover:text-blue-300 underline">
                        Terms of Service
                      </span>
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy">
                      <span className="text-blue-400 hover:text-blue-300 underline">
                        Privacy Policy
                      </span>
                    </Link>
                  </Label>
                </div>
                {errors.terms && (
                  <Alert className="bg-red-500/20 border-red-500/30">
                    <AlertDescription className="text-red-300">
                      {errors.terms.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {signupMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <Link href="/login">
                  <span className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                    Sign in here
                  </span>
                </Link>
              </p>
            </div>

            {/* Features Preview */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="text-center mb-4">
                <h3 className="text-white font-medium">What you'll get:</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckIcon className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">30-day free trial</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckIcon className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">5 AI-generated strategies</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckIcon className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Advanced backtesting tools</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckIcon className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Demo trading environment</span>
                </div>
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