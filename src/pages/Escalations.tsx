/**
 * Escalations Page
 * Displays escalation alerts requiring attention for the Client Dashboard
 *
 * Features:
 * - Real-time escalation alerts from SSE
 * - Filter by escalation type
 * - View escalation details
 * - Navigate to related call details
 * - Dismiss/clear escalations
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { useSSE } from "@/contexts/SSEContext";
import { formatLocalDateTimeParts, parseApiDate } from "@/lib/utils/timezone";
import type { SSEEvent, SSEEventSubtype } from "@/types/api.types";

// ============================================================================
// Types
// ============================================================================

type EscalationFilter = "all" | SSEEventSubtype;

// ============================================================================
// Helper Functions
// ============================================================================

const formatDateTime = (timestamp: string) => {
  return formatLocalDateTimeParts(timestamp);
};

const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const eventTime = parseApiDate(timestamp);
  if (!eventTime) return "";
  const diffMs = now.getTime() - eventTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

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
  const [filter, setFilter] = useState<EscalationFilter>("all");
  const { escalations, dismissEvent, clearEvents, isConnected } = useSSE();

  // Filter escalations
  const filteredEscalations =
    filter === "all" ? escalations : escalations.filter((e) => e.subtype === filter);

  // Get counts by type
  const counts = {
    all: escalations.length,
    user_requested: escalations.filter((e) => e.subtype === "user_requested").length,
    internal_server_error: escalations.filter((e) => e.subtype === "internal_server_error").length,
    suspected_spam: escalations.filter((e) => e.subtype === "suspected_spam").length,
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0" />
              <CardTitle className="text-base sm:text-lg md:text-xl">Escalation Alerts</CardTitle>
              {escalations.length > 0 && (
                <Badge variant="destructive" className="hidden sm:inline-flex text-xs">
                  {escalations.length} active
                </Badge>
              )}
              {escalations.length > 0 && (
                <Badge variant="destructive" className="sm:hidden text-[10px] px-1.5 py-0">
                  {escalations.length}
                </Badge>
              )}
              {/* Connection Status */}
              <div
                className={`h-2 w-2 rounded-full flex-shrink-0 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                title={isConnected ? "Live updates active" : "Disconnected"}
              />
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3 rounded-lg border bg-muted/30">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Alerts</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-destructive">
                  {counts.all}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Human Requested</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">
                  {counts.user_requested}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">System Errors</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">
                  {counts.internal_server_error}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Spam Detected</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">
                  {counts.suspected_spam}
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
                {filter === "all" ? "No escalations" : "No matching escalations"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {filter === "all"
                  ? "Escalation alerts will appear here in real-time when they occur during AI calls."
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
  const info = getEscalationInfo(escalation.subtype);
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
                    : "secondary"
              }
              className="text-[10px] sm:text-xs"
            >
              {escalation.subtype.replace(/_/g, " ")}
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
