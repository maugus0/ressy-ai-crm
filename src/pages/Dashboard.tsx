/**
 * Dashboard Overview Page
 * Shows stats and analytics for the restaurant with interactive charts
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Phone,
  CalendarDays,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Users,
  Utensils,
  Clock,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Timer,
  HelpCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  getAnalyticsOverview,
  getCallAnalytics,
  getReservationAnalytics,
  getOrderAnalytics,
  getMenuAnalytics,
  type AnalyticsOverview,
  type CallAnalytics,
  type ReservationAnalytics,
  type OrderAnalytics,
  type MenuAnalytics,
} from "@/services/analytics";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  loading?: boolean;
  className?: string;
}

function StatCard({ title, value, description, icon, trend, loading, className }: StatCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div
            className={`flex items-center text-xs mt-1 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
          >
            <TrendingUp className={`h-3 w-3 mr-1 ${!trend.isPositive && "rotate-180"}`} />
            {trend.value}% from last week
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Chart Configurations
// ============================================================================

const reservationChartConfig: ChartConfig = {
  confirmed: { label: "Confirmed", color: "hsl(142, 76%, 36%)" },
  pending: { label: "Pending", color: "hsl(48, 96%, 53%)" },
  cancelled: { label: "Cancelled", color: "hsl(0, 84%, 60%)" },
  completed: { label: "Completed", color: "hsl(221, 83%, 53%)" },
  no_show: { label: "No Show", color: "hsl(280, 68%, 60%)" },
};

const orderChartConfig: ChartConfig = {
  pending: { label: "Pending", color: "hsl(48, 96%, 53%)" },
  confirmed: { label: "Confirmed", color: "hsl(221, 83%, 53%)" },
  preparing: { label: "Preparing", color: "hsl(24, 95%, 53%)" },
  completed: { label: "Completed", color: "hsl(142, 76%, 36%)" },
  cancelled: { label: "Cancelled", color: "hsl(0, 84%, 60%)" },
};

const callTimeChartConfig: ChartConfig = {
  count: { label: "Calls", color: "hsl(221, 83%, 53%)" },
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ============================================================================
// Activity Type Badge
// ============================================================================

function ActivityBadge({ type, status }: { type: string; status: string }) {
  const getTypeColor = () => {
    switch (type) {
      case "call":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "reservation":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "order":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <Badge variant="outline" className={`${getTypeColor()} border-0`}>
      {type}
    </Badge>
  );
}

// ============================================================================
// Status Icon
// ============================================================================

function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "completed":
    case "confirmed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "cancelled":
    case "no_show":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "preparing":
    case "in_progress":
      return <Timer className="h-4 w-4 text-orange-500" />;
    default:
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export function Dashboard() {
  const { toast } = useToast();
  const { restaurantId } = useAuth();

  // State for analytics data
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [callStats, setCallStats] = useState<CallAnalytics | null>(null);
  const [reservationStats, setReservationStats] = useState<ReservationAnalytics | null>(null);
  const [orderStats, setOrderStats] = useState<OrderAnalytics | null>(null);
  const [menuStats, setMenuStats] = useState<MenuAnalytics | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format duration in seconds to readable format
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  // Format timestamp to readable format
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      }
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return timestamp;
    }
  };

  // Fetch all analytics data
  const fetchAnalytics = useCallback(
    async (showRefreshToast = false) => {
      if (!restaurantId) return;

      try {
        if (showRefreshToast) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        // Fetch all analytics in parallel
        const [overviewData, callData, reservationData, orderData, menuData] = await Promise.all([
          getAnalyticsOverview(),
          getCallAnalytics(),
          getReservationAnalytics(),
          getOrderAnalytics(),
          getMenuAnalytics(),
        ]);

        setOverview(overviewData);
        setCallStats(callData);
        setReservationStats(reservationData);
        setOrderStats(orderData);
        setMenuStats(menuData);

        if (showRefreshToast) {
          toast({
            title: "Dashboard refreshed",
            description: "Analytics data has been updated.",
          });
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        toast({
          title: "Failed to load analytics",
          description: error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [restaurantId, toast]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Prepare chart data for reservation status
  const reservationStatusData = reservationStats
    ? [
        {
          name: "Confirmed",
          value: reservationStats.confirmed_reservations,
          fill: "hsl(142, 76%, 36%)",
        },
        {
          name: "Pending",
          value: reservationStats.pending_reservations,
          fill: "hsl(48, 96%, 53%)",
        },
        {
          name: "Cancelled",
          value: reservationStats.cancelled_reservations,
          fill: "hsl(0, 84%, 60%)",
        },
        {
          name: "Completed",
          value: reservationStats.completed_reservations,
          fill: "hsl(221, 83%, 53%)",
        },
        {
          name: "No Show",
          value: reservationStats.no_show_reservations,
          fill: "hsl(280, 68%, 60%)",
        },
      ].filter((d) => d.value > 0)
    : [];

  // Prepare chart data for order status
  const orderStatusData = orderStats
    ? [
        { name: "Pending", value: orderStats.pending_orders, fill: "hsl(48, 96%, 53%)" },
        { name: "Confirmed", value: orderStats.confirmed_orders, fill: "hsl(221, 83%, 53%)" },
        { name: "Preparing", value: orderStats.preparing_orders, fill: "hsl(24, 95%, 53%)" },
        { name: "Completed", value: orderStats.completed_orders, fill: "hsl(142, 76%, 36%)" },
        { name: "Cancelled", value: orderStats.cancelled_orders, fill: "hsl(0, 84%, 60%)" },
      ].filter((d) => d.value > 0)
    : [];

  // Prepare chart data for calls by hour
  const callsByHourData =
    callStats?.time_of_day_distribution?.map((item) => ({
      hour: `${item.hour_bucket}:00`,
      count: item.count,
    })) || [];

  // Prepare chart data for calls by day of week
  const callsByDayData =
    callStats?.calls_by_day_of_week?.map((item) => ({
      day: dayNames[item.day_of_week] || `Day ${item.day_of_week}`,
      count: item.count,
    })) || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your restaurant's performance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Calls"
          value={overview?.total_calls ?? 0}
          description={`${overview?.calls_today ?? 0} calls today`}
          icon={<Phone className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Reservations"
          value={overview?.total_reservations ?? 0}
          description={`${overview?.reservations_today ?? 0} today`}
          icon={<CalendarDays className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Orders"
          value={overview?.total_orders ?? 0}
          description={`${overview?.orders_today ?? 0} today`}
          icon={<ShoppingBag className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(overview?.total_revenue ?? 0)}
          description={`${formatCurrency(overview?.revenue_today ?? 0)} today`}
          icon={<DollarSign className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Menu Items"
          value={overview?.total_menu_items ?? 0}
          description={`${overview?.available_menu_items ?? 0} available`}
          icon={<Utensils className="h-4 w-4" />}
          loading={loading}
          className="col-span-1"
        />
        <StatCard
          title="Avg Call Time"
          value={formatDuration(overview?.average_call_duration ?? 0)}
          icon={<Clock className="h-4 w-4" />}
          loading={loading}
          className="col-span-1"
        />
        <StatCard
          title="Pending Orders"
          value={overview?.pending_orders_count ?? 0}
          icon={<AlertCircle className="h-4 w-4" />}
          loading={loading}
          className="col-span-1"
        />
        <StatCard
          title="Confirmed"
          value={overview?.confirmed_reservations ?? 0}
          description="Reservations"
          icon={<CheckCircle className="h-4 w-4" />}
          loading={loading}
          className="col-span-1"
        />
        <StatCard
          title="Customers"
          value={overview?.total_customers ?? 0}
          icon={<Users className="h-4 w-4" />}
          loading={loading}
          className="col-span-1"
        />
        <StatCard
          title="FAQs"
          value={overview?.total_faqs ?? 0}
          icon={<HelpCircle className="h-4 w-4" />}
          loading={loading}
          className="col-span-1"
        />
      </div>

      {/* Analytics Charts - Tabbed View */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Recent Activity */}
            <Card className="md:col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest calls, reservations, and orders</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                ) : overview?.recent_activity && overview.recent_activity.length > 0 ? (
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-3 pr-4">
                      {overview.recent_activity.map((activity, index) => (
                        <div
                          key={`${activity.type}-${activity.id}-${index}`}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ActivityBadge type={activity.type} status={activity.status} />
                            <p className="text-sm truncate">{activity.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusIcon status={activity.status} />
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Schedule</CardTitle>
                <CardDescription>Upcoming reservations</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : overview?.todays_schedule && overview.todays_schedule.length > 0 ? (
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-3 pr-4">
                      {overview.todays_schedule.map((reservation, index) => (
                        <div
                          key={`schedule-${reservation.id}-${index}`}
                          className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{reservation.time}</span>
                            <Badge variant="outline" className="text-xs">
                              {reservation.party_size} guests
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {reservation.customer_name}
                          </p>
                          {reservation.special_request && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              Note: {reservation.special_request}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reservations today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Orders</CardTitle>
              <CardDescription>Orders awaiting confirmation</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : overview?.pending_orders && overview.pending_orders.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {overview.pending_orders.map((order, index) => (
                    <div
                      key={`pending-${order.id}-${index}`}
                      className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold">{order.order_number}</span>
                        <Badge variant="secondary">{order.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        {order.customer_name || "Guest"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{formatCurrency(order.total)}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(order.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending orders</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menu Categories */}
          {overview?.menu_categories && overview.menu_categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Menu Categories</CardTitle>
                <CardDescription>
                  {overview.menu_categories.length} categories with {overview.total_menu_items}{" "}
                  items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {overview.menu_categories.map((category, index) => (
                    <Badge key={`cat-${index}`} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Calls Tab */}
        <TabsContent value="calls" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Call Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Call Status</CardTitle>
                <CardDescription>Breakdown by status</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : callStats?.status_breakdown &&
                  Object.keys(callStats.status_breakdown).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(callStats.status_breakdown).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={status} />
                          <span className="text-sm capitalize">{status.replace(/_/g, " ")}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No call data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calls by Day of Week */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Calls by Day</CardTitle>
                <CardDescription>Weekly distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : callsByDayData.length > 0 ? (
                  <ChartContainer config={callTimeChartConfig} className="h-[200px]">
                    <BarChart data={callsByDayData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No call data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calls by Hour */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calls by Hour</CardTitle>
              <CardDescription>Time of day distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : callsByHourData.length > 0 ? (
                <ChartContainer config={callTimeChartConfig} className="h-[250px]">
                  <AreaChart data={callsByHourData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--color-count)"
                      fill="var(--color-count)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No time distribution data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Reservation Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reservation Status</CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : reservationStatusData.length > 0 ? (
                  <ChartContainer config={reservationChartConfig} className="h-[250px]">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={reservationStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {reservationStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reservation data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reservation Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reservation Stats</CardTitle>
                <CardDescription>Detailed breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : reservationStats ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Total Reservations</span>
                      <span className="font-bold text-lg">
                        {reservationStats.total_reservations}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <span className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Confirmed
                      </span>
                      <span className="font-medium">{reservationStats.confirmed_reservations}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <span className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" /> Pending
                      </span>
                      <span className="font-medium">{reservationStats.pending_reservations}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <span className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" /> Completed
                      </span>
                      <span className="font-medium">{reservationStats.completed_reservations}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                      <span className="text-sm flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" /> Cancelled
                      </span>
                      <span className="font-medium">{reservationStats.cancelled_reservations}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reservation data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Order Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Status</CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : orderStatusData.length > 0 ? (
                  <ChartContainer config={orderChartConfig} className="h-[250px]">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={orderStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No order data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Stats</CardTitle>
                <CardDescription>Detailed breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : orderStats ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Total Orders</span>
                      <span className="font-bold text-lg">{orderStats.total_orders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm">Total Revenue</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(orderStats.total_revenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <span className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" /> Pending
                      </span>
                      <span className="font-medium">{orderStats.pending_orders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                      <span className="text-sm flex items-center gap-2">
                        <Timer className="h-4 w-4 text-orange-500" /> Preparing
                      </span>
                      <span className="font-medium">{orderStats.preparing_orders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <span className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Completed
                      </span>
                      <span className="font-medium">{orderStats.completed_orders}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No order data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue Summary</CardTitle>
              <CardDescription>Today vs Total</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-4 grid-cols-2">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : orderStats ? (
                <div className="grid gap-4 grid-cols-2">
                  <div className="p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Today's Revenue</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(orderStats.revenue_today)}
                    </p>
                  </div>
                  <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(orderStats.total_revenue)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No revenue data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Dashboard;
