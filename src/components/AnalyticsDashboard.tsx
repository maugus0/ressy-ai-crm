import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import { ExpensesModal } from "./ExpensesModal";

interface AnalyticsData {
  total_calls?: number;
  total_bookings?: number;
  answer_rate?: number;
  avg_duration?: number;
  calls_over_time?: { day: string; calls: number; bookings: number }[];
  outcomes?: { intent: string; value: number }[];
  intents?: { name: string; value: number; color?: string }[];
}

interface AnalyticsDashboardProps {
  data: AnalyticsData | null;
  loading?: boolean;
  calls?: { callId: string; timestamp: string; duration: number }[];
}

const chartConfig = {
  calls: { label: "Calls", color: "hsl(var(--primary))" },
  bookings: { label: "Bookings", color: "hsl(var(--accent))" },
};

export function AnalyticsDashboard({ data, loading, calls }: AnalyticsDashboardProps) {
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);

  const useCountUp = (target: number, duration = 600) => {
    const [val, setVal] = useState(0);
    const startRef = useRef<number | null>(null);
    useEffect(() => {
      let raf = 0;
      const start = performance.now();
      startRef.current = start;
      const tick = (t: number) => {
        const elapsed = Math.min(1, (t - (startRef.current || start)) / duration);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        setVal(Math.round(target * eased));
        if (elapsed < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return val;
  };

  // fallback safe values (unconditional so hooks below are always called)
  const safeData = {
    total_calls: data?.total_calls ?? 0,
    total_bookings: data?.total_bookings ?? 0,
    answer_rate: data?.answer_rate ?? 0,
    avg_duration: data?.avg_duration ?? 0,
    calls_over_time: data?.calls_over_time ?? [],
    outcomes: data?.outcomes ?? [],
    intents: data?.intents ?? [],
  };

  const callsVal = useCountUp(safeData.total_calls);
  const bookingsVal = useCountUp(safeData.total_bookings);
  const answerRateVal = useCountUp(Math.round((safeData.answer_rate || 0) * 100));
  const avgDurVal = useCountUp(Math.round(safeData.avg_duration || 0));

  const statsData = [
    { title: "Calls", value: callsVal, subtitle: "" },
    { title: "Bookings", value: bookingsVal, subtitle: "" },
    { title: "Answer Rate", value: `${answerRateVal}%`, subtitle: "" },
    { title: "Avg. Duration", value: `${avgDurVal}s`, subtitle: "" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header with Expenses Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setIsExpensesOpen(true)}
          className="text-foreground border-border hover:bg-muted"
        >
          Expenses
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {statsData.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  {stat.title}
                </p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Volume & Bookings Chart */}
        <Card className="xl:col-span-1 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-semibold">Volume & bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {safeData.calls_over_time.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">No call data available.</div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={safeData.calls_over_time}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="calls"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive
                      animationDuration={800}
                      animationBegin={100}
                    />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive
                      animationDuration={800}
                      animationBegin={200}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Outcome by Intent Chart */}
        <Card className="xl:col-span-1 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-semibold">Outcome by intent</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {safeData.outcomes.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                No outcome data available.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeData.outcomes}>
                    <XAxis dataKey="intent" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--accent))"
                      radius={[2, 2, 0, 0]}
                      isAnimationActive
                      animationDuration={700}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Intent Breakdown Chart */}
        <Card className="xl:col-span-1 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-semibold">Intent breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {safeData.intents.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                No intent data available.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={safeData.intents}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      isAnimationActive
                      animationDuration={700}
                    >
                      {safeData.intents.map((entry, index) => (
                        <Cell key={index} fill={entry.color || "hsl(var(--primary))"} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expenses Modal */}
      <ExpensesModal
        isOpen={isExpensesOpen}
        onClose={() => setIsExpensesOpen(false)}
        calls={Array.isArray(calls) ? calls : []}
      />
    </div>
  );
}
