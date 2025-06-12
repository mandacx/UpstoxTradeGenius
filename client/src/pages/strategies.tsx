import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { PlusIcon, Bot, PlayIcon, PauseIcon, EditIcon, TrashIcon } from "lucide-react";

export default function Strategies() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const { toast } = useToast();

  const { data: strategies, isLoading } = useQuery({
    queryKey: ["/api/strategies"],
  });

  const createStrategyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/strategies", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Strategy Created",
        description: "Your strategy has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create strategy",
        variant: "destructive",
      });
    },
  });

  const generateStrategyMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/strategies/generate", { prompt });
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedStrategy(data);
      toast({
        title: "Strategy Generated",
        description: "AI has generated your strategy. Review and save it.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate strategy",
        variant: "destructive",
      });
    },
  });

  const toggleStrategyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PUT", `/api/strategies/${id}/toggle`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({
        title: "Strategy Updated",
        description: "Strategy status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update strategy",
        variant: "destructive",
      });
    },
  });

  const handleCreateStrategy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      code: selectedStrategy?.code || formData.get("code") as string,
      parameters: selectedStrategy?.parameters || {},
    };
    createStrategyMutation.mutate(data);
  };

  const handleGenerateStrategy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const prompt = formData.get("prompt") as string;
    generateStrategyMutation.mutate(prompt);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-trading-card rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const activeStrategies = strategies?.filter((s: any) => s.isActive) || [];
  const totalStrategies = strategies?.length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Trading Strategies</h1>
          <p className="text-gray-400">Create and manage your automated trading strategies</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-trading-blue hover:bg-blue-600 text-white">
              <PlusIcon className="w-4 h-4 mr-2" />
              New Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-trading-card border-trading-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Strategy</DialogTitle>
            </DialogHeader>
            
            {/* AI Strategy Generator */}
            <div className="space-y-4">
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h4 className="font-medium mb-2 flex items-center">
                  <Bot className="w-4 h-4 mr-2 text-purple-500" />
                  AI Strategy Generator
                </h4>
                <form onSubmit={handleGenerateStrategy} className="space-y-3">
                  <Textarea
                    name="prompt"
                    placeholder="Describe your strategy in plain English (e.g., 'Buy when RSI is below 30 and sell when it's above 70')"
                    className="bg-gray-700 border-gray-600"
                    rows={3}
                  />
                  <Button
                    type="submit"
                    disabled={generateStrategyMutation.isPending}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    {generateStrategyMutation.isPending ? "Generating..." : "Generate Strategy"}
                  </Button>
                </form>
              </div>

              {/* Strategy Form */}
              <form onSubmit={handleCreateStrategy} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Strategy Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={selectedStrategy?.name || ""}
                      required
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      defaultValue={selectedStrategy?.description || ""}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="code">Strategy Code</Label>
                  <Textarea
                    id="code"
                    name="code"
                    value={selectedStrategy?.code || ""}
                    onChange={(e) => setSelectedStrategy({ ...selectedStrategy, code: e.target.value })}
                    placeholder="Enter your strategy code here..."
                    className="bg-gray-700 border-gray-600 font-mono text-sm"
                    rows={10}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setSelectedStrategy(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createStrategyMutation.isPending}
                    className="bg-trading-blue hover:bg-blue-600 text-white"
                  >
                    {createStrategyMutation.isPending ? "Creating..." : "Create Strategy"}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div>
              <p className="text-gray-400 text-sm">Total Strategies</p>
              <p className="text-2xl font-bold mt-1">{totalStrategies}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div>
              <p className="text-gray-400 text-sm">Active Strategies</p>
              <p className="text-2xl font-bold mt-1 text-profit-green">{activeStrategies.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div>
              <p className="text-gray-400 text-sm">Performance</p>
              <p className="text-2xl font-bold mt-1 text-profit-green">+12.5%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategies List */}
      <div className="grid grid-cols-1 gap-4">
        {!strategies || strategies.length === 0 ? (
          <Card className="bg-trading-card border-trading-border">
            <CardContent className="p-8 text-center">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Strategies Yet</h3>
              <p className="text-gray-400 mb-4">
                Create your first AI-powered trading strategy to get started.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-trading-blue hover:bg-blue-600 text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Strategy
              </Button>
            </CardContent>
          </Card>
        ) : (
          strategies.map((strategy: any) => (
            <Card key={strategy.id} className="bg-trading-card border-trading-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{strategy.name}</h3>
                      <Badge variant={strategy.isActive ? "default" : "secondary"}>
                        {strategy.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{strategy.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Created: {new Date(strategy.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(strategy.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStrategyMutation.mutate(strategy.id)}
                      disabled={toggleStrategyMutation.isPending}
                    >
                      {strategy.isActive ? (
                        <PauseIcon className="w-4 h-4" />
                      ) : (
                        <PlayIcon className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-loss-red hover:text-loss-red">
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
