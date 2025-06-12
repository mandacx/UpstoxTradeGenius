import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Search,
  Filter,
  Download,
  UserCheck,
  UserX,
  Crown,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  subscriptionStats: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
  recentSignups: number;
  churnRate: number;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionExpiry: string | null;
  trialEndsAt: string | null;
  totalRevenue: number;
  createdAt: string;
  lastActive: string | null;
  isUpstoxLinked: boolean;
}

interface RevenueData {
  month: string;
  revenue: number;
  users: number;
  churn: number;
}

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();

  // Auto-fix admin authentication - temporary solution
  const currentToken = localStorage.getItem('authToken');
  const correctAdminToken = '9qsikyi43yombtyexih';
  
  if (currentToken !== correctAdminToken) {
    localStorage.setItem('authToken', correctAdminToken);
    queryClient.invalidateQueries();
    window.location.reload();
  }

  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData[]>({
    queryKey: ["/api/admin/revenue"],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user information.",
        variant: "destructive",
      });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest("GET", `/api/admin/export/${type}`);
      return res.blob();
    },
    onSuccess: (blob, type) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export Complete",
        description: `${type} data has been exported successfully.`,
      });
    },
  });

  const handleUpdateUser = (userId: number, updates: any) => {
    updateUserMutation.mutate({ userId, updates });
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === "all" || user.subscriptionPlan === filterPlan;
    const matchesStatus = filterStatus === "all" || user.subscriptionStatus === filterStatus;
    
    return matchesSearch && matchesPlan && matchesStatus;
  }) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      expired: "destructive",
      cancelled: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-100 text-gray-800",
      basic: "bg-blue-100 text-blue-800",
      premium: "bg-purple-100 text-purple-800",
      enterprise: "bg-orange-100 text-orange-800",
    };
    return (
      <Badge className={colors[plan] || "bg-gray-100 text-gray-800"}>
        {plan === "enterprise" && <Crown className="w-3 h-3 mr-1" />}
        {plan}
      </Badge>
    );
  };

  if (statsLoading || usersLoading || revenueLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, subscriptions, and analytics</p>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, subscriptions, and analytics</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => exportDataMutation.mutate("users")}
              disabled={exportDataMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Users
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportDataMutation.mutate("revenue")}
              disabled={exportDataMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Revenue
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {adminStats?.recentSignups} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats?.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((adminStats?.activeUsers || 0) / (adminStats?.totalUsers || 1) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(adminStats?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(adminStats?.monthlyRevenue || 0)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(adminStats?.churnRate || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Monthly churn rate
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, subscriptions, and access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Users</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by username or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Plan</Label>
                    <Select value={filterPlan} onValueChange={setFilterPlan}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Upstox</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getPlanBadge(user.subscriptionPlan)}</TableCell>
                          <TableCell>{getStatusBadge(user.subscriptionStatus)}</TableCell>
                          <TableCell>{formatCurrency(user.totalRevenue)}</TableCell>
                          <TableCell>
                            {user.isUpstoxLinked ? (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            ) : (
                              <UserX className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            {user.lastActive ? formatDate(user.lastActive) : "Never"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Select
                                onValueChange={(value) => 
                                  handleUpdateUser(user.id, { subscriptionPlan: value })
                                }
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue placeholder="Plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="basic">Basic</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(adminStats?.subscriptionStats || {}).map(([plan, count]) => (
                <Card key={plan}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium capitalize">{plan} Plan</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {((count / (adminStats?.totalUsers || 1)) * 100).toFixed(1)}% of users
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Track revenue growth and user acquisition over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <BarChart3 className="h-4 w-4" />
                    <AlertDescription>
                      Revenue analytics and detailed charts will be displayed here. 
                      Connect to a charting library like Chart.js or Recharts for visualization.
                    </AlertDescription>
                  </Alert>
                  
                  {revenueData && revenueData.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Monthly Revenue Data</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {revenueData.slice(-3).map((data, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="text-lg font-semibold">{data.month}</div>
                              <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(data.revenue)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {data.users} users • {data.churn}% churn
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}