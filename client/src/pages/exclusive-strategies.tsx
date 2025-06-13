import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, TrendingUp, Shield, Target, Clock, DollarSign, Star, Crown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertExclusiveStrategySchema, type ExclusiveStrategy, type InsertExclusiveStrategy } from "@shared/schema";
import { z } from "zod";

const formSchema = insertExclusiveStrategySchema.extend({
  expectedReturn: z.union([z.string(), z.number()]).transform((val) => typeof val === 'string' ? parseFloat(val) : val),
  maxDrawdown: z.union([z.string(), z.number()]).transform((val) => typeof val === 'string' ? parseFloat(val) : val),
  minimumCapital: z.union([z.string(), z.number()]).transform((val) => typeof val === 'string' ? parseFloat(val) : val),
  assetClasses: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

export default function ExclusiveStrategies() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ["/api/exclusive-strategies"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      overview: "",
      algorithm: "",
      riskLevel: "medium",
      expectedReturn: "",
      maxDrawdown: "",
      timeframe: "1h",
      assetClasses: [],
      parameters: {},
      isActive: true,
      isPremium: false,
      minimumCapital: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/exclusive-strategies", data);
      if (!response.ok) {
        throw new Error("Failed to create strategy");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exclusive-strategies"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Strategy Created",
        description: "Exclusive strategy has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create strategy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getTimeframeBadge = (timeframe: string) => {
    const timeframeMap: Record<string, string> = {
      "1m": "1 Minute",
      "5m": "5 Minutes", 
      "15m": "15 Minutes",
      "1h": "1 Hour",
      "1d": "1 Day"
    };
    return timeframeMap[timeframe] || timeframe;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exclusive Strategies</h1>
            <p className="text-muted-foreground">
              Proprietary algorithmic trading strategies with institutional-grade performance
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Exclusive Strategy</DialogTitle>
                <DialogDescription>
                  Design a new proprietary trading strategy with advanced algorithms
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strategy Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Alpha momentum strategy" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="riskLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select risk level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low Risk</SelectItem>
                              <SelectItem value="medium">Medium Risk</SelectItem>
                              <SelectItem value="high">High Risk</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the strategy"
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overview"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overview</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed overview of strategy mechanics and market approach"
                            className="resize-none" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="algorithm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Algorithm Code</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Strategy algorithm implementation"
                            className="resize-none font-mono text-sm" 
                            rows={6}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="expectedReturn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Return (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="15.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxDrawdown"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Drawdown (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="8.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeframe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timeframe</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1m">1 Minute</SelectItem>
                              <SelectItem value="5m">5 Minutes</SelectItem>
                              <SelectItem value="15m">15 Minutes</SelectItem>
                              <SelectItem value="1h">1 Hour</SelectItem>
                              <SelectItem value="1d">1 Day</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="minimumCapital"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Capital (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create Strategy"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Highlight Banner */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-6 text-white">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="w-6 h-6 text-yellow-300" />
              <span className="text-sm font-medium text-yellow-300">PROPRIETARY EDGE</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              A quantitative trading strategy, using advanced proprietary algorithms, offers a significant edge in the market
            </h2>
            <p className="text-blue-100 max-w-2xl">
              Leverage institutional-grade quantitative models with machine learning integration, 
              real-time market adaptation, and risk-adjusted alpha generation for superior returns.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <Zap className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* Strategies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : strategies.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Exclusive Strategies</h3>
              <p className="text-muted-foreground">
                Create your first proprietary trading strategy to get started
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Strategy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy: ExclusiveStrategy) => (
            <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {strategy.isPremium && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                    {strategy.name}
                  </CardTitle>
                  <Badge 
                    className={`text-xs ${getRiskBadgeColor(strategy.riskLevel)}`}
                    variant="secondary"
                  >
                    {strategy.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {strategy.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {strategy.overview && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {strategy.overview}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      Expected Return
                    </div>
                    <div className="font-medium">
                      {strategy.expectedReturn ? `${strategy.expectedReturn}%` : "—"}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      Max Drawdown
                    </div>
                    <div className="font-medium">
                      {strategy.maxDrawdown ? `${strategy.maxDrawdown}%` : "—"}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Timeframe
                    </div>
                    <div className="font-medium">
                      {getTimeframeBadge(strategy.timeframe)}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="w-3 h-3" />
                      Min Capital
                    </div>
                    <div className="font-medium">
                      {strategy.minimumCapital ? `₹${parseFloat(strategy.minimumCapital).toLocaleString()}` : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Badge 
                    variant={strategy.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {strategy.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}