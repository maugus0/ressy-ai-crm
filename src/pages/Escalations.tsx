/**
 * Escalations Page
 * Displays escalation alerts requiring attention for the Client Dashboard
 *
 * Features:
 * - Two tabs: Live Alerts (SSE) and History (database)
 * - Real-time escalation alerts from SSE
 * - Historical escalations from database with pagination
 * - Filter by escalation type/status
 * - View escalation details
 * - Navigate to related call details
 * - Dismiss/clear escalations
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Phone,
  MessageSquare,
  Clock,
  ChevronRight,
  Trash2,
  Filter,
  X,
  AlertCircle,
  Bug,
  ShieldAlert,
  RefreshCw,
  Info,
  Zap,
  History,
  Radio,
  ChevronLeft,
  Send,
  Power,
} from "lucide-react";
import { useSSE } from "@/contexts/SSEContext";
import { formatLocalDateTimeParts, parseApiDate, formatLocalDateTime } from "@/lib/utils/timezone";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import { getClientEscalations } from "@/services/escalations";
import {
  getEscalationStatusColor,
  getEscalationUrgencyColor,
  escalationStatusLabels,
  escalationUrgencyLabels,
} from "@/lib/utils/escalationStyles";
import type { SSEEvent, SSEEventSubtype } from "@/types/api.types";
import type { Escalation, EscalationStatus, EscalationUrgency } from "@/types/escalation.types";

// ============================================================================
// Types
// ============================================================================

type EscalationFilter = "all" | SSEEventSubtype;

// ============================================================================
// Constants
// ============================================================================

const HISTORY_PAGE_SIZE = 10;

// ============================================================================
// Helper Functions
// ============================================================================

const formatDateTime = (timestamp: string) => {
  return formatLocalDateTimeParts(timestamp);
};

// Note: formatRelativeTime is now imported from @/lib/utils/formatRelativeTime
// Using the imported version for consistency

const getEscalationInfo = (subtype: SSEEventSubtype) => {
  const info: Record<
    string,
    { title: string; description: string; icon: React.ReactNode; color: string }
  > = {
    user_requested: {
      title: "Human Assistance Requested",
      description: "Customer asked to speak with a human representative",
      icon: <MessageSquare className="h-5 w-5" />,
      color: "bg-amber-500",
    },
    internal_server_error: {
      title: "System Error",
      description: "An internal error occurred during the call",
      icon: <Bug className="h-5 w-5" />,
      color: "bg-red-500",
    },
    suspected_spam: {
      title: "Spam Detected",
      description: "Call was flagged as potential spam or abuse",
      icon: <ShieldAlert className="h-5 w-5" />,
      color: "bg-orange-500",
    },
    sms_redirect_failed: {
      title: "SMS Redirect Failed",
      description: "Could not send redirect link to customer via SMS",
      icon: <Send className="h-5 w-5" />,
      color: "bg-blue-500",
    },
    kill_switch_redirected: {
      title: "Kill Switch Redirected",
      description: "Call was automatically redirected because kill switch is enabled",
      icon: <Power className="h-5 w-5" />,
      color: "bg-rose-500",
    },
  };
  return (
    info[subtype] || {
      title: subtype,
      description: "Unknown escalation type",
      icon: <AlertCircle className="h-5 w-5" />,
      color: "bg-gray-500",
    }
  );
};

// ============================================================================
// Component
// ============================================================================

export function Escalations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const [filter, setFilter] = useState<EscalationFilter>("all");
  const { escalations, dismissEvent, clearEvents, isConnected } = useSSE();

  // History tab state
  const [historyEscalations, setHistoryEscalations] = useState<Escalation[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<EscalationStatus | "all">("all");
  const [historyUrgencyFilter, setHistoryUrgencyFilter] = useState<EscalationUrgency | "all">(
    "all"
  );

  const historyTotalPages = Math.ceil(historyTotal / HISTORY_PAGE_SIZE);

  // Fetch history escalations
  const fetchHistoryEscalations = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const params: Parameters<typeof getClientEscalations>[0] = {
        page: historyPage,
        limit: HISTORY_PAGE_SIZE,
        sort_by: "requested_at",
        sort_order: "desc",
      };

      if (historyStatusFilter !== "all") {
        params.status = historyStatusFilter;
      }
      if (historyUrgencyFilter !== "all") {
        params.urgency = historyUrgencyFilter;
      }

      const response = await getClientEscalations(params);
      setHistoryEscalations(response.escalations);
      setHistoryTotal(response.total);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to load escalations");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, historyStatusFilter, historyUrgencyFilter]);

  // Fetch history when tab is active or filters change
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistoryEscalations();
    }
  }, [activeTab, fetchHistoryEscalations]);

  // Reset page when filters change
  useEffect(() => {
    setHistoryPage(1);
  }, [historyStatusFilter, historyUrgencyFilter]);

  // Filter escalations
  const filteredEscalations =
    filter === "all" ? escalations : escalations.filter((e) => e.subtype === filter);

  // Get counts by type
  const counts = {
    all: escalations.length,
    user_requested: escalations.filter((e) => e.subtype === "user_requested").length,
    internal_server_error: escalations.filter((e) => e.subtype === "internal_server_error").length,
    suspected_spam: escalations.filter((e) => e.subtype === "suspected_spam").length,
    sms_redirect_failed: escalations.filter((e) => e.subtype === "sms_redirect_failed").length,
    kill_switch_redirected: escalations.filter((e) => e.subtype === "kill_switch_redirected")
      .length,
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <h1 className="text-xl sm:text-2xl font-bold">Escalations</h1>
        {escalations.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {escalations.length} live
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "live" | "history")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Live Alerts
            {escalations.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {escalations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Live Alerts Tab */}
        <TabsContent value="live" className="mt-4">
          <Card>
            <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <CardTitle className="text-base sm:text-lg">
                    Real-time Escalation Alerts
                  </CardTitle>
                  {/* Connection Status */}
                  <div
                    className={`h-2 w-2 rounded-full flex-shrink-0 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                    title={isConnected ? "Live updates active" : "Disconnected"}
                  />
                  <span className="text-xs text-muted-foreground">
                    {isConnected ? "Connected" : "Reconnecting..."}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                  {/* Filter */}
                  <Select value={filter} onValueChange={(v) => setFilter(v as EscalationFilter)}>
                    <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-10">
                      <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Escalations ({counts.all})</SelectItem>
                      <SelectItem value="user_requested">
                        Human Requested ({counts.user_requested})
                      </SelectItem>
                      <SelectItem value="internal_server_error">
                        System Errors ({counts.internal_server_error})
                      </SelectItem>
                      <SelectItem value="suspected_spam">
                        Spam Detected ({counts.suspected_spam})
                      </SelectItem>
                      <SelectItem value="sms_redirect_failed">
                        SMS Redirect Failed ({counts.sms_redirect_failed})
                      </SelectItem>
                      <SelectItem value="kill_switch_redirected">
                        Kill Switch Redirected ({counts.kill_switch_redirected})
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear All */}
                  {escalations.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearEvents}
                      className="w-full sm:w-auto h-9 sm:h-10"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                      <span className="text-xs sm:text-sm">Clear All</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              {escalations.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                  <div className="p-2.5 sm:p-3 rounded-lg border bg-muted/30">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                      Total Alerts
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-destructive">
                      {counts.all}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                      Human Requested
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">
                      {counts.user_requested}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                      System Errors
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">
                      {counts.internal_server_error}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                      Spam Detected
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">
                      {counts.suspected_spam}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                      SMS Redirect Failed
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                      {counts.sms_redirect_failed}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg border bg-rose-50 dark:bg-rose-950/20">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                      Kill Switch Redirected
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-rose-600">
                      {counts.kill_switch_redirected}
                    </p>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {filteredEscalations.length > 0 ? (
                <div className="space-y-3">
                  {filteredEscalations.map((escalation) => (
                    <EscalationCard
                      key={escalation.id}
                      escalation={escalation}
                      onDismiss={() => dismissEvent(escalation.id)}
                      onViewCall={(callId) => navigate(`/dashboard/calls?call_id=${callId}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 sm:py-16 px-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted mb-4">
                    <AlertTriangle className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                  <p className="text-base sm:text-lg font-semibold mb-2">
                    {filter === "all" ? "No live escalations" : "No matching escalations"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {filter === "all"
                      ? "Escalation alerts will appear here in real-time when they occur during AI calls. To view past escalations, go to the History tab."
                      : "Try changing the filter to see other escalation types."}
                  </p>
                  {filter !== "all" && (
                    <Button variant="outline" onClick={() => setFilter("all")}>
                      <X className="h-4 w-4 mr-2" />
                      Clear Filter
                    </Button>
                  )}
                  {!isConnected && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Reconnecting to live updates...</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <CardTitle className="text-base sm:text-lg">Escalation History</CardTitle>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                  {/* Status Filter */}
                  <Select
                    value={historyStatusFilter}
                    onValueChange={(v) => setHistoryStatusFilter(v as EscalationStatus | "all")}
                  >
                    <SelectTrigger className="w-full sm:w-[150px] h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="raised">Raised</SelectItem>
                      <SelectItem value="forwarded">Forwarded</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Urgency Filter */}
                  <Select
                    value={historyUrgencyFilter}
                    onValueChange={(v) => setHistoryUrgencyFilter(v as EscalationUrgency | "all")}
                  >
                    <SelectTrigger className="w-full sm:w-[150px] h-9">
                      <SelectValue placeholder="Urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Urgencies</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Refresh */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchHistoryEscalations}
                    disabled={historyLoading}
                    className="h-9 w-9"
                  >
                    <RefreshCw className={`h-4 w-4 ${historyLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {historyTotal} escalation{historyTotal !== 1 ? "s" : ""} total
              </p>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0">
              {historyLoading && historyEscalations.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : historyError ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  <p className="text-sm text-destructive">{historyError}</p>
                  <Button variant="outline" onClick={fetchHistoryEscalations} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : historyEscalations.length > 0 ? (
                <div className="space-y-3">
                  {historyEscalations.map((escalation) => (
                    <div
                      key={escalation.id}
                      role="button"
                      tabIndex={0}
                      className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => navigate(`/dashboard/escalations/${escalation.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/dashboard/escalations/${escalation.id}`);
                        }
                      }}
                      aria-label={`Escalation ${escalation.id}, ${escalation.status}, ${escalation.urgency}${escalation.reason ? `. ${escalation.reason}` : ""}`}
                    >
                      {/* Icon */}
                      <div className="p-2 rounded-full bg-destructive/10 flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">Escalation #{escalation.id}</span>
                            <Badge
                              className={`text-xs ${getEscalationStatusColor(escalation.status)}`}
                            >
                              {escalationStatusLabels[escalation.status]}
                            </Badge>
                            <Badge
                              className={`text-xs ${getEscalationUrgencyColor(escalation.urgency)}`}
                            >
                              {escalationUrgencyLabels[escalation.urgency]}
                            </Badge>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        {escalation.reason && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {escalation.reason}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {escalation.caller_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {escalation.caller_phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(escalation.requested_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {historyTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {historyPage} of {historyTotalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={historyPage === 1 || historyLoading}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                          disabled={historyPage === historyTotalPages || historyLoading}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium">No escalation history</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {historyStatusFilter !== "all" || historyUrgencyFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Past escalations will appear here"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Escalation Card Component
// ============================================================================

interface EscalationCardProps {
  escalation: SSEEvent;
  onDismiss: () => void;
  onViewCall?: (callId: string) => void;
}

function EscalationCard({ escalation, onDismiss, onViewCall }: EscalationCardProps) {
  const baseInfo = getEscalationInfo(escalation.subtype);
  // Use backend-provided title/description when available (e.g. sms_redirect_failed)
  const info = {
    ...baseInfo,
    ...(escalation.data?.title && typeof escalation.data.title === "string"
      ? { title: escalation.data.title }
      : {}),
    ...(escalation.data?.description && typeof escalation.data.description === "string"
      ? { description: escalation.data.description }
      : {}),
  };
  const { date, time } = formatDateTime(escalation.timestamp);
  const relativeTime = formatRelativeTime(escalation.timestamp);

  // Extract all data from event
  const callerPhone = escalation.data?.caller_phone as string;
  const callId = escalation.data?.call_id as string;
  const summary = escalation.data?.summary as string;
  const reason = escalation.data?.reason as string;
  const urgency = escalation.data?.urgency as string;
  const errorMessage = escalation.data?.error_message as string;
  const errorCode = escalation.data?.error_code as string;
  const spamScore = escalation.data?.spam_score as number;
  const indicators = escalation.data?.indicators as string[];

  // Get urgency badge variant
  const getUrgencyVariant = (urgency?: string) => {
    if (!urgency) return "secondary";
    const lower = urgency.toLowerCase();
    if (lower === "urgent" || lower === "critical") return "destructive";
    if (lower === "high") return "default";
    return "secondary";
  };

  return (
    <div className="border rounded-lg p-3 sm:p-4 hover:bg-muted/30 transition-colors group">
      <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
        {/* Icon */}
        <div className={`p-2 sm:p-2.5 rounded-full ${info.color} text-white flex-shrink-0`}>
          {info.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base leading-tight">{info.title}</h3>
                {urgency && (
                  <Badge variant={getUrgencyVariant(urgency)} className="text-[10px] sm:text-xs">
                    {urgency}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {info.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 opacity-50 group-hover:opacity-100"
              onClick={onDismiss}
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Reason - Prominently displayed */}
          {reason && (
            <div className="mt-3 p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                  {reason}
                </p>
              </div>
            </div>
          )}

          {/* Error Details */}
          {(errorMessage || errorCode) && (
            <div className="mt-3 p-2.5 sm:p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {errorCode && (
                    <p className="text-xs font-mono font-semibold text-red-900 dark:text-red-100 mb-1">
                      {errorCode}
                    </p>
                  )}
                  {errorMessage && (
                    <p className="text-xs sm:text-sm text-red-900 dark:text-red-100 leading-relaxed">
                      {errorMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Spam Details */}
          {(spamScore !== undefined || (indicators && indicators.length > 0)) && (
            <div className="mt-3 p-2.5 sm:p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
              <div className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-2">
                  {spamScore !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-orange-900 dark:text-orange-100">
                          Spam Score
                        </span>
                        <span className="text-xs font-semibold text-orange-900 dark:text-orange-100">
                          {Math.round(Math.max(0, Math.min(1, spamScore)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
                        <div
                          className="bg-orange-600 dark:bg-orange-400 h-2 rounded-full transition-all"
                          style={{ width: `${Math.max(0, Math.min(1, spamScore)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {indicators && indicators.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {indicators.map((indicator, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100"
                        >
                          {indicator.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
            {callerPhone && (
              <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{callerPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="hidden sm:inline truncate">
                {date} at {time}
              </span>
              <span className="sm:hidden truncate">{relativeTime}</span>
            </div>
            {callId && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                <span
                  className="font-mono text-[10px] sm:text-xs max-w-[140px] sm:max-w-[200px] truncate"
                  title={callId}
                >
                  Call: {callId}
                </span>
              </div>
            )}
          </div>

          {/* Summary */}
          {summary && (
            <div className="mt-3 p-2 sm:p-3 bg-muted/50 rounded-md">
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {summary}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
            <Badge
              variant={
                escalation.subtype === "user_requested"
                  ? "default"
                  : escalation.subtype === "internal_server_error"
                    ? "destructive"
                    : escalation.subtype === "sms_redirect_failed" ||
                        escalation.subtype === "kill_switch_redirected"
                      ? "outline"
                      : "secondary"
              }
              className="text-[10px] sm:text-xs"
            >
              {escalation.data?.title && typeof escalation.data.title === "string"
                ? escalation.data.title
                : escalation.subtype.replace(/_/g, " ")}
            </Badge>
            <span className="text-[10px] sm:text-xs text-muted-foreground">{relativeTime}</span>
            {callId && (
              <Button
                variant="link"
                size="sm"
                className="ml-auto text-[10px] sm:text-xs h-auto p-0"
                onClick={() => onViewCall?.(callId)}
              >
                <span className="hidden sm:inline">View Call Details</span>
                <span className="sm:hidden">View Call</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Escalations;
