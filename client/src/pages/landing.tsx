import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  TrendingUpIcon, 
  BrainCircuitIcon, 
  BarChart3Icon, 
  ShieldCheckIcon,
  ZapIcon,
  StarIcon,
  CheckIcon,
  ArrowRightIcon
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUpIcon className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">TradingPro AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 mb-6">
            🚀 AI-Powered Trading Platform
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Master the Markets with{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Artificial Intelligence
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform your trading with AI-generated strategies, advanced backtesting, 
            and real-time market insights. Join thousands of successful traders.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See Features
            </Button>
          </div>
          
          <div className="mt-12 flex items-center justify-center space-x-8 text-gray-400">
            <div className="flex items-center space-x-1">
              <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
              <span>4.9/5 Rating</span>
            </div>
            <div>10,000+ Active Traders</div>
            <div>₹50Cr+ Trading Volume</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">Powerful Features</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Everything you need to succeed in the markets, powered by cutting-edge AI technology
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
            <CardHeader>
              <BrainCircuitIcon className="w-12 h-12 text-blue-400 mb-4" />
              <CardTitle className="text-white">AI Strategy Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Generate sophisticated trading strategies using advanced AI algorithms. 
                Simply describe your trading goals and let AI create optimized strategies.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
            <CardHeader>
              <BarChart3Icon className="w-12 h-12 text-purple-400 mb-4" />
              <CardTitle className="text-white">Advanced Backtesting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Test your strategies against historical data with advanced metrics like 
                Sharpe ratio, max drawdown, and win rate to validate performance.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
            <CardHeader>
              <TrendingUpIcon className="w-12 h-12 text-green-400 mb-4" />
              <CardTitle className="text-white">Real-Time Trading</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Execute strategies with real money using integrated Upstox API. 
                Monitor positions, trades, and performance in real-time.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
            <CardHeader>
              <ShieldCheckIcon className="w-12 h-12 text-yellow-400 mb-4" />
              <CardTitle className="text-white">Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Built-in risk management tools including stop-loss, position sizing, 
                and portfolio allocation to protect your capital.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
            <CardHeader>
              <ZapIcon className="w-12 h-12 text-red-400 mb-4" />
              <CardTitle className="text-white">Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Ultra-low latency execution and real-time data processing ensure 
                you never miss an opportunity in fast-moving markets.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
            <CardHeader>
              <BarChart3Icon className="w-12 h-12 text-indigo-400 mb-4" />
              <CardTitle className="text-white">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Comprehensive analytics dashboard with detailed performance metrics, 
                trade analysis, and portfolio insights.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">Simple Pricing</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-white">Demo</CardTitle>
              <div className="text-4xl font-bold text-white mt-4">Free</div>
              <div className="text-gray-400">Forever</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">5 AI-generated strategies</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Basic backtesting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Demo trading mode</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Email support</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-500/10 border-blue-500/30 backdrop-blur-sm relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white">Most Popular</Badge>
            </div>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-white">Basic</CardTitle>
              <div className="text-4xl font-bold text-white mt-4">₹2,999</div>
              <div className="text-gray-400">per month</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Unlimited AI strategies</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Advanced backtesting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Live trading (₹5L limit)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Real-time data</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Priority support</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Start Free Trial
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-white">Professional</CardTitle>
              <div className="text-4xl font-bold text-white mt-4">₹7,999</div>
              <div className="text-gray-400">per month</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Everything in Basic</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Unlimited trading capital</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Advanced risk management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">API access</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Dedicated support</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Upgrade Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of successful traders who are already using AI to 
            maximize their profits and minimize risks.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
              Start Your Free Trial Today
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <div className="mt-6 text-blue-100 text-sm">
            No credit card required • 30-day free trial • Cancel anytime
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUpIcon className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-semibold text-white">TradingPro AI</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 TradingPro AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}