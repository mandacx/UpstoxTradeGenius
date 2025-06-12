import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUpIcon, 
  BarChart3Icon, 
  BrainCircuitIcon, 
  ShieldCheckIcon,
  ZapIcon,
  CheckIcon,
  ArrowRightIcon,
  PlayIcon,
  StarIcon
} from "lucide-react";

export default function Landing() {
  const [selectedPlan, setSelectedPlan] = useState("demo");

  const features = [
    {
      icon: <BrainCircuitIcon className="w-6 h-6" />,
      title: "AI-Powered Strategies",
      description: "Generate trading strategies using advanced AI with simple English descriptions"
    },
    {
      icon: <BarChart3Icon className="w-6 h-6" />,
      title: "Real-Time Backtesting",
      description: "Test strategies with authentic Upstox market data and comprehensive analytics"
    },
    {
      icon: <TrendingUpIcon className="w-6 h-6" />,
      title: "Live Trading",
      description: "Execute strategies automatically with real-time market monitoring"
    },
    {
      icon: <ShieldCheckIcon className="w-6 h-6" />,
      title: "Risk Management",
      description: "Built-in position sizing, stop-losses, and portfolio protection"
    },
    {
      icon: <ZapIcon className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Sub-second execution with professional-grade infrastructure"
    },
    {
      icon: <BarChart3Icon className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Detailed performance metrics, drawdown analysis, and trade insights"
    }
  ];

  const plans = [
    {
      id: "demo",
      name: "Demo",
      price: "Free",
      period: "Forever",
      badge: "Most Popular",
      features: [
        "5 AI-generated strategies",
        "Basic backtesting",
        "Demo trading mode",
        "Email support",
        "Basic analytics"
      ],
      limitations: [
        "No live trading",
        "Limited historical data",
        "Standard support"
      ]
    },
    {
      id: "basic",
      name: "Basic",
      price: "₹2,999",
      period: "per month",
      features: [
        "Unlimited AI strategies",
        "Advanced backtesting",
        "Live trading (₹5L limit)",
        "Real-time data",
        "Advanced analytics",
        "Priority support"
      ],
      limitations: [
        "₹5 Lakh trading limit",
        "Basic risk management"
      ]
    },
    {
      id: "pro",
      name: "Professional",
      price: "₹7,999",
      period: "per month",
      badge: "Best Value",
      features: [
        "Everything in Basic",
        "Unlimited trading capital",
        "Advanced risk management",
        "Custom indicators",
        "API access",
        "Dedicated support",
        "Strategy marketplace"
      ],
      limitations: []
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      period: "Contact us",
      features: [
        "Everything in Pro",
        "White-label solution",
        "Custom integrations",
        "On-premise deployment",
        "Dedicated account manager",
        "SLA guarantee",
        "Training & consulting"
      ],
      limitations: []
    }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Day Trader",
      content: "Increased my trading accuracy by 40% using AI strategies. The backtesting is incredibly detailed.",
      rating: 5
    },
    {
      name: "Priya Sharma",
      role: "Portfolio Manager",
      content: "The risk management features saved me from major losses during market volatility.",
      rating: 5
    },
    {
      name: "Amit Patel",
      role: "Algo Trader",
      content: "Best platform for systematic trading in India. The Upstox integration is seamless.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <TrendingUpIcon className="w-8 h-8 text-blue-400" />
              <span className="text-xl font-bold text-white">TradingPro AI</span>
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
            🚀 Now with Real Upstox Integration
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            AI-Powered Trading
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Made Simple
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Generate winning trading strategies with AI, backtest with real market data, 
            and execute trades automatically. Join thousands of traders already using our platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                Start Free Demo
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg">
              <PlayIcon className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">₹500Cr+</div>
              <div className="text-gray-400">Trading Volume</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">10,000+</div>
              <div className="text-gray-400">Active Traders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">85%</div>
              <div className="text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Trade Successfully
            </h2>
            <p className="text-xl text-gray-300">
              Professional-grade tools designed for Indian markets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Choose Your Trading Plan
            </h2>
            <p className="text-xl text-gray-300">
              Start free, upgrade when you're ready to scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative bg-white/5 border-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  plan.badge ? 'ring-2 ring-blue-500/50' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">{plan.badge}</Badge>
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl text-white text-center">{plan.name}</CardTitle>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{plan.price}</div>
                    <div className="text-gray-400">{plan.period}</div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckIcon className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {plan.limitations.length > 0 && (
                    <div className="border-t border-white/10 pt-4 space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-4 h-4 text-gray-500">•</div>
                          <span className="text-gray-500 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Link href="/signup">
                    <Button 
                      className={`w-full mt-6 ${
                        plan.badge 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      }`}
                    >
                      {plan.price === "Free" ? "Start Demo" : "Choose Plan"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Trusted by Traders Across India
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of successful traders using AI-powered strategies
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg">
              Start Your Free Demo Today
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-black/40 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUpIcon className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold text-white">TradingPro AI</span>
              </div>
              <p className="text-gray-400">
                India's leading AI-powered trading platform
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-2">
                <div className="text-gray-400">Features</div>
                <div className="text-gray-400">Pricing</div>
                <div className="text-gray-400">API</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <div className="text-gray-400">Documentation</div>
                <div className="text-gray-400">Contact</div>
                <div className="text-gray-400">Help Center</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <div className="text-gray-400">Privacy Policy</div>
                <div className="text-gray-400">Terms of Service</div>
                <div className="text-gray-400">Risk Disclosure</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 TradingPro AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}