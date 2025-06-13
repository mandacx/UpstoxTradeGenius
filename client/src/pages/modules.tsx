import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { 
  PlusIcon, 
  SettingsIcon, 
  ActivityIcon, 
  DatabaseIcon, 
  Bot, 
  ShoppingCartIcon, 
  ShieldIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  EditIcon,
  TrashIcon
} from "lucide-react";

const moduleIcons = {
  "Data Fetcher": DatabaseIcon,
  "Strategy Engine": Bot,
  "Order Manager": ShoppingCartIcon,
  "Risk Manager": ShieldIcon,
  "Portfolio Sync": ActivityIcon,
};

export default function Modules() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [moduleToToggle, setModuleToToggle] = useState<any>(null);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const { toast } = useToast();

  const { data: modules, isLoading } = useQuery({
    queryKey: ["/api/modules"],
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/modules", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Module Created",
        description: "New module has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create module",
        variant: "destructive",
      });
    },
  });

  const toggleModuleMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'start' | 'stop' }) => {
      const response = await apiRequest("POST", `/api/modules/${id}/toggle`, { action });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      setIsWarningOpen(false);
      setModuleToToggle(null);
      
      const actionText = variables.action === 'start' ? 'started' : 'stopped';
      toast({
        title: `Module ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
        description: `${moduleToToggle?.name} has been ${actionText} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update module",
        variant: "destructive",
      });
      setIsWarningOpen(false);
      setModuleToToggle(null);
    },
  });

  const handleToggleClick = (module: any, newStatus: boolean) => {
    setModuleToToggle(module);
    setIsWarningOpen(true);
  };

  const confirmToggle = () => {
    if (moduleToToggle) {
      const action = moduleToToggle.status === 'running' ? 'stop' : 'start';
      toggleModuleMutation.mutate({ id: moduleToToggle.id, action });
    }
  };

  const getModuleWarning = (module: any) => {
    const isRunning = module.status === 'running';
    if (isRunning) {
      switch (module.name) {
        case 'Data Fetcher':
          return {
            title: 'Stop Data Fetcher?',
            description: 'This will stop real-time market data collection. Active strategies may not function properly without live data. Positions and orders will not be updated automatically.',
            consequences: ['Real-time market data will stop', 'Active strategies may malfunction', 'Manual data refresh required']
          };
        case 'Strategy Engine':
          return {
            title: 'Stop Strategy Engine?',
            description: 'This will halt all automated trading strategies. Any running strategies will be stopped immediately and no new trades will be executed.',
            consequences: ['All active strategies will stop', 'No new trades will be executed', 'Open positions require manual management']
          };
        case 'Order Manager':
          return {
            title: 'Stop Order Manager?',
            description: 'This will disable order placement and management. You will not be able to place new trades or modify existing orders through the system.',
            consequences: ['New order placement disabled', 'Order modifications blocked', 'Manual trading required']
          };
        case 'Risk Manager':
          return {
            title: 'Stop Risk Manager?',
            description: 'This will disable automatic risk controls and position limits. Your account will not have automated protection against excessive losses.',
            consequences: ['Automatic risk controls disabled', 'Position limits not enforced', 'Manual risk monitoring required']
          };
        case 'Portfolio Sync':
          return {
            title: 'Stop Portfolio Sync?',
            description: 'This will stop automatic synchronization with your broker account. Portfolio values and positions may become outdated.',
            consequences: ['Portfolio data sync disabled', 'Position updates stopped', 'Manual refresh required']
          };
        default:
          return {
            title: `Stop ${module.name}?`,
            description: 'This will stop the selected module and may affect related trading functionality.',
            consequences: ['Module functionality disabled', 'Related features may be affected']
          };
      }
    } else {
      return {
        title: `Start ${module.name}?`,
        description: `This will start the ${module.name} module and enable its functionality.`,
        consequences: [`${module.name} will be activated`, 'Related features will be enabled']
      };
    }
  };

  const handleCreateModule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      status: "stopped",
      config: {
        type: formData.get("type") as string,
        settings: {},
      },
    };
    createModuleMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <CheckCircleIcon className="w-5 h-5 text-profit-green" />;
      case "error":
        return <AlertCircleIcon className="w-5 h-5 text-loss-red" />;
      default:
        return <PauseIcon className="w-5 h-5 text-yellow-500" />;
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
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-trading-card rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const modulesList = Array.isArray(modules) ? modules : [];
  const runningModules = modulesList.filter((m: any) => m.status === "running");
  const errorModules = modulesList.filter((m: any) => m.status === "error");
  const totalModules = modulesList.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Modules</h1>
          <p className="text-gray-400">Manage and monitor trading system components</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-trading-blue hover:bg-blue-600 text-white">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-trading-card border-trading-border">
            <DialogHeader>
              <DialogTitle>Create New Module</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <Label htmlFor="name">Module Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Data Fetcher"
                  required
                  className="bg-gray-700 border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="type">Module Type</Label>
                <Select name="type" required>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select module type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_fetcher">Data Fetcher</SelectItem>
                    <SelectItem value="strategy_engine">Strategy Engine</SelectItem>
                    <SelectItem value="order_manager">Order Manager</SelectItem>
                    <SelectItem value="risk_manager">Risk Manager</SelectItem>
                    <SelectItem value="portfolio_sync">Portfolio Sync</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Module description..."
                  className="bg-gray-700 border-gray-600"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createModuleMutation.isPending}
                  className="bg-trading-blue hover:bg-blue-600 text-white"
                >
                  {createModuleMutation.isPending ? "Creating..." : "Create Module"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Modules</p>
                <p className="text-2xl font-bold mt-1">{totalModules}</p>
              </div>
              <SettingsIcon className="w-8 h-8 text-trading-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Running</p>
                <p className="text-2xl font-bold mt-1 text-profit-green">{runningModules.length}</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-profit-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Errors</p>
                <p className="text-2xl font-bold mt-1 text-loss-red">{errorModules.length}</p>
              </div>
              <AlertCircleIcon className="w-8 h-8 text-loss-red" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!modules || modules.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-trading-card border-trading-border">
              <CardContent className="p-8 text-center">
                <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Modules Configured</h3>
                <p className="text-gray-400 mb-4">
                  Add your first system module to start monitoring.
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-trading-blue hover:bg-blue-600 text-white"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Module
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          modules.map((module: any) => {
            const IconComponent = moduleIcons[module.name as keyof typeof moduleIcons] || ActivityIcon;
            
            return (
              <Card key={module.id} className="bg-trading-card border-trading-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-trading-blue" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{module.name}</h3>
                        <p className="text-sm text-gray-400">{module.description}</p>
                      </div>
                    </div>
                    {getStatusIcon(module.status)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Status</span>
                      {getStatusBadge(module.status)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Last Update</span>
                      <span className="text-sm">
                        {module.lastUpdate 
                          ? new Date(module.lastUpdate).toLocaleString()
                          : "Never"
                        }
                      </span>
                    </div>

                    {module.status === "error" && module.errorMessage && (
                      <div className="p-2 bg-loss-red/10 rounded-lg">
                        <p className="text-sm text-loss-red">{module.errorMessage}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Active</span>
                        <Switch
                          checked={module.status === "running"}
                          onCheckedChange={() => handleToggleClick(module, module.status !== "running")}
                          disabled={toggleModuleMutation.isPending}
                          className="data-[state=checked]:bg-profit-green"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                          <EditIcon className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2 h-8 w-8 text-loss-red hover:text-loss-red">
                          <TrashIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Warning Dialog */}
      <AlertDialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {moduleToToggle && getModuleWarning(moduleToToggle).title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {moduleToToggle && getModuleWarning(moduleToToggle).description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {moduleToToggle && (
            <div className="my-4">
              <h4 className="text-sm font-semibold mb-2 text-foreground">Consequences:</h4>
              <ul className="space-y-1">
                {getModuleWarning(moduleToToggle).consequences.map((consequence, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full mr-2 flex-shrink-0" />
                    {consequence}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsWarningOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggle}
              disabled={toggleModuleMutation.isPending}
              className={moduleToToggle?.status === 'running' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}
            >
              {toggleModuleMutation.isPending 
                ? 'Processing...' 
                : moduleToToggle?.status === 'running' 
                  ? 'Stop Module' 
                  : 'Start Module'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
