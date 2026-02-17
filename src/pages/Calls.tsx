/**
 * Calls Page (Client Dashboard)
 * View call history, transcripts, and analytics
 * Auto-scoped to the authenticated restaurant via JWT token
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  FileText,
  Search,
  Filter,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Calendar,
  XCircle,
  RefreshCw,
  Bot,
  User,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useSSE } from "@/contexts/SSEContext";
import {
  formatLocalDateTimeParts,
  getLocalTimeComponents,
  parseApiDate,
} from "@/lib/utils/timezone";
import {
  getCalls,
  getCallDetails,
  searchCalls,
  exportCalls,
  downloadCallsCSV,
  type ClientCallListItem,
  type ClientCallDetails,
  type ClientCallAnalyticsResponse,
  type ClientCallListParams,
} from "@/services/calls";

// ============================================================================
// Helper Functions
// ============================================================================

const formatDuration = (seconds: number): string => {
  if (seconds === 0) return "0:00";
  // Round to whole seconds for more accurate display
  const wholeSeconds = Math.round(seconds);
  const mins = Math.floor(wholeSeconds / 60);
  const secs = wholeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatDateTime = (dateTime: string) => {
  return formatLocalDateTimeParts(dateTime);
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "default" as const;
    case "missed":
      return "destructive" as const;
    case "in-progress":
    case "in_progress":
      return "secondary" as const;
    case "failed":
      return "destructive" as const;
    case "abandoned":
      return "outline" as const;
    default:
      return "outline" as const;
  }
};

/**
 * Get day name from day of week number
 *
 * Note: The API returns day_of_week in ISO format (1-7 where 1=Monday, 7=Sunday)
 * This function handles both ISO format (1-7) and JS/Python-style (0-6) for robustness
 *
 * @param dayOfWeek - Day of week number (ISO: 1-7, or JS-style: 0-6)
 * @returns Day name string (e.g., "Monday", "Tuesday")
 */
const getDayName = (dayOfWeek: number): string => {
  // ISO format: 1..7 (Mon..Sun) - this is what the API returns
  if (dayOfWeek >= 1 && dayOfWeek <= 7) {
    const isoDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return isoDays[dayOfWeek - 1] || `Day ${dayOfWeek}`;
  }

  // Fallback for JS/Python-style: 0..6 (Sun..Sat) - for edge cases
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || `Day ${dayOfWeek}`;
};

const getDaySortKeyMonFirst = (dayOfWeek: number): number => {
  // Normalize to 0..6 where 0=Monday ... 6=Sunday
  // ISO: 1..7 (Mon..Sun) => 0..6
  if (dayOfWeek >= 1 && dayOfWeek <= 7) return dayOfWeek - 1;
  // JS/Python-style: 0..6 (Sun..Sat) => Mon-first
  // Sunday(0)->6, Monday(1)->0, ..., Saturday(6)->5
  return (dayOfWeek + 6) % 7;
};

const formatCost = (cost: number | null | undefined): string => {
  if (cost === null || cost === undefined) return "-";
  return `$${cost.toFixed(4)}`;
};

// ============================================================================
// Component
// ============================================================================

