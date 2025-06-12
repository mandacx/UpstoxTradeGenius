import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Positions from "@/pages/positions";
import Trades from "@/pages/trades";
import Strategies from "@/pages/strategies";
import Backtesting from "@/pages/backtesting";
import Modules from "@/pages/modules";
import Logs from "@/pages/logs";
import Account from "@/pages/account";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden bg-trading-dark">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/positions" component={Positions} />
            <Route path="/trades" component={Trades} />
            <Route path="/strategies" component={Strategies} />
            <Route path="/backtesting" component={Backtesting} />
            <Route path="/modules" component={Modules} />
            <Route path="/logs" component={Logs} />
            <Route path="/account" component={Account} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
