import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, TrendingUp, TrendingDown, Calendar, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EodPriceReport {
  symbol: string;
  expiryDt: string;
  tradeDate: string;
  open: string;
  high: string;
  low: string;
  cmp: string;
  cashChg: string;
  indxGrp: string;
  indxWtg: string;
  putInt: string;
  callInt: string;
  combInt: string;
  callOi: number;
  putOi: number;
  trendPrice1: string;
  trendPrice2: string;
}

export default function EodReports() {
  const [searchSymbol, setSearchSymbol] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState("50");
  const { toast } = useToast();

  // Fetch available symbols
  const { data: symbols } = useQuery<string[]>({
    queryKey: ["/api/eod-symbols"],
  });

  // Fetch EOD price reports with filters
  const { data: eodData, isLoading, refetch } = useQuery<EodPriceReport[]>({
    queryKey: ["/api/eod-price-report", selectedSymbol, startDate, endDate, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSymbol && selectedSymbol !== "all") params.append("symbol", selectedSymbol);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (limit) params.append("limit", limit);

      const response = await fetch(`/api/eod-price-report?${params}`);
      if (!response.ok) throw new Error("Failed to fetch EOD data");
      return response.json();
    },
  });

  const handleSearch = () => {
    if (searchSymbol && symbols?.includes(searchSymbol.toUpperCase())) {
      setSelectedSymbol(searchSymbol.toUpperCase());
    } else if (searchSymbol) {
      toast({
        title: "Symbol not found",
        description: `Symbol "${searchSymbol}" is not available in the database.`,
        variant: "destructive",
      });
    }
    refetch();
  };

  const handleExport = () => {
    if (!eodData || eodData.length === 0) {
      toast({
        title: "No data to export",
        description: "Please filter some data first.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      // CSV header
      "Symbol,Expiry Date,Trade Date,Open,High,Low,CMP,Cash Change,Index Group,Index Weight,Put Interest,Call Interest,Combined Interest,Call OI,Put OI,Trend Price 1,Trend Price 2",
      // CSV data
      ...eodData.map(row => 
        `${row.symbol},${row.expiryDt},${row.tradeDate},${row.open},${row.high},${row.low},${row.cmp},${row.cashChg},${row.indxGrp},${row.indxWtg},${row.putInt},${row.callInt},${row.combInt},${row.callOi},${row.putOi},${row.trendPrice1},${row.trendPrice2}`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eod-report-${selectedSymbol || "all"}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "EOD report has been downloaded as CSV file.",
    });
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "N/A";
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatNumber = (value: string | number | null) => {
    if (!value) return "N/A";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getPriceChangeColor = (change: string | null) => {
    if (!change) return "text-gray-400";
    const num = parseFloat(change);
    return num > 0 ? "text-green-500" : num < 0 ? "text-red-500" : "text-gray-400";
  };

  const getPriceChangeIcon = (change: string | null) => {
    if (!change) return null;
    const num = parseFloat(change);
    return num > 0 ? <TrendingUp className="w-4 h-4" /> : num < 0 ? <TrendingDown className="w-4 h-4" /> : null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">EOD Price Reports</h1>
          <p className="text-muted-foreground">
            End-of-day financial data with options insights and technical indicators
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Symbols</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{symbols?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available trading symbols
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7,420</div>
            <p className="text-xs text-muted-foreground">
              Historical price records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14 Days</div>
            <p className="text-xs text-muted-foreground">
              May 30 - Jun 13, 2025
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eodData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Current query results
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Data Filters</CardTitle>
          <CardDescription>
            Filter EOD price reports by symbol, date range, and result limit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <div className="flex space-x-2">
                <Input
                  id="symbol"
                  placeholder="Enter symbol..."
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol-select">Or Select Symbol</Label>
              <Select value={selectedSymbol} onValueChange={(value) => {
                setSelectedSymbol(value);
                setSearchSymbol(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose symbol..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Symbols</SelectItem>
                  {symbols?.map((symbol) => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Results Limit</Label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 records</SelectItem>
                  <SelectItem value="50">50 records</SelectItem>
                  <SelectItem value="100">100 records</SelectItem>
                  <SelectItem value="250">250 records</SelectItem>
                  <SelectItem value="500">500 records</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>EOD Price Data</CardTitle>
          <CardDescription>
            Historical end-of-day pricing with options data and technical indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : eodData && eodData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Trade Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Open</TableHead>
                    <TableHead>High</TableHead>
                    <TableHead>Low</TableHead>
                    <TableHead>CMP</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Call OI</TableHead>
                    <TableHead>Put OI</TableHead>
                    <TableHead>Index Group</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eodData.map((row, index) => (
                    <TableRow key={`${row.symbol}-${row.expiryDt}-${row.tradeDate}-${index}`}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{row.symbol}</Badge>
                      </TableCell>
                      <TableCell>{new Date(row.tradeDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(row.expiryDt).toLocaleDateString()}</TableCell>
                      <TableCell>{formatCurrency(row.open)}</TableCell>
                      <TableCell className="text-green-500">{formatCurrency(row.high)}</TableCell>
                      <TableCell className="text-red-500">{formatCurrency(row.low)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(row.cmp)}</TableCell>
                      <TableCell className={getPriceChangeColor(row.cashChg)}>
                        <div className="flex items-center space-x-1">
                          {getPriceChangeIcon(row.cashChg)}
                          <span>{formatCurrency(row.cashChg)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(row.callOi)}</TableCell>
                      <TableCell>{formatNumber(row.putOi)}</TableCell>
                      <TableCell>
                        {row.indxGrp && (
                          <Badge variant="secondary">{row.indxGrp}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No EOD data found for the selected criteria.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or selecting a different symbol.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}