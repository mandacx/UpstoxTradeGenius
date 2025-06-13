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
import { Search, Download, TrendingUp, TrendingDown, Calendar, BarChart3, ChevronUp, ChevronDown } from "lucide-react";
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
  putLow: string; // level_1
  putInt: string; // level_2
  combInt: string; // level_3
  callInt: string; // level_4
  callHigh: string; // level_5
  callLow: string; // level_6
  putHigh: string; // level_7
  unusedPc: string; // UPC
  unusedPcRev: string; // UPCR
  callOi: number;
  putOi: number;
  trendPrice1: string;
  trendPrice2: string;
  callDiff: string; // CALL_Level
  putDiff: string; // PUT_LEVEL
  combDiff: string; // COMB_LEVEL
}

export default function EodReports() {
  const [searchSymbol, setSearchSymbol] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [selectedExpiry, setSelectedExpiry] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState("50");
  const [sortField, setSortField] = useState<keyof EodPriceReport>("symbol");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc");
  const { toast } = useToast();

  // Fetch available symbols and expiry dates
  const { data: symbols } = useQuery<string[]>({
    queryKey: ["/api/eod-symbols"],
  });

  const { data: expiryDates } = useQuery<string[]>({
    queryKey: ["/api/eod-expiry-dates"],
  });

  // Fetch EOD price reports with filters
  const { data: eodData, isLoading, refetch } = useQuery<EodPriceReport[]>({
    queryKey: ["/api/eod-price-report", selectedSymbol, selectedExpiry, startDate, endDate, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSymbol && selectedSymbol !== "all") params.append("symbol", selectedSymbol);
      if (selectedExpiry && selectedExpiry !== "all") params.append("expiryDt", selectedExpiry);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (limit) params.append("limit", limit);

      const response = await fetch(`/api/eod-price-report?${params}`);
      if (!response.ok) throw new Error("Failed to fetch EOD data");
      return response.json();
    },
  });

  // Column sorting functionality
  const handleSort = (field: keyof EodPriceReport) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort and filter data
  const sortedData = eodData ? [...eodData].sort((a, b) => {
    const aValue = String(a[sortField] || '');
    const bValue = String(b[sortField] || '');
    
    // For numeric fields, parse as numbers
    if (['open', 'high', 'low', 'cmp', 'cashChg', 'callOi', 'putOi', 'trendPrice1', 'trendPrice2', 'putLow', 'putInt', 'combInt', 'callInt', 'callHigh', 'callLow', 'putHigh', 'unusedPc', 'unusedPcRev', 'callDiff', 'putDiff', 'combDiff'].includes(sortField)) {
      const aNum = parseFloat(aValue) || 0;
      const bNum = parseFloat(bValue) || 0;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    }
    
    // For string fields, use string comparison
    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  }) : [];

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
      "Symbol,Trade Date,Expiry Date,Open,High,Low,Close,Change,Level 1,Level 2,Level 3,Level 4,Level 5,Level 6,Level 7,UPC,UPCR,Call OI,Put OI,Trend Price 1,Trend Price 2,CALL Level,PUT Level,COMB Level,Index Group",
      // CSV data
      ...eodData.map(row => 
        `${row.symbol},${row.tradeDate},${row.expiryDt},${row.open},${row.high},${row.low},${row.cmp},${row.cashChg},${row.putLow},${row.putInt},${row.combInt},${row.callInt},${row.callHigh},${row.callLow},${row.putHigh},${row.unusedPc},${row.unusedPcRev},${row.callOi},${row.putOi},${row.trendPrice1},${row.trendPrice2},${row.callDiff},${row.putDiff},${row.combDiff},${row.indxGrp}`
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
              <Label htmlFor="expiry-select">Expiry Date</Label>
              <Select value={selectedExpiry} onValueChange={setSelectedExpiry}>
                <SelectTrigger>
                  <SelectValue placeholder="All expiry dates..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Expiry Dates</SelectItem>
                  {expiryDates?.map((expiry) => (
                    <SelectItem key={expiry} value={expiry}>
                      {new Date(expiry).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="overflow-x-auto border rounded-lg">
              <Table className="min-w-[2000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('symbol')} className="p-0 h-auto font-semibold">
                        Symbol
                        {sortField === 'symbol' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('tradeDate')} className="p-0 h-auto font-semibold">
                        Trade Date
                        {sortField === 'tradeDate' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('expiryDt')} className="p-0 h-auto font-semibold">
                        Expiry Date
                        {sortField === 'expiryDt' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="bg-blue-50 dark:bg-blue-900/20">
                      <Button variant="ghost" onClick={() => handleSort('open')} className="p-0 h-auto font-semibold text-blue-700 dark:text-blue-300">
                        Open
                        {sortField === 'open' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="bg-green-50 dark:bg-green-900/20">
                      <Button variant="ghost" onClick={() => handleSort('high')} className="p-0 h-auto font-semibold text-green-700 dark:text-green-300">
                        High
                        {sortField === 'high' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="bg-red-50 dark:bg-red-900/20">
                      <Button variant="ghost" onClick={() => handleSort('low')} className="p-0 h-auto font-semibold text-red-700 dark:text-red-300">
                        Low
                        {sortField === 'low' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="bg-purple-50 dark:bg-purple-900/20">
                      <Button variant="ghost" onClick={() => handleSort('cmp')} className="p-0 h-auto font-semibold text-purple-700 dark:text-purple-300">
                        Close (CMP)
                        {sortField === 'cmp' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('cashChg')} className="p-0 h-auto font-semibold">
                        Change
                        {sortField === 'cashChg' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('putLow')} className="p-0 h-auto font-semibold">
                        Level 1
                        {sortField === 'putLow' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('putInt')} className="p-0 h-auto font-semibold">
                        Level 2
                        {sortField === 'putInt' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('combInt')} className="p-0 h-auto font-semibold">
                        Level 3
                        {sortField === 'combInt' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('callInt')} className="p-0 h-auto font-semibold">
                        Level 4
                        {sortField === 'callInt' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('callHigh')} className="p-0 h-auto font-semibold">
                        Level 5
                        {sortField === 'callHigh' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('callLow')} className="p-0 h-auto font-semibold">
                        Level 6
                        {sortField === 'callLow' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('putHigh')} className="p-0 h-auto font-semibold">
                        Level 7
                        {sortField === 'putHigh' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('unusedPc')} className="p-0 h-auto font-semibold">
                        UPC
                        {sortField === 'unusedPc' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('unusedPcRev')} className="p-0 h-auto font-semibold">
                        UPCR
                        {sortField === 'unusedPcRev' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('callOi')} className="p-0 h-auto font-semibold">
                        Call OI
                        {sortField === 'callOi' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('putOi')} className="p-0 h-auto font-semibold">
                        Put OI
                        {sortField === 'putOi' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('trendPrice1')} className="p-0 h-auto font-semibold">
                        Trend Price 1
                        {sortField === 'trendPrice1' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('trendPrice2')} className="p-0 h-auto font-semibold">
                        Trend Price 2
                        {sortField === 'trendPrice2' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('callDiff')} className="p-0 h-auto font-semibold">
                        CALL Level
                        {sortField === 'callDiff' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('putDiff')} className="p-0 h-auto font-semibold">
                        PUT Level
                        {sortField === 'putDiff' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('combDiff')} className="p-0 h-auto font-semibold">
                        COMB Level
                        {sortField === 'combDiff' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('indxGrp')} className="p-0 h-auto font-semibold">
                        Index Group
                        {sortField === 'indxGrp' && (
                          sortDirection === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((row, index) => (
                    <TableRow key={`${row.symbol}-${row.expiryDt}-${row.tradeDate}-${index}`}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{row.symbol}</Badge>
                      </TableCell>
                      <TableCell>{new Date(row.tradeDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(row.expiryDt).toLocaleDateString()}</TableCell>
                      <TableCell className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold">{formatCurrency(row.open)}</TableCell>
                      <TableCell className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-semibold">{formatCurrency(row.high)}</TableCell>
                      <TableCell className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-semibold">{formatCurrency(row.low)}</TableCell>
                      <TableCell className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-semibold">{formatCurrency(row.cmp)}</TableCell>
                      <TableCell className={`font-medium flex items-center ${getPriceChangeColor(row.cashChg)}`}>
                        {getPriceChangeIcon(row.cashChg)}
                        <span className="ml-1">{formatCurrency(row.cashChg)}</span>
                      </TableCell>
                      <TableCell className="text-red-600">{formatCurrency(row.putLow)}</TableCell>
                      <TableCell className="text-orange-600">{formatCurrency(row.putInt)}</TableCell>
                      <TableCell className="text-yellow-600">{formatCurrency(row.combInt)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(row.callInt)}</TableCell>
                      <TableCell className="text-blue-600">{formatCurrency(row.callHigh)}</TableCell>
                      <TableCell className="text-indigo-600">{formatCurrency(row.callLow)}</TableCell>
                      <TableCell className="text-purple-600">{formatCurrency(row.putHigh)}</TableCell>
                      <TableCell className="text-pink-600">{formatCurrency(row.unusedPc)}</TableCell>
                      <TableCell className="text-cyan-600">{formatCurrency(row.unusedPcRev)}</TableCell>
                      <TableCell className="font-medium">{formatNumber(row.callOi)}</TableCell>
                      <TableCell className="font-medium">{formatNumber(row.putOi)}</TableCell>
                      <TableCell className="text-blue-500 font-semibold">{formatCurrency(row.trendPrice1)}</TableCell>
                      <TableCell className="text-purple-500 font-semibold">{formatCurrency(row.trendPrice2)}</TableCell>
                      <TableCell className="text-emerald-600">{formatCurrency(row.callDiff)}</TableCell>
                      <TableCell className="text-rose-600">{formatCurrency(row.putDiff)}</TableCell>
                      <TableCell className="text-amber-600">{formatCurrency(row.combDiff)}</TableCell>
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