import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, SparklesIcon, TrendingUpIcon, ChevronRightIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { wsManager } from "@/lib/websocket";
import { useEffect } from "react";

export default function AIStrategyBuilder() {
  const [prompt, setPrompt] = useState("");
  const [activeStrategies, setActiveStrategies] = useState<any[]>([]);
  const { toast } = useToast();

  const { data: strategies } = useQuery({
    queryKey: ["/api/strategies"],
  });

  useEffect(() => {
    if (strategies && Array.isArray(strategies)) {
      setActiveStrategies(strategies.filter((s: any) => s.isActive));
    }
  }, [strategies]);

  useEffect(() => {
    // Subscribe to strategy updates
    wsManager.subscribeToStrategies((data) => {
      // Handle real-time strategy updates
      console.log("Strategy update received:", data);
    });

    return () => {
      wsManager.offMessage('strategies');
    };
  }, []);

  const generateStrategyMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/strategies/generate", { prompt });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate strategies cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({
        title: "Strategy Generated!",
        description: "Your AI strategy has been generated. Review it in the strategies section.",
      });
      setPrompt("");
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate strategy",
        variant: "destructive",
      });
    },
  });

  const handleGenerateStrategy = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please describe your trading strategy",
        variant: "destructive",
      });
      return;
    }
    generateStrategyMutation.mutate(prompt);
  };

  const examplePrompts = [
    "Buy when RSI is below 30 and sell when above 70",
    "Moving average crossover with 20 and 50 day MA",
    "Bollinger band mean reversion strategy",
    "Momentum breakout with volume confirmation"
  ];

  return (
    <Card className="bg-trading-card border-trading-border">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-500" />
          </div>
          <CardTitle className="text-lg font-semibold">AI Strategy Builder</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy Generation */}
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-300 mb-2">Quick Strategy Creation</p>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-gray-700 rounded-lg border border-gray-600 focus:border-trading-blue focus:outline-none resize-none"
            rows={3}
            placeholder="Describe your strategy in plain English..."
          />
          
          {/* Example Prompts */}
          <div className="mt-2 mb-3">
            <p className="text-xs text-gray-400 mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-1">
              {examplePrompts.map((example, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 hover:text-white h-6 px-2"
                  onClick={() => setPrompt(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerateStrategy}
            disabled={generateStrategyMutation.isPending || !prompt.trim()}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white transition-colors"
          >
            {generateStrategyMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Generating...
              </div>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 mr-2" />
                Generate Strategy
              </>
            )}
          </Button>
        </div>

        {/* Active Strategies */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Active AI Strategies</h4>
          {activeStrategies.length === 0 ? (
            <div className="p-4 bg-gray-800/30 rounded-lg text-center">
              <Bot className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No active strategies</p>
              <p className="text-xs text-gray-500">Generate your first AI strategy above</p>
            </div>
          ) : (
            activeStrategies.slice(0, 3).map((strategy) => (
              <div key={strategy.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-profit-green rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-sm font-medium">{strategy.name}</p>
                    <p className="text-xs text-gray-400">
                      Created {new Date(strategy.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-profit-green/10 text-profit-green border-profit-green/20">
                    Active
                  </Badge>
                  <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                    <ChevronRightIcon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
          
          {activeStrategies.length > 3 && (
            <Button variant="ghost" size="sm" className="w-full text-gray-400 hover:text-white">
              View All ({activeStrategies.length} strategies)
            </Button>
          )}
        </div>

        {/* Performance Summary */}
        {activeStrategies.length > 0 && (
          <div className="p-3 bg-gray-800/30 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Overall Performance</span>
              <div className="flex items-center">
                <TrendingUpIcon className="w-3 h-3 text-profit-green mr-1" />
                <span className="text-profit-green font-medium">+12.5%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
