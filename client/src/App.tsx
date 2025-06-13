import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Positions from "@/pages/positions";
import Trades from "@/pages/trades";
import Strategies from "@/pages/strategies";
import ExclusiveStrategies from "@/pages/exclusive-strategies";
import Backtesting from "@/pages/backtesting";
import Modules from "@/pages/modules";
import Logs from "@/pages/logs";
import Account from "@/pages/account";
import Preferences from "@/pages/preferences";
import Admin from "@/pages/admin";
import Subscription from "@/pages/subscription-enhanced";
import Analytics from "@/pages/analytics";
import Learn from "@/pages/learn";
import EodReports from "@/pages/eod-reports";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";

function AuthenticatedApp() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-background">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/positions" component={Positions} />
            <Route path="/trades" component={Trades} />
            <Route path="/strategies" component={Strategies} />
            <Route path="/exclusive-strategies" component={ExclusiveStrategies} />
            <Route path="/backtesting" component={Backtesting} />
            <Route path="/modules" component={Modules} />
            <Route path="/logs" component={Logs} />
            <Route path="/account" component={Account} />
            <Route path="/preferences" component={Preferences} />
            <Route path="/subscription" component={Subscription} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/learn" component={Learn} />
            <Route path="/eod-reports" component={EodReports} />
            <Route path="/admin" component={Admin} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function UnauthenticatedApp() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route component={Landing} />
    </Switch>
  );
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading TradingPro AI...</div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
