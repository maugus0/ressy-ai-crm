/**
 * Dashboard Layout
 * Main layout wrapper for authenticated dashboard pages
 * Includes notification bell with SSE events, persistent notifications, and connection status
 */

import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Menu,
  UserCircle2,
  LogOut,
  Bell,
  AlertTriangle,
  ShoppingBag,
  CalendarDays,
  X,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Circle,
  CheckCircle2,
  History,
  CheckCheck,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useSSE } from "@/contexts/SSEContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseApiDate } from "@/lib/utils/timezone";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import {
  getNotificationNavigationTarget,
  buildNavigationUrl,
} from "@/lib/utils/notificationNavigation";
import {
  getNotificationDisplayTitle,
  getNotificationDisplayMessage,
} from "@/lib/utils/notificationDisplay";
import { getNotificationTypeIcon } from "@/lib/utils/notificationIcons";
import type { SSEEvent } from "@/types/api.types";
import type { Notification, NotificationType } from "@/types/notification.types";

// ============================================================================
// Helper Functions
// ============================================================================

// Get icon for SSE event type (uses shared utility)
const getEventIcon = (event: SSEEvent) => {
  // SSE event_type maps to NotificationType (heartbeat is filtered out before display)
  if (event.event_type === "heartbeat") {
    return <Bell className="h-4 w-4" />;
  }
  return getNotificationTypeIcon(event.event_type as NotificationType, "h-4 w-4");
};

// Get event title
const getEventTitle = (event: SSEEvent) => {
  // Use backend-provided title when available (e.g. sms_redirect_failed)
  if (
    event.data?.title &&
    typeof event.data.title === "string" &&
    event.event_type === "escalation"
  ) {
    return event.data.title;
  }
  const titles: Record<string, string> = {
    user_requested: "Human Assistance Requested",
    internal_server_error: "System Error",
    suspected_spam: "Spam Detected",
    sms_redirect_failed: "SMS Redirect Failed",
    new_order: "New Order",
    order_updated: "Order Updated",
    order_cancelled: "Order Cancelled",
    new_reservation: "New Reservation",
    reservation_updated: "Reservation Updated",
    reservation_cancelled: "Reservation Cancelled",
  };
  return titles[event.subtype] || event.subtype;
};

// Get event description
const getEventDescription = (event: SSEEvent) => {
  const { data, event_type } = event;
  if (event_type === "order" && data?.customer_name) {
    return `Customer: ${data.customer_name}`;
  }
  if (event_type === "reservation" && data?.customer_name) {
    const partySize = data.party_size ? ` (Party of ${data.party_size})` : "";
    return `${data.customer_name}${partySize}`;
  }
  if (event_type === "escalation" && data?.caller_phone) {
    return `Caller: ${data.caller_phone}`;
  }
  return undefined;
};

// Get icon for persistent notification type (uses shared utility)
const getPersistentNotificationIcon = (notification: Notification) => {
  return getNotificationTypeIcon(notification.type, "h-4 w-4");
};

// ============================================================================
// Component
// ============================================================================

