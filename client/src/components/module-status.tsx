import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { wsManager } from "@/lib/websocket";
import { useEffect, useState } from "react";
import { 
  ActivityIcon, 
  DatabaseIcon, 
  Bot, 
  ShoppingCartIcon, 
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react";

const moduleIcons = {
  "Data Fetcher": DatabaseIcon,
  "Strategy Engine": Bot,
  "Order Manager": ShoppingCartIcon,
  "Risk Manager": ShieldIcon,
  "Portfolio Sync": ActivityIcon,
};

export default function ModuleStatus() {
  const [modules, setModules] = useState<any[]>([]);
  const { toast } = useToast();

  const { data: initialModules, isLoading } = useQuery({
    queryKey: ["/api/modules"],
  });

  useEffect(() => {
    if (initialModules) {
      setModules(initialModules);
    }
  }, [initialModules]);

  useEffect(() => {
    // Subscribe to module updates
    wsManager.subscribeToModules((data) => {
      setModules(prevModules => 
        prevModules.map(module => 
          module.id === data.id ? { ...module, ...data } : module
        )
      );
    });

    return () => {
      wsManager.offMessage('modules');
    };
  }, []);

  const toggleModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/modules/${id}/toggle`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      setModules(prevModules => 
        prevModules.map(module => 
          module.id === data.id ? data : module
        )
      );
      toast({
        title: "Module Updated",
        description: `Module has been ${data.status === "running" ? "started" : "stopped"}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle module",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <CheckCircleIcon className="w-3 h-3 text-profit-green" />;
      case "error":
        return <XCircleIcon className="w-3 h-3 text-loss-red" />;
      default:
        return <AlertTriangleIcon className="w-3 h-3 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-profit-green";
      case "error":
        return "bg-loss-red";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-profit-green/10 text-profit-green border-profit-green/20">Running</Badge>;
      case "error":
        return <Badge className="bg-loss-red/10 text-loss-red border-loss-red/20">Error</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Stopped</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-trading-card border-trading-border">
        <CardHeader>
          <CardTitle>System Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const runningCount = modules.filter(m => m.status === "running").length;
  const errorCount = modules.filter(m => m.status === "error").length;

  return (
    <Card className="bg-trading-card border-trading-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">System Modules</CardTitle>
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              errorCount > 0 ? 'bg-loss-red' : 
              runningCount === modules.length ? 'bg-profit-green' : 'bg-yellow-500'
            }`}></div>
            <span className="text-gray-400">
              {errorCount > 0 ? `${errorCount} Error${errorCount > 1 ? 's' : ''}` :
               runningCount === modules.length ? 'All Systems Operational' : 
               `${runningCount}/${modules.length} Running`}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {modules.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ActivityIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p>No modules configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((module) => {
              const IconComponent = moduleIcons[module.name as keyof typeof moduleIcons] || ActivityIcon;
              
              return (
                <div key={module.id} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(module.status)} ${
                        module.status === "running" ? "animate-pulse" : ""
                      }`}></div>
                      <IconComponent className="w-4 h-4 text-gray-400" />
                    </div>
                    <Switch
                      checked={module.status === "running"}
                      onCheckedChange={() => toggleModuleMutation.mutate(module.id)}
                      disabled={toggleModuleMutation.isPending}
                      className="data-[state=checked]:bg-profit-green"
                    />
                  </div>
                  
                  <div className="mb-2">
                    <h4 className="font-medium text-sm text-white">{module.name}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{module.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {getStatusBadge(module.status)}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Last update: {module.lastUpdate ? new Date(module.lastUpdate).toLocaleTimeString() : "Never"}
                  </div>
                  
                  {module.status === "error" && module.errorMessage && (
                    <div className="mt-2 p-2 bg-loss-red/10 rounded text-xs text-loss-red">
                      {module.errorMessage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
