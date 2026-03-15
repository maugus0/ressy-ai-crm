/**
 * Notification History Page
 * Displays paginated list of all notifications with filtering and mark-as-read
 */

import { useState, useEffect, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Bell,
  CheckCheck,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDashboardNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/notifications";
import { formatRelativeTime, formatRelativeTimeLong } from "@/lib/utils/formatRelativeTime";
import {
  getNotificationNavigationTarget,
  buildNavigationUrl,
} from "@/lib/utils/notificationNavigation";
import {
  getNotificationTypeIcon,
  getNotificationTypeBadgeColor,
  getNotificationTypeLabel,
} from "@/lib/utils/notificationIcons";
import {
  getNotificationDisplayTitle,
  getNotificationDisplayMessage,
  getEscalationSubtypeLabel,
} from "@/lib/utils/notificationDisplay";
import type {
  Notification,
  NotificationType,
  NotificationListResponse,
} from "@/types/notification.types";

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 20;

// ============================================================================
// Helper Functions
// ============================================================================

// Use shared utility for notification icons
const getNotificationIcon = (type: NotificationType) => {
  return getNotificationTypeIcon(type, "h-5 w-5");
};

// ============================================================================
// Component
// ============================================================================

export function NotificationHistory() {
  const navigate = useNavigate();

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  // Calculate pagination
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const offset = (page - 1) * PAGE_SIZE;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof getDashboardNotifications>[0] = {
        limit: PAGE_SIZE,
        offset,
      };

      if (typeFilter !== "all") {
        params.type = typeFilter;
      }

      if (readFilter === "unread") {
        params.is_read = false;
      } else if (readFilter === "read") {
        params.is_read = true;
      }

      const response: NotificationListResponse = await getDashboardNotifications(params);
      setNotifications(response.notifications);
      setTotal(response.total);
      setUnreadCount(response.unread_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [offset, typeFilter, readFilter]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, readFilter]);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if not already
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Navigate to the relevant entity
      const target = getNotificationNavigationTarget(notification);
      navigate(buildNavigationUrl(target));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      // Still navigate even if mark-as-read fails
      const target = getNotificationNavigationTarget(notification);
      navigate(buildNavigationUrl(target));
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const type = typeFilter !== "all" ? typeFilter : undefined;
      await markAllNotificationsAsRead(type);
      toast.success("All notifications marked as read");
      // Refresh the list
      fetchNotifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark all as read");
    }
  };

  // Loading skeleton
  if (loading && notifications.length === 0) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchNotifications} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4">
      <Card>
        <CardHeader className="space-y-4 p-4 sm:p-6">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg md:text-xl">Notification History</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} unread
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
              {/* Type Filter */}
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as NotificationType | "all")}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="reservation">Reservations</SelectItem>
                  <SelectItem value="escalation">Escalations</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              {/* Read Status Filter */}
              <Select
                value={readFilter}
                onValueChange={(v) => setReadFilter(v as "all" | "unread" | "read")}
              >
                <SelectTrigger className="w-full sm:w-[140px] h-9">
                  <SelectValue placeholder="Read status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              {/* Mark All as Read */}
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="h-9">
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}

              {/* Refresh */}
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchNotifications}
                disabled={loading}
                className="h-9 w-9"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {total} notification{total !== 1 ? "s" : ""} total
            </span>
            <span>•</span>
            <span>{unreadCount} unread</span>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0">
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  className={`flex items-start gap-2 sm:gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.is_read ? "bg-primary/5 border-primary/20" : ""
                  } ${notification.is_read ? "opacity-75" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                  aria-label={`${getNotificationDisplayTitle(notification)}. ${getNotificationDisplayMessage(notification) ?? ""}`}
                >
                  {/* Icon - same as SSE panel */}
                  <div className="mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content - layout aligned with SSE Alerts panel */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                        <p className="text-xs sm:text-sm font-medium break-words">
                          {getNotificationDisplayTitle(notification)}
                        </p>
                        {notification.is_read ? (
                          <CheckCircle2
                            className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0"
                            aria-hidden
                          />
                        ) : (
                          <Circle
                            className="h-3.5 w-3.5 text-primary flex-shrink-0 fill-primary"
                            aria-hidden
                          />
                        )}
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getNotificationTypeBadgeColor(notification.type)}`}
                        >
                          {notification.type === "escalation" && notification.subtype
                            ? getEscalationSubtypeLabel(notification.subtype)
                            : getNotificationTypeLabel(notification.type)}
                        </Badge>
                      </div>
                    </div>
                    {getNotificationDisplayMessage(notification) && (
                      <p className="text-xs sm:text-sm text-muted-foreground break-words mt-0.5 line-clamp-2">
                        {getNotificationDisplayMessage(notification)}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                      <span title={new Date(notification.created_at).toLocaleString()}>
                        {formatRelativeTimeLong(notification.created_at)}
                      </span>
                      {notification.is_read && notification.read_at && (
                        <span className="text-green-600 dark:text-green-400">
                          Read {formatRelativeTime(notification.read_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No notifications found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {typeFilter !== "all" || readFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Notifications will appear here when events occur"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationHistory;