export function DashboardLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();
  const { restaurantName, user, logout } = useAuth();
  const {
    events,
    unreadCount,
    readEventIds,
    isConnected,
    soundsEnabled,
    toggleSounds,
    markAsRead,
    markEventAsRead,
    dismissEvent,
    clearEvents,
    stopEventSound,
    // Persistent notifications
    persistentNotifications,
    persistentUnreadCount,
    markPersistentAsRead,
    markAllPersistentAsRead,
    totalUnreadCount,
  } = useSSE();

  const companyName = restaurantName || "Your Restaurant";
  const email = user?.email || "manager@restaurant.com";

  const handleLogout = async () => {
    await logout();
  };

  const handleNotificationsOpen = (open: boolean) => {
    setIsNotificationsOpen(open);
    // Note: We don't mark notifications as read when opening the panel
    // They are only marked as read when individually clicked
  };

  const handleViewEscalations = () => {
    setIsNotificationsOpen(false);
    navigate("/dashboard/escalations");
  };

  const handleViewOrderEvents = () => {
    setIsNotificationsOpen(false);
    navigate("/dashboard/order-events");
  };

  const handleViewReservationEvents = () => {
    setIsNotificationsOpen(false);
    navigate("/dashboard/reservation-events");
  };

  const handleViewNotificationHistory = () => {
    setIsNotificationsOpen(false);
    navigate("/dashboard/notifications");
  };

  const handleNotificationClick = (event: SSEEvent) => {
    setIsNotificationsOpen(false);
    // Stop the sound for this notification (but keep it in the panel)
    stopEventSound(event.id);
    // Mark the event as read
    markEventAsRead(event.id);
    // Navigate to the appropriate page based on event type
    switch (event.event_type) {
      case "escalation":
        navigate("/dashboard/escalations");
        break;
      case "order":
        navigate("/dashboard/orders");
        break;
      case "reservation":
        navigate("/dashboard/reservations");
        break;
      default:
        // For unknown event types, do nothing
        break;
    }
  };

  /**
   * Handle click on a persistent notification
   * Marks as read via API and navigates to the relevant entity
   */
  const handlePersistentNotificationClick = async (notification: Notification) => {
    setIsNotificationsOpen(false);
    try {
      // Mark as read first (if not already read)
      if (!notification.is_read) {
        await markPersistentAsRead(notification.id);
      }
      // Navigate to the relevant entity
      const target = getNotificationNavigationTarget(notification);
      navigate(buildNavigationUrl(target));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Still navigate even if mark-as-read fails
      const target = getNotificationNavigationTarget(notification);
      navigate(buildNavigationUrl(target));
    }
  };

  /**
   * Handle "Mark all as read" for persistent notifications
   */
  const handleMarkAllPersistentAsRead = async () => {
    try {
      await markAllPersistentAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const hasEscalations = events.some((e) => e.event_type === "escalation");

  // Accessibility: trap focus inside mobile sidebar and lock body scroll
  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const container = sidebarRef.current;
    if (!container)
      return () => {
        document.body.style.overflow = previousOverflow;
      };

    const focusableSelectors = [
      "a[href]",
      "button",
      "textarea",
      'input[type="text"]',
      'input[type="radio"]',
      'input[type="checkbox"]',
      "select",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");
    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => !el.hasAttribute("disabled")
      );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // move focus into the drawer
    const focusable = getFocusable();
    if (focusable[0]) focusable[0].focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  // Close sidebar on Escape
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    if (sidebarOpen) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Sidebar drawer for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Sidebar navigation"
        >
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full w-auto max-w-[80vw]">
            <div
              ref={sidebarRef}
              className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-sidebar z-50 outline-none shadow-xl transform transition-transform duration-300 translate-x-0 overflow-hidden"
              tabIndex={-1}
            >
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with hamburger */}
        <div className="md:hidden flex items-center justify-between bg-card border-b border-border px-4 py-3 gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-foreground hover:bg-muted rounded-md transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground truncate flex-1">{companyName}</h1>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div
              className="flex items-center"
              title={isConnected ? "Live updates connected" : "Live updates disconnected"}
            >
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
            </div>

            {/* Notifications Bell (Mobile) */}
            {isMobile && (
              <Popover open={isNotificationsOpen} onOpenChange={handleNotificationsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {totalUnreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 text-xs flex items-center justify-center pointer-events-none"
                      >
                        {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[calc(100vw-2rem)] max-w-[400px] p-0 mx-4"
                  align="center"
                  side="bottom"
                  sideOffset={8}
                  alignOffset={0}
                >
                  <NotificationDropdown
                    events={events}
                    readEventIds={readEventIds}
                    persistentNotifications={persistentNotifications}
                    persistentUnreadCount={persistentUnreadCount}
                    soundsEnabled={soundsEnabled}
                    hasEscalations={hasEscalations}
                    toggleSounds={toggleSounds}
                    clearEvents={clearEvents}
                    dismissEvent={dismissEvent}
                    onViewEscalations={handleViewEscalations}
                    onViewOrderEvents={handleViewOrderEvents}
                    onViewReservationEvents={handleViewReservationEvents}
                    onViewNotificationHistory={handleViewNotificationHistory}
                    onNotificationClick={handleNotificationClick}
                    onPersistentNotificationClick={handlePersistentNotificationClick}
                    onMarkAllPersistentAsRead={handleMarkAllPersistentAsRead}
                    isMobile={true}
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Logout Button (Mobile) */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop header */}
        <header className="hidden md:flex items-center justify-between bg-card border-b border-border px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{companyName}</h1>
            <p className="text-sm text-muted-foreground">Restaurant Manager Portal</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Connection Status Indicator */}
            <div
              className="flex items-center gap-2"
              title={isConnected ? "Live updates connected" : "Live updates disconnected"}
            >
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <span className="hidden lg:inline text-sm text-muted-foreground">
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>

            {/* Notifications Bell (Desktop) */}
            {!isMobile && (
              <Popover open={isNotificationsOpen} onOpenChange={handleNotificationsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-muted-foreground hover:text-foreground"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {totalUnreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 text-xs flex items-center justify-center pointer-events-none"
                      >
                        {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
                  <NotificationDropdown
                    events={events}
                    readEventIds={readEventIds}
                    persistentNotifications={persistentNotifications}
                    persistentUnreadCount={persistentUnreadCount}
                    soundsEnabled={soundsEnabled}
                    hasEscalations={hasEscalations}
                    toggleSounds={toggleSounds}
                    clearEvents={clearEvents}
                    dismissEvent={dismissEvent}
                    onViewEscalations={handleViewEscalations}
                    onViewOrderEvents={handleViewOrderEvents}
                    onViewReservationEvents={handleViewReservationEvents}
                    onViewNotificationHistory={handleViewNotificationHistory}
                    onNotificationClick={handleNotificationClick}
                    onPersistentNotificationClick={handlePersistentNotificationClick}
                    onMarkAllPersistentAsRead={handleMarkAllPersistentAsRead}
                    isMobile={false}
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* User Info */}
            <div className="flex items-center gap-3 rounded-full border border-border bg-background/60 px-3 py-1.5">
              <UserCircle2 className="h-7 w-7 text-muted-foreground" />
              <div className="leading-tight">
                <p className="text-sm font-medium text-foreground">Restaurant Manager</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="inline-flex items-center gap-2"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// Notification Dropdown Component
// ============================================================================

interface NotificationDropdownProps {
  events: SSEEvent[];
  readEventIds: Set<string>;
  persistentNotifications: Notification[];
  persistentUnreadCount: number;
  soundsEnabled: boolean;
  hasEscalations: boolean;
  toggleSounds: () => void;
  clearEvents: () => void;
  dismissEvent: (eventId: string) => void;
  onViewEscalations: () => void;
  onViewOrderEvents: () => void;
  onViewReservationEvents: () => void;
  onViewNotificationHistory: () => void;
  onNotificationClick?: (event: SSEEvent) => void;
  onPersistentNotificationClick?: (notification: Notification) => void;
  onMarkAllPersistentAsRead?: () => void;
  isMobile?: boolean;
}

function NotificationDropdown({
  events,
  readEventIds,
  persistentNotifications,
  persistentUnreadCount,
  soundsEnabled,
  hasEscalations,
  toggleSounds,
  clearEvents,
  dismissEvent,
  onViewEscalations,
  onViewOrderEvents,
  onViewReservationEvents,
  onViewNotificationHistory,
  onNotificationClick,
  onPersistentNotificationClick,
  onMarkAllPersistentAsRead,
  isMobile = false,
}: NotificationDropdownProps) {
  // Total notification count (SSE + all persistent) for showing list
  const totalCount = events.length + persistentNotifications.length;
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              toggleSounds();
            }}
            title={soundsEnabled ? "Mute notification sounds" : "Enable notification sounds"}
          >
            {soundsEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          {/* Mark all persistent as read */}
          {persistentUnreadCount > 0 && onMarkAllPersistentAsRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAllPersistentAsRead();
              }}
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
          {events.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                clearEvents();
              }}
            >
              <span className="hidden sm:inline">Clear all</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Events List */}
      {totalCount > 0 ? (
        <ScrollArea className={isMobile ? "h-[calc(100vh-200px)] max-h-[500px]" : "h-[350px]"}>
          <div className="divide-y">
            {/* SSE Events (real-time) */}
            {events.map((event) => {
              const isRead = event.id ? readEventIds.has(event.id) : false;
              return (
                <div
                  key={`sse-${event.id}`}
                  role="button"
                  tabIndex={0}
                  className={`px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                    event.event_type === "escalation" ? "bg-destructive/5" : ""
                  } ${isRead ? "opacity-75" : ""}`}
                  onClick={() => {
                    if (onNotificationClick) {
                      onNotificationClick(event);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (onNotificationClick) onNotificationClick(event);
                    }
                  }}
                  aria-label={`${getEventTitle(event)}. ${getEventDescription(event) ?? ""}`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="mt-0.5 flex-shrink-0">{getEventIcon(event)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium break-words">
                            {getEventTitle(event)}
                          </p>
                          {isRead ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-primary flex-shrink-0 fill-primary" />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 flex-shrink-0 opacity-50 hover:opacity-100 mt-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissEvent(event.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {getEventDescription(event) && (
                        <p className="text-xs text-muted-foreground break-words mt-0.5">
                          {getEventDescription(event)}
                        </p>
                      )}
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Persistent Notifications (from database) - show all, read and unread */}
            {persistentNotifications.map((notification) => (
              <div
                key={`persistent-${notification.id}`}
                role="button"
                tabIndex={0}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                  notification.type === "escalation" ? "bg-destructive/5" : ""
                } ${notification.is_read ? "opacity-75" : ""}`}
                onClick={() => {
                  if (onPersistentNotificationClick) {
                    onPersistentNotificationClick(notification);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (onPersistentNotificationClick) onPersistentNotificationClick(notification);
                  }
                }}
                aria-label={`${getNotificationDisplayTitle(notification)}. ${getNotificationDisplayMessage(notification) ?? ""}`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {getPersistentNotificationIcon(notification)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium break-words">
                          {getNotificationDisplayTitle(notification)}
                        </p>
                        {notification.is_read ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-primary flex-shrink-0 fill-primary" />
                        )}
                      </div>
                    </div>
                    {getNotificationDisplayMessage(notification) && (
                      <p className="text-xs text-muted-foreground break-words mt-0.5 line-clamp-2">
                        {getNotificationDisplayMessage(notification)}
                      </p>
                    )}
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="px-4 py-8 text-center text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No notifications yet</p>
          <p className="text-xs mt-1">Events will appear here in real-time</p>
        </div>
      )}

      {/* Footer - View Links */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t bg-muted/30 space-y-2">
        <Button
          variant="default"
          size="sm"
          className="w-full text-xs sm:text-sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewEscalations();
          }}
        >
          <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
          View Escalations ({events.filter((e) => e.event_type === "escalation").length})
        </Button>
        {events.some((e) => e.event_type === "order") && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs sm:text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewOrderEvents();
            }}
          >
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Order Updates ({events.filter((e) => e.event_type === "order").length})
          </Button>
        )}
        {events.some((e) => e.event_type === "reservation") && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs sm:text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewReservationEvents();
            }}
          >
            <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Reservation Updates ({events.filter((e) => e.event_type === "reservation").length})
          </Button>
        )}
        {/* View Notification History */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs sm:text-sm border-2 border-border hover:bg-muted/50 hover:border-primary/50"
          onClick={(e) => {
            e.stopPropagation();
            onViewNotificationHistory();
          }}
        >
          <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
          View All Notifications
        </Button>
      </div>
    </>
  );
}

export default DashboardLayout;