export function Calls() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Calls state
  const [calls, setCalls] = useState<ClientCallListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've processed call_id from URL (deep-link from notifications)
  const hasProcessedCallIdParam = useRef(false);

  // Analytics state - computed from calls data
  const [analyticsCalls, setAnalyticsCalls] = useState<ClientCallListItem[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [callerPhoneSearch, setCallerPhoneSearch] = useState("");
  const [debouncedCallerPhone, setDebouncedCallerPhone] = useState("");
  const [durationMin, setDurationMin] = useState<string>("");
  const [durationMax, setDurationMax] = useState<string>("");
  const [sortBy, setSortBy] = useState<ClientCallListParams["sort_by"]>("created_at");
  const [sortOrder, setSortOrder] = useState<ClientCallListParams["sort_order"]>("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Search state (for transcript/phone search)
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Dialog state
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<ClientCallDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Debounce refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Fetch Functions
  // ============================================================================

  const fetchCalls = useCallback(async () => {
    try {
      setIsLoadingCalls(true);
      setError(null);

      // If in search mode, use search API
      if (isSearchMode && searchQuery.trim()) {
        const data = await searchCalls({
          q: searchQuery.trim(),
          date_from: startDate || undefined,
          date_to: endDate || undefined,
          page,
          limit,
          sort_by: sortBy,
          sort_order: sortOrder,
        });
        setCalls(data.items);
        setTotal(data.total);
        return;
      }

      // Regular list with filters
      const params: ClientCallListParams = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (statusFilter !== "all") params.status = statusFilter;
      if (startDate) params.date_from = startDate;
      if (endDate) params.date_to = endDate;
      if (debouncedCallerPhone) params.caller_phone = debouncedCallerPhone;
      if (durationMin) params.duration_min = parseInt(durationMin);
      if (durationMax) params.duration_max = parseInt(durationMax);

      const data = await getCalls(params);
      setCalls(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calls");
      setCalls([]);
      setTotal(0);
    } finally {
      setIsLoadingCalls(false);
    }
  }, [
    page,
    limit,
    sortBy,
    sortOrder,
    statusFilter,
    startDate,
    endDate,
    debouncedCallerPhone,
    durationMin,
    durationMax,
    isSearchMode,
    searchQuery,
  ]);

  // Fetch all calls for analytics computation (with max limit of 200)
  const fetchAnalyticsCalls = useCallback(async () => {
    try {
      setIsLoadingAnalytics(true);

      const params: ClientCallListParams = {
        page: 1,
        limit: 200, // API max limit is 200
        sort_by: "created_at",
        sort_order: "desc",
      };

      // Only apply filters that are explicitly set by the user
      // If no date filters are set, don't apply them - get all calls matching other filters
      if (statusFilter !== "all") params.status = statusFilter;
      if (startDate) params.date_from = startDate;
      if (endDate) params.date_to = endDate;
      if (durationMin) params.duration_min = parseInt(durationMin);
      if (durationMax) params.duration_max = parseInt(durationMax);

      const data = await getCalls(params);
      setAnalyticsCalls(data.items);
    } catch (err) {
      console.error("Failed to load analytics calls:", err);
      setAnalyticsCalls([]);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [statusFilter, startDate, endDate, durationMin, durationMax]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Debounce caller phone search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedCallerPhone(callerPhoneSearch);
      setPage(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [callerPhoneSearch]);

  // Debounce search query (for transcript search)
  useEffect(() => {
    if (queryTimeoutRef.current) {
      clearTimeout(queryTimeoutRef.current);
    }

    queryTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearchMode(true);
      } else {
        setIsSearchMode(false);
      }
      setPage(1);
    }, 500);

    return () => {
      if (queryTimeoutRef.current) {
        clearTimeout(queryTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch calls when filters change
  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    fetchAnalyticsCalls();
  }, [fetchAnalyticsCalls]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, startDate, endDate, durationMin, durationMax]);

  // SSE Integration: Auto-refresh on escalation events (escalations are call-related)
  const { escalations } = useSSE();
  const lastEscalationEventRef = useRef<string | null>(null);
  const hasInitialLoadRef = useRef(false);

  useEffect(() => {
    // Mark as loaded after first fetch
    if (calls.length > 0 || !isLoadingCalls) {
      hasInitialLoadRef.current = true;
    }
  }, [calls.length, isLoadingCalls]);

  useEffect(() => {
    // Only refresh if we have new escalation events since last check and initial load is complete
    if (escalations.length > 0 && hasInitialLoadRef.current) {
      const latestEventId = escalations[0].id;
      if (lastEscalationEventRef.current !== latestEventId) {
        lastEscalationEventRef.current = latestEventId;
        console.log("SSE: Escalation event received, refreshing calls...");
        fetchCalls();
        fetchAnalyticsCalls();
      }
    }
  }, [escalations, fetchCalls, fetchAnalyticsCalls]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleClearFilters = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setCallerPhoneSearch("");
    setDebouncedCallerPhone("");
    setDurationMin("");
    setDurationMax("");
    setSearchQuery("");
    setIsSearchMode(false);
    setPage(1);
    setError(null);
  };

  const handleViewDetails = async (callId: string) => {
    try {
      setIsLoadingDetails(true);
      setIsDetailsDialogOpen(true);
      const details = await getCallDetails(callId);
      setSelectedCall(details);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load call details");
      setIsDetailsDialogOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // URL parameter handling (deep-link from notification panel / escalation)
  useEffect(() => {
    const callIdFromUrl = searchParams.get("call_id");
    if (!callIdFromUrl || !callIdFromUrl.trim()) {
      hasProcessedCallIdParam.current = false;
      return;
    }
    if (hasProcessedCallIdParam.current || isLoadingCalls) return;

    hasProcessedCallIdParam.current = true;

    (async () => {
      try {
        await handleViewDetails(callIdFromUrl.trim());
      } finally {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete("call_id");
            return next;
          },
          { replace: true }
        );
      }
    })();
  }, [searchParams, isLoadingCalls, setSearchParams]);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const blob = await exportCalls({
        date_from: startDate || undefined,
        date_to: endDate || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        duration_min: durationMin ? parseInt(durationMin) : undefined,
        duration_max: durationMax ? parseInt(durationMax) : undefined,
        caller_phone: debouncedCallerPhone || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 500, // Export up to 500 records
      });

      downloadCallsCSV(blob);
      toast.success("Calls exported successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export calls");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    fetchCalls();
    fetchAnalyticsCalls();
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Compute analytics from calls data
  const computeAnalytics = useCallback((): ClientCallAnalyticsResponse | null => {
    if (analyticsCalls.length === 0) {
      return {
        total_calls: 0,
        average_call_duration: 0,
        status_breakdown: {},
        time_of_day_distribution: [],
        calls_by_day_of_week: [],
        conversion_rates: { orders: 0, reservations: 0, rate: 0 },
      };
    }

    // Total calls
    const totalCalls = analyticsCalls.length;

    // Average duration
    const totalDuration = analyticsCalls.reduce((sum, call) => sum + call.duration_seconds, 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    analyticsCalls.forEach((call) => {
      statusBreakdown[call.status] = (statusBreakdown[call.status] || 0) + 1;
    });

    // Time of day distribution (using local timezone)
    const timeOfDayMap: Record<number, number> = {};
    analyticsCalls.forEach((call) => {
      const date = parseApiDate(call.started_at);
      if (!date) return;
      const { hour } = getLocalTimeComponents(date);
      timeOfDayMap[hour] = (timeOfDayMap[hour] || 0) + 1;
    });
    const timeOfDayDistribution = Object.entries(timeOfDayMap)
      .map(([hour_bucket, count]) => ({
        hour_bucket: parseInt(hour_bucket),
        count,
      }))
      .sort((a, b) => a.hour_bucket - b.hour_bucket);

    // Calls by day of week (using local timezone)
    const dayOfWeekMap: Record<number, number> = {};
    analyticsCalls.forEach((call) => {
      const date = parseApiDate(call.started_at);
      if (!date) return;
      const { dayOfWeek } = getLocalTimeComponents(date);
      dayOfWeekMap[dayOfWeek] = (dayOfWeekMap[dayOfWeek] || 0) + 1;
    });
    const callsByDayOfWeek = Object.entries(dayOfWeekMap).map(([day_of_week, count]) => ({
      day_of_week: parseInt(day_of_week),
      count,
    }));

    // Conversion rates (simplified - can be enhanced with order/reservation data)
    const conversionRates = { orders: 0, reservations: 0, rate: 0 };

    return {
      total_calls: totalCalls,
      average_call_duration: avgDuration,
      status_breakdown: statusBreakdown,
      time_of_day_distribution: timeOfDayDistribution,
      calls_by_day_of_week: callsByDayOfWeek,
      conversion_rates: conversionRates,
    };
  }, [analyticsCalls]);

  const analytics = computeAnalytics();

  // Calculate unique callers from analytics calls
  const uniqueCallers = useMemo(() => {
    if (analyticsCalls.length === 0) return 0;
    const uniquePhones = new Set(analyticsCalls.map((call) => call.caller_phone));
    return uniquePhones.size;
  }, [analyticsCalls]);

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters =
    statusFilter !== "all" ||
    startDate ||
    endDate ||
    callerPhoneSearch ||
    durationMin ||
    durationMax ||
    searchQuery;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Calls</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            View call history, transcripts, and analytics
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || calls.length === 0}
            className="text-xs sm:text-sm"
          >
            {isExporting ? (
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            )}
            <span className="hidden xs:inline">Export CSV</span>
            <span className="xs:hidden">Export</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={handleRefresh}
            disabled={isLoadingCalls}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLoadingCalls ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200/50 dark:border-blue-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 truncate pr-2">
              Filtered Calls
            </CardTitle>
            <div className="p-1.5 sm:p-2 rounded-full bg-blue-500/10 shrink-0">
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {analytics?.total_calls ?? 0}
                </div>
                <p className="text-[10px] sm:text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                  Based on current filters (max 200)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/50 dark:to-violet-900/30 border-violet-200/50 dark:border-violet-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-violet-700 dark:text-violet-300 truncate pr-2">
              Avg Duration
            </CardTitle>
            <div className="p-1.5 sm:p-2 rounded-full bg-violet-500/10 shrink-0">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-violet-900 dark:text-violet-100">
                {formatDuration(analytics?.average_call_duration ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200/50 dark:border-emerald-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate pr-2">
              Unique Callers
            </CardTitle>
            <div className="p-1.5 sm:p-2 rounded-full bg-emerald-500/10 shrink-0">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                  {uniqueCallers}
                </div>
                <p className="text-[10px] sm:text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                  Based on current filters
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200/50 dark:border-amber-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300 truncate pr-2">
              Status Breakdown
            </CardTitle>
            <div className="p-1.5 sm:p-2 rounded-full bg-amber-500/10 shrink-0">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <Skeleton className="h-6 sm:h-8 w-full" />
            ) : (
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {analytics?.status_breakdown &&
                  Object.entries(analytics.status_breakdown).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={getStatusColor(status)}
                      className="text-[10px] sm:text-xs"
                    >
                      {status}: {count}
                    </Badge>
                  ))}
                {(!analytics?.status_breakdown ||
                  Object.keys(analytics.status_breakdown).length === 0) && (
                  <span className="text-xs sm:text-sm text-muted-foreground">No data</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call Distribution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/50">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Peak Hours</CardTitle>
                <CardDescription className="text-xs">Calls by time of day</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : analytics?.time_of_day_distribution &&
              analytics.time_of_day_distribution.length > 0 ? (
              <div className="space-y-2.5">
                {[...analytics.time_of_day_distribution]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .sort((a, b) => a.hour_bucket - b.hour_bucket)
                  .map((item) => (
                    <div key={item.hour_bucket} className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-mono font-medium w-12 sm:w-14 text-muted-foreground shrink-0">
                        {item.hour_bucket.toString().padStart(2, "0")}:00
                      </span>
                      <div className="flex-1 h-5 sm:h-6 bg-blue-100/50 dark:bg-blue-900/30 rounded-md overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-500 transition-all duration-500 rounded-md"
                          style={{
                            width: `${
                              (item.count /
                                Math.max(
                                  ...analytics.time_of_day_distribution.map((d) => d.count)
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold w-8 sm:w-10 text-right text-blue-700 dark:text-blue-300 shrink-0">
                        {item.count}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-violet-100 dark:bg-violet-900/50">
                <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Busiest Days</CardTitle>
                <CardDescription className="text-xs">Calls by day of week</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <div className="space-y-3">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : analytics?.calls_by_day_of_week && analytics.calls_by_day_of_week.length > 0 ? (
              <div className="space-y-2.5">
                {[...analytics.calls_by_day_of_week]
                  .sort(
                    (a, b) =>
                      getDaySortKeyMonFirst(a.day_of_week) - getDaySortKeyMonFirst(b.day_of_week)
                  )
                  .map((item) => (
                    <div key={item.day_of_week} className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium w-16 sm:w-20 text-muted-foreground shrink-0">
                        {getDayName(item.day_of_week).slice(0, 3)}
                      </span>
                      <div className="flex-1 h-5 sm:h-6 bg-violet-100/50 dark:bg-violet-900/30 rounded-md overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-violet-400 dark:from-violet-600 dark:to-violet-500 transition-all duration-500 rounded-md"
                          style={{
                            width: `${
                              (item.count /
                                Math.max(...analytics.calls_by_day_of_week.map((d) => d.count))) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold w-8 sm:w-10 text-right text-violet-700 dark:text-violet-300 shrink-0">
                        {item.count}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call History Table */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-primary" />
              <CardTitle>Call History</CardTitle>
              {total > 0 && <Badge variant="secondary">{total} total</Badge>}
            </div>
          </div>

          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone or transcript..."
                className="pl-8 sm:pl-9 text-xs sm:text-sm h-9 sm:h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
              )}
            </div>

            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full xs:w-[130px] sm:w-[140px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as ClientCallListParams["sort_by"])}
              >
                <SelectTrigger className="w-full xs:w-[120px] sm:w-[130px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v as ClientCallListParams["sort_order"])}
              >
                <SelectTrigger className="w-full xs:w-[95px] sm:w-[100px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest</SelectItem>
                  <SelectItem value="asc">Oldest</SelectItem>
                </SelectContent>
              </Select>

              {/* More Filters Toggle */}
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-muted-foreground hover:text-foreground h-9 sm:h-10 text-xs sm:text-sm"
                  aria-label="Clear all filters"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                  <span className="hidden xs:inline">Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* Additional Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Start Date</Label>
                <Input
                  type="date"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">End Date</Label>
                <Input
                  type="date"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Min Duration (sec)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Max Duration (sec)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="No limit"
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                  value={durationMax}
                  onChange={(e) => setDurationMax(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2 lg:col-span-2">
                <Label className="text-xs sm:text-sm font-medium">Caller Phone</Label>
                <Input
                  placeholder="Filter by phone number..."
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                  value={callerPhoneSearch}
                  onChange={(e) => setCallerPhoneSearch(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 mb-3 sm:mb-4 text-xs sm:text-sm bg-destructive/10 border border-destructive/20 rounded-lg">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-destructive break-words">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}

          {isLoadingCalls ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border rounded-lg -mx-3 sm:mx-0">
                <TooltipProvider>
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-xs sm:text-sm">ID</TableHead>
                        <TableHead className="font-semibold text-xs sm:text-sm">Caller</TableHead>
                        <TableHead className="font-semibold text-center text-xs sm:text-sm">
                          Duration
                        </TableHead>
                        <TableHead className="font-semibold text-center text-xs sm:text-sm min-w-[100px]">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">
                          Started At
                        </TableHead>
                        <TableHead className="font-semibold text-center text-xs sm:text-sm hidden sm:table-cell">
                          Transcript
                        </TableHead>
                        <TableHead className="font-semibold text-right text-xs sm:text-sm min-w-[80px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map((call) => {
                        const { date, time } = formatDateTime(call.started_at);
                        return (
                          <TableRow
                            key={call.call_id}
                            className="group hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="font-mono text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                              {call.call_id}
                            </TableCell>
                            <TableCell className="min-w-[120px]">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-mono text-xs sm:text-sm truncate">
                                  {call.caller_phone}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs sm:text-sm">
                                  {formatDuration(call.duration_seconds)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={getStatusColor(call.status)}
                                className="capitalize text-[10px] sm:text-xs whitespace-nowrap"
                              >
                                {call.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs sm:text-sm">{date}</span>
                                <span className="text-[10px] sm:text-xs text-muted-foreground">
                                  {time}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              {call.has_transcript ? (
                                <Badge variant="outline" className="text-[10px] sm:text-xs">
                                  <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                  Yes
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-[10px] sm:text-xs">
                                  No
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-blue-50 dark:hover:bg-blue-950"
                                      onClick={() => handleViewDetails(call.call_id)}
                                    >
                                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center sm:text-left">
                    Showing {calls.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
                    {Math.min(page * limit, total)} of {total} calls
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoadingCalls}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages || isLoadingCalls}
                      aria-label="Next page"
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {!isLoadingCalls && !error && calls.length === 0 && (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-3 sm:mb-4">
                <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">No calls found</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your filters to see more results."
                  : "Voice call records will appear here once customers start calling."}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs sm:text-sm"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Details
            </DialogTitle>
            <DialogDescription>
              {selectedCall ? `Call #${selectedCall.call_id}` : "Loading..."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedCall ? (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Call Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label className="text-muted-foreground text-[10px] sm:text-xs">Restaurant</Label>
                  <p className="font-medium text-xs sm:text-sm truncate">
                    {selectedCall.restaurant_name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-[10px] sm:text-xs">
                    Caller Phone
                  </Label>
                  <p className="font-medium font-mono text-xs sm:text-sm truncate">
                    {selectedCall.caller_phone}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-[10px] sm:text-xs">Direction</Label>
                  <div className="flex items-center gap-1 mt-0.5">
                    {selectedCall.call_direction === "inbound" ? (
                      <PhoneIncoming className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                    ) : (
                      <PhoneOutgoing className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                    )}
                    <span className="capitalize text-xs sm:text-sm">
                      {selectedCall.call_direction}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-[10px] sm:text-xs">Status</Label>
                  <div className="mt-0.5">
                    <Badge
                      variant={getStatusColor(selectedCall.status)}
                      className="capitalize text-[10px] sm:text-xs"
                    >
                      {selectedCall.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-[10px] sm:text-xs">Duration</Label>
                  <p className="font-medium text-xs sm:text-sm">
                    {formatDuration(selectedCall.duration_seconds)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-[10px] sm:text-xs">Started At</Label>
                  <p className="font-medium text-xs sm:text-sm">
                    {formatDateTime(selectedCall.started_at).date}{" "}
                    {formatDateTime(selectedCall.started_at).time}
                  </p>
                </div>
              </div>

              {/* Cost (if available) */}
              {selectedCall.cost !== null && selectedCall.cost !== undefined && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <Label className="text-muted-foreground text-xs">Call Cost</Label>
                  <p className="font-medium font-mono text-lg">{formatCost(selectedCall.cost)}</p>
                </div>
              )}

              {/* Linked Resources */}
              {(selectedCall.order_id || selectedCall.reservation_id) && (
                <div className="flex flex-wrap gap-3">
                  {selectedCall.order_id && (
                    <Badge variant="outline" className="text-sm">
                      Order: #{selectedCall.order_id}
                    </Badge>
                  )}
                  {selectedCall.reservation_id && (
                    <Badge variant="outline" className="text-sm">
                      Reservation: #{selectedCall.reservation_id}
                    </Badge>
                  )}
                </div>
              )}

              {/* Summary */}
              {selectedCall.summary && (
                <div>
                  <Label className="text-muted-foreground text-xs">Summary</Label>
                  <p className="text-sm mt-1">{selectedCall.summary}</p>
                </div>
              )}

              {/* Transcript */}
              {selectedCall.has_transcript && selectedCall.transcript && (
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Label className="font-medium">Transcript</Label>
                      <Badge variant="secondary" className="text-xs">
                        {selectedCall.transcript.length} messages
                      </Badge>
                    </div>
                  </div>
                  <ScrollArea className="h-[250px] sm:h-[300px] p-3 sm:p-4">
                    <div className="space-y-4">
                      {selectedCall.transcript.map((entry, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-3 ${
                            entry.role === "assistant" ? "flex-row" : "flex-row-reverse"
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              entry.role === "assistant"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {entry.role === "assistant" ? (
                              <Bot className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <div
                            className={`flex-1 max-w-[80%] ${
                              entry.role === "assistant" ? "" : "text-right"
                            }`}
                          >
                            <div
                              className={`inline-block rounded-lg px-4 py-2 text-sm ${
                                entry.role === "assistant"
                                  ? "bg-muted text-foreground"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{entry.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {parseApiDate(entry.timestamp)?.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {selectedCall.has_transcript && !selectedCall.transcript && (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Transcript data not available</p>
                </div>
              )}

              {!selectedCall.has_transcript && (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No transcript for this call</p>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Calls;
