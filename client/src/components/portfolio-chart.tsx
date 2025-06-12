import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { wsManager } from "@/lib/websocket";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PortfolioDataPoint {
  time: string;
  value: number;
}

export default function PortfolioChart() {
  const [timeframe, setTimeframe] = useState("1D");
  const [portfolioData, setPortfolioData] = useState<PortfolioDataPoint[]>([]);

  const { data: account } = useQuery({
    queryKey: ["/api/account"],
  });

  useEffect(() => {
    // Generate initial portfolio data for the chart
    const generateInitialData = () => {
      const now = new Date();
      const data: PortfolioDataPoint[] = [];
      const baseValue = 245000;
      
      // Generate data points for today (market hours: 9:15 AM to 3:30 PM)
      const marketStart = new Date(now);
      marketStart.setHours(9, 15, 0, 0);
      
      const marketEnd = new Date(now);
      marketEnd.setHours(15, 30, 0, 0);
      
      // If current time is before market start, use previous day
      if (now < marketStart) {
        marketStart.setDate(marketStart.getDate() - 1);
        marketEnd.setDate(marketEnd.getDate() - 1);
      }
      
      // Generate data points every 15 minutes
      const current = new Date(marketStart);
      let currentValue = baseValue;
      
      while (current <= marketEnd && current <= now) {
        // Simulate portfolio value changes
        const change = (Math.random() - 0.5) * 0.002; // ±0.2% change
        currentValue *= (1 + change);
        
        data.push({
          time: current.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata"
          }),
          value: Math.round(currentValue)
        });
        
        current.setMinutes(current.getMinutes() + 15);
      }
      
      return data;
    };

    setPortfolioData(generateInitialData());

    // Subscribe to real-time portfolio updates
    wsManager.subscribeToPortfolio((data) => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata"
      });
      
      if (data.account?.totalBalance) {
        setPortfolioData(prev => {
          const newData = [...prev];
          // Keep only last 50 data points for performance
          if (newData.length >= 50) {
            newData.shift();
          }
          newData.push({
            time: timeString,
            value: parseFloat(data.account.totalBalance)
          });
          return newData;
        });
      }
    });

    return () => {
      wsManager.offMessage('portfolio');
    };
  }, []);

  const chartData = {
    labels: portfolioData.map(d => d.time),
    datasets: [
      {
        label: "Portfolio Value",
        data: portfolioData.map(d => d.value),
        borderColor: "hsl(142, 76%, 36%)",
        backgroundColor: "hsla(142, 76%, 36%, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "hsl(240, 10%, 3.9%)",
        titleColor: "hsl(0, 0%, 98%)",
        bodyColor: "hsl(0, 0%, 98%)",
        borderColor: "hsl(240, 3.7%, 15.9%)",
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `₹${context.parsed.y.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: "hsl(240, 3.7%, 25.1%)",
          drawBorder: false,
        },
        ticks: {
          color: "hsl(240, 5%, 64.9%)",
          maxTicksLimit: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "hsl(240, 3.7%, 25.1%)",
          drawBorder: false,
        },
        ticks: {
          color: "hsl(240, 5%, 64.9%)",
          callback: function(value: any) {
            return "₹" + value.toLocaleString();
          },
        },
        border: {
          display: false,
        },
      },
    },
  };

  const timeframes = ["1D", "1W", "1M", "1Y"];

  return (
    <Card className="bg-trading-card border-trading-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Portfolio Performance</CardTitle>
          <div className="flex space-x-2">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className={timeframe === tf ? "bg-trading-blue text-white" : "text-gray-400 hover:text-white"}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {portfolioData.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading portfolio data...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
