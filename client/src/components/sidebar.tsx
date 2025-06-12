import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  TrendingUpIcon, 
  BriefcaseIcon, 
  ArrowRightLeftIcon, 
  Bot, 
  BarChart3Icon, 
  SettingsIcon, 
  ScrollTextIcon,
  ActivityIcon,
  UserIcon
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: TrendingUpIcon },
  { name: "Positions", href: "/positions", icon: BriefcaseIcon },
  { name: "Trade History", href: "/trades", icon: ArrowRightLeftIcon },
  { name: "AI Strategies", href: "/strategies", icon: Bot },
  { name: "Backtesting", href: "/backtesting", icon: BarChart3Icon },
  { name: "Account", href: "/account", icon: UserIcon },
  { name: "Modules", href: "/modules", icon: SettingsIcon },
  { name: "Logs & Errors", href: "/logs", icon: ScrollTextIcon },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-trading-card border-r border-trading-border flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-trading-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-trading-blue rounded-lg flex items-center justify-center">
            <TrendingUpIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">UpstoxPro</h1>
            <p className="text-xs text-gray-400">Trading Dashboard</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          
          return (
            <Link key={item.name} href={item.href} className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
              isActive 
                ? "bg-trading-blue/10 text-trading-blue" 
                : "hover:bg-gray-700 text-gray-300 hover:text-white"
            )}>
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Connection Status */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-profit-green rounded-full animate-pulse"></div>
          <span className="text-gray-400">Live Market Data</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
          <ActivityIcon className="w-3 h-3" />
          <span>Connected to Upstox</span>
        </div>
      </div>
    </aside>
  );
}
