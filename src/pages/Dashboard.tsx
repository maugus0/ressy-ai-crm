/**
 * Dashboard Overview Page
 * Shows stats and analytics for the restaurant
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, CalendarDays, ShoppingBag, DollarSign, TrendingUp, Users } from "lucide-react";
import { UiOnlyNotice } from "@/components/UiOnlyNotice";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  loading?: boolean;
}

function StatCard({ title, value, description, icon, trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
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
    <Card>
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

export function Dashboard() {
  // UI-only: no backend integration yet
  const [loading] = useState(false);
  const stats = null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <UiOnlyNotice />
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your restaurant's performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Calls"
          value={stats?.total_calls ?? 0}
          description={`${stats?.calls_today ?? 0} calls today`}
          icon={<Phone className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Reservations"
          value={stats?.total_reservations ?? 0}
          description={`${stats?.reservations_today ?? 0} today`}
          icon={<CalendarDays className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Orders"
          value={stats?.total_orders ?? 0}
          description={`${stats?.orders_today ?? 0} today`}
          icon={<ShoppingBag className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Revenue"
          value={stats ? formatCurrency(stats.total_revenue) : "$0.00"}
          description="Total revenue"
          icon={<DollarSign className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest calls and reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Activity data will appear here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
            <CardDescription>Upcoming reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reservations scheduled</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Orders</CardTitle>
            <CardDescription>Orders awaiting confirmation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending orders</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
