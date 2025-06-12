import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  SearchIcon, 
  FilterIcon, 
  DownloadIcon, 
  RefreshCwIcon, 
  AlertTriangleIcon, 
  InfoIcon, 
  AlertCircleIcon,
  ScrollTextIcon
} from "lucide-react";
import { LogEntry } from "@/types/trading";

export default function Logs() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["/api/logs", { level: levelFilter !== "all" ? levelFilter : undefined, module: moduleFilter !== "all" ? moduleFilter : undefined }],
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const filteredLogs = logs?.filter((log: LogEntry) => {
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) ||
                         log.module.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  }) || [];

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircleIcon className="w-4 h-4 text-loss-red" />;
      case "warn":
        return <AlertTriangleIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <InfoIcon className="w-4 h-4 text-trading-blue" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge className="bg-loss-red/10 text-loss-red border-loss-red/20">Error</Badge>;
      case "warn":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warning</Badge>;
      default:
        return <Badge className="bg-trading-blue/10 text-trading-blue border-trading-blue/20">Info</Badge>;
    }
  };

  const uniqueModules = Array.from(new Set(logs?.map((log: LogEntry) => log.module) || []));
  
  const errorCount = logs?.filter((log: LogEntry) => log.level === "error").length || 0;
  const warningCount = logs?.filter((log: LogEntry) => log.level === "warn").length || 0;
  const totalLogs = logs?.length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logs & Errors</h1>
          <p className="text-gray-400">Monitor system events and debug issues</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-profit-green/10 text-profit-green border-profit-green/20" : ""}
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Logs</p>
                <p className="text-2xl font-bold mt-1">{totalLogs}</p>
              </div>
              <ScrollTextIcon className="w-8 h-8 text-trading-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Warnings</p>
                <p className="text-2xl font-bold mt-1 text-yellow-500">{warningCount}</p>
              </div>
              <AlertTriangleIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-card border-trading-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Errors</p>
                <p className="text-2xl font-bold mt-1 text-loss-red">{errorCount}</p>
              </div>
              <AlertCircleIcon className="w-8 h-8 text-loss-red" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-trading-card border-trading-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600"
              />
            </div>
            <div className="flex gap-2">
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                  <FilterIcon className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {uniqueModules.map((module) => (
                    <SelectItem key={module} value={module}>{module}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card className="bg-trading-card border-trading-border">
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 py-2">
                    <div className="w-4 h-4 bg-gray-700 rounded"></div>
                    <div className="w-20 h-4 bg-gray-700 rounded"></div>
                    <div className="w-24 h-4 bg-gray-700 rounded"></div>
                    <div className="flex-1 h-4 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ScrollTextIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              {search || levelFilter !== "all" || moduleFilter !== "all" ? (
                <p>No logs match your filter criteria.</p>
              ) : (
                <p>No logs available. System events will appear here.</p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="p-4 space-y-1">
                {filteredLogs.map((log: LogEntry, index: number) => (
                  <div key={log.id} className="group">
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                      <div className="mt-0.5">
                        {getLevelIcon(log.level)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="text-sm font-medium text-gray-300">{log.module}</span>
                          {getLevelBadge(log.level)}
                          <span className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-200 leading-relaxed">{log.message}</p>
                        
                        {log.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                              Show Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    
                    {index < filteredLogs.length - 1 && (
                      <Separator className="bg-gray-800" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
