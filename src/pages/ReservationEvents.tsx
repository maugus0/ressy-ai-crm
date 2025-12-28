/**
 * Reservation Events Page
 * Displays reservation SSE events for the Client Dashboard
 *
 * Features:
 * - Real-time reservation events from SSE
 * - Filter by reservation event type
 * - View reservation event details
 * - Navigate to related reservation details
 * - Dismiss/clear events
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
  CalendarDays,
  User,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Trash2,
  Filter,
  X,
  Users,
  RefreshCw,
  Plus,
  Edit,
  XCircle,
  FileText,
} from "lucide-react";
import { useSSE } from "@/contexts/SSEContext";
import type { SSEEvent, SSEReservationSubtype } from "@/types/api.types";

// ============================================================================
// Types
// ============================================================================

type ReservationEventFilter = "all" | SSEReservationSubtype;

// ============================================================================
// Helper Functions
// ============================================================================

const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Vancouver",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Vancouver",
    }),
  };
};

const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

const formatReservationDateTime = (dateTime: string | undefined) => {
  if (!dateTime) return "N/A";
  try {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/Vancouver",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Vancouver",
      }),
    };
  } catch {
    return { date: dateTime, time: "" };
  }
};

const getReservationEventInfo = (subtype: SSEReservationSubtype) => {
  const info: Record<
    string,
    { title: string; description: string; icon: React.ReactNode; color: string }
  > = {
    new_reservation: {
      title: "New Reservation",
      description: "A new reservation has been created",
      icon: <Plus className="h-5 w-5" />,
      color: "bg-green-500",
    },
    reservation_updated: {
      title: "Reservation Updated",
      description: "An existing reservation has been updated",
      icon: <Edit className="h-5 w-5" />,
      color: "bg-blue-500",
    },
    reservation_cancelled: {
      title: "Reservation Cancelled",
      description: "A reservation has been cancelled",
      icon: <XCircle className="h-5 w-5" />,
      color: "bg-red-500",
    },
  };
  return (
    info[subtype] || {
      title: subtype,
      description: "Unknown reservation event type",
      icon: <CalendarDays className="h-5 w-5" />,
      color: "bg-gray-500",
    }
  );
};

// ============================================================================
// Component
// ============================================================================

export function ReservationEvents() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ReservationEventFilter>("all");
  const { reservationEvents, dismissEvent, clearEvents, isConnected } = useSSE();

  // Filter reservation events
  const filteredEvents =
    filter === "all" ? reservationEvents : reservationEvents.filter((e) => e.subtype === filter);

  // Get counts by type
  const counts = {
    all: reservationEvents.length,
    new_reservation: reservationEvents.filter((e) => e.subtype === "new_reservation").length,
    reservation_updated: reservationEvents.filter((e) => e.subtype === "reservation_updated")
      .length,
    reservation_cancelled: reservationEvents.filter((e) => e.subtype === "reservation_cancelled")
      .length,
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0" />
              <CardTitle className="text-base sm:text-lg md:text-xl">Reservation Events</CardTitle>
              {reservationEvents.length > 0 && (
                <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                  {reservationEvents.length} total
                </Badge>
              )}
              {reservationEvents.length > 0 && (
                <Badge variant="secondary" className="sm:hidden text-[10px] px-1.5 py-0">
                  {reservationEvents.length}
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
              <Select value={filter} onValueChange={(v) => setFilter(v as ReservationEventFilter)}>
                <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-10">
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events ({counts.all})</SelectItem>
                  <SelectItem value="new_reservation">
                    New Reservations ({counts.new_reservation})
                  </SelectItem>
                  <SelectItem value="reservation_updated">
                    Updated ({counts.reservation_updated})
                  </SelectItem>
                  <SelectItem value="reservation_cancelled">
                    Cancelled ({counts.reservation_cancelled})
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Clear All */}
              {reservationEvents.length > 0 && (
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
          {reservationEvents.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3 rounded-lg border bg-muted/30">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Events</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{counts.all}</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">New</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                  {counts.new_reservation}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Updated</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                  {counts.reservation_updated}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Cancelled</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">
                  {counts.reservation_cancelled}
                </p>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {filteredEvents.length > 0 ? (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <ReservationEventCard
                  key={event.id}
                  event={event}
                  onDismiss={() => dismissEvent(event.id)}
                  onViewReservation={(reservationId) =>
                    navigate(`/dashboard/reservations?reservation_id=${reservationId}`)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted mb-4">
                <CalendarDays className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-semibold mb-2">
                {filter === "all" ? "No reservation events" : "No matching events"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {filter === "all"
                  ? "Reservation events will appear here in real-time when they occur."
                  : "Try changing the filter to see other event types."}
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
// Reservation Event Card Component
// ============================================================================

interface ReservationEventCardProps {
  event: SSEEvent;
  onDismiss: () => void;
  onViewReservation?: (reservationId: number) => void;
}

function ReservationEventCard({ event, onDismiss, onViewReservation }: ReservationEventCardProps) {
  const info = getReservationEventInfo(event.subtype as SSEReservationSubtype);
  const { date, time } = formatDateTime(event.timestamp);
  const relativeTime = formatRelativeTime(event.timestamp);

  // Extract all data from event
  const reservationId = event.data?.reservation_id as number;
  const confirmationNumber = event.data?.confirmation_number as string;
  const customerName = event.data?.customer_name as string;
  const customerPhone = event.data?.customer_phone as string;
  const customerEmail = event.data?.customer_email as string;
  const partySize = event.data?.party_size as number;
  const dateTime = event.data?.date_time as string;
  const status = event.data?.status as string;
  const specialRequest = event.data?.special_request as string;
  const notes = event.data?.notes as string;

  const reservationDateTime = formatReservationDateTime(dateTime);

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
              <h3 className="font-semibold text-sm sm:text-base leading-tight">{info.title}</h3>
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

          {/* Reservation Details */}
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
            {/* Reservation ID and Status */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {reservationId && (
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="font-mono font-semibold">Reservation #{reservationId}</span>
                </div>
              )}
              {confirmationNumber && (
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="font-mono font-semibold text-muted-foreground">
                    {confirmationNumber}
                  </span>
                </div>
              )}
              {status && (
                <Badge
                  variant={
                    status === "cancelled"
                      ? "destructive"
                      : status === "confirmed"
                        ? "default"
                        : "secondary"
                  }
                  className="text-[10px] sm:text-xs"
                >
                  {status}
                </Badge>
              )}
            </div>

            {/* Reservation Date/Time */}
            {dateTime && (
              <div className="flex items-center gap-2 text-xs sm:text-sm p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {reservationDateTime.date}
                  </p>
                  {reservationDateTime.time && (
                    <p className="text-blue-700 dark:text-blue-300">{reservationDateTime.time}</p>
                  )}
                </div>
              </div>
            )}

            {/* Customer Info */}
            {(customerName || customerPhone || customerEmail) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-md">
                {customerName && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate font-medium">{customerName}</span>
                  </div>
                )}
                {customerPhone && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{customerPhone}</span>
                  </div>
                )}
                {customerEmail && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{customerEmail}</span>
                  </div>
                )}
              </div>
            )}

            {/* Party Size */}
            {partySize !== undefined && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <span>
                  Party of <span className="font-semibold">{partySize}</span>
                </span>
              </div>
            )}

            {/* Special Request */}
            {specialRequest && (
              <div className="p-2 sm:p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Special Request
                    </p>
                    <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                      {specialRequest}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {notes && (
              <div className="p-2 sm:p-3 bg-muted/50 rounded-md">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <span className="font-semibold">Notes: </span>
                  {notes}
                </p>
              </div>
            )}

            {/* Event Timestamp */}
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="hidden sm:inline truncate">
                Event: {date} at {time}
              </span>
              <span className="sm:hidden truncate">Event: {relativeTime}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
            <Badge variant="secondary" className="text-[10px] sm:text-xs">
              {event.subtype.replace(/_/g, " ")}
            </Badge>
            <span className="text-[10px] sm:text-xs text-muted-foreground">{relativeTime}</span>
            {reservationId && (
              <Button
                variant="link"
                size="sm"
                className="ml-auto text-[10px] sm:text-xs h-auto p-0"
                onClick={() => onViewReservation?.(reservationId)}
              >
                <span className="hidden sm:inline">View Reservation Details</span>
                <span className="sm:hidden">View Reservation</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReservationEvents;
