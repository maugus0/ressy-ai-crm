/* eslint-disable react-refresh/only-export-components */
/**
 * SSE Context
 * Provides global access to Server-Sent Events and notifications for Client Dashboard
 *
 * Features:
 * - Real-time event streaming for orders, reservations, and escalations
 * - Persistent notifications from database (catch-up on login)
 * - Mark-as-read functionality for persistent notifications
 * - Audio notifications (respects user preferences)
 * - Automatic reconnection on connection loss
 * - Event storage for notification dropdown
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { connectToSSE, disconnectFromSSE } from "@/services/sse";
import { useAuth } from "./AuthContext";
import type { SSEEvent } from "@/types/api.types";
import type { Notification, NotificationType } from "@/types/notification.types";
import {
  getDashboardNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/notifications";
import {
  initializeAudio,
  areSoundsEnabled,
  setSoundsEnabled,
  startLoopingSound,
  stopLoopingSound,
  stopAllLoopingSounds,
  type NotificationEventType,
} from "@/lib/utils/notification-sounds";
import { TOKEN_REFRESHED_EVENT } from "@/lib/utils/tokenRefresh";

// ============================================================================
// Types
// ============================================================================

interface SSEContextType {
  // ============================================================================
  // Real-time SSE Events (in-memory)
  // ============================================================================
  /** All received SSE events (most recent first) */
  events: SSEEvent[];
  /** Escalation events only */
  escalations: SSEEvent[];
  /** Order events only */
  orderEvents: SSEEvent[];
  /** Reservation events only */
  reservationEvents: SSEEvent[];
  /** Whether SSE connection is active */
  isConnected: boolean;
  /** Number of unread SSE notifications */
  unreadCount: number;
  /** Set of event IDs that have been read (clicked) */
  readEventIds: Set<string>;
  /** Whether notification sounds are enabled */
  soundsEnabled: boolean;
  /** Toggle notification sounds on/off */
  toggleSounds: () => void;
  /** Clear all SSE events */
  clearEvents: () => void;
  /** Mark all SSE events as read (reset unread count) */
  markAsRead: () => void;
  /** Mark a specific SSE event as read */
  markEventAsRead: (eventId: string) => void;
  /** Dismiss a specific SSE event */
  dismissEvent: (eventId: string) => void;
  /** Stop sound for a specific event without dismissing it */
  stopEventSound: (eventId: string) => void;

  // ============================================================================
  // Persistent Notifications (from database)
  // ============================================================================
  /** Persistent notifications from database */
  persistentNotifications: Notification[];
  /** Total count of persistent notifications */
  persistentTotal: number;
  /** Unread count for persistent notifications */
  persistentUnreadCount: number;
  /** Loading state for persistent notifications */
  isPersistentLoading: boolean;
  /** Fetch persistent notifications from API */
  fetchPersistentNotifications: (limit?: number) => Promise<void>;
  /** Refresh unread count from API */
  refreshUnreadCount: () => Promise<void>;
  /** Mark a persistent notification as read (API call) */
  markPersistentAsRead: (notificationId: number) => Promise<void>;
  /** Mark all persistent notifications as read (API call) */
  markAllPersistentAsRead: (type?: NotificationType) => Promise<void>;

  // ============================================================================
  // Combined Counts
  // ============================================================================
  /** Total unread count (SSE + persistent) */
  totalUnreadCount: number;
}

// ============================================================================
// Context
// ============================================================================

const SSEContext = createContext<SSEContextType | undefined>(undefined);

// ============================================================================
// Constants
// ============================================================================

const MAX_EVENTS = 100; // Keep last 100 events in memory
const RECONNECT_DELAY = 5000; // 5 seconds

/**
 * Generate a consistent sound ID for an event
 * Uses event.id if available, otherwise uses timestamp + event_type for stability
 * This ensures the same event always gets the same sound ID, even without an ID field
 */
const getSoundId = (event: SSEEvent): string => {
  // If event has an id, use it for consistent sound tracking
  if (event.id) {
    return `${event.event_type}-${event.id}`;
  }
  // Fallback: use timestamp + event_type as a stable identifier
  // This ensures the same event object always gets the same sound ID
  return `${event.event_type}-fallback-${event.timestamp}`;
};

// ============================================================================
// Provider
// ============================================================================

export const SSEProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  // ============================================================================
  // SSE State (real-time, in-memory)
  // ============================================================================
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readEventIds, setReadEventIds] = useState<Set<string>>(new Set());
  const [soundsEnabled, setSoundsEnabledState] = useState(areSoundsEnabled());
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // ============================================================================
  // Persistent Notification State (from database)
  // ============================================================================
  const [persistentNotifications, setPersistentNotifications] = useState<Notification[]>([]);
  const [persistentTotal, setPersistentTotal] = useState(0);
  const [persistentUnreadCount, setPersistentUnreadCount] = useState(0);
  const [isPersistentLoading, setIsPersistentLoading] = useState(false);

  // Initialize audio context on mount (for user interaction)
  useEffect(() => {
    // Initialize on first click/keypress to comply with browser autoplay policies
    const handleUserInteraction = () => {
      initializeAudio();
      // Remove listeners after first interaction
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  /**
   * Play notification sound based on event type
   * Sound loops until notification is clicked or cleared from the panel
   */
  const playEventSound = useCallback((event: SSEEvent) => {
    const { event_type, subtype } = event;
    const soundId = getSoundId(event);

    let soundType: NotificationEventType = "generic";
    let shouldPlaySound = false;

    switch (event_type) {
      case "escalation":
        soundType = "escalation";
        shouldPlaySound = true;
        break;

      case "order":
        soundType = "order";
        // Only play for recognized order subtypes
        shouldPlaySound = ["new_order", "order_updated", "order_cancelled"].includes(subtype);
        break;

      case "reservation":
        soundType = "reservation";
        // Only play for recognized reservation subtypes
        shouldPlaySound = [
          "new_reservation",
          "reservation_updated",
          "reservation_cancelled",
        ].includes(subtype);
        break;

      default:
        break;
    }

    if (shouldPlaySound) {
      startLoopingSound(soundId, soundType);
    }
  }, []);

  /**
   * Handle incoming SSE event
   */
  const handleEvent = useCallback(
    (event: SSEEvent) => {
      // Add event to the list (most recent first)
      setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));

      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // Play notification sound (loops until dismissed)
      playEventSound(event);
    },
    [playEventSound]
  );

  // Store handleEvent in a ref to avoid recreating connect on every render
  const handleEventRef = useRef(handleEvent);
  handleEventRef.current = handleEvent;

  // Store isAuthenticated in a ref for use in reconnect timeout
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  /**
   * Connect to SSE stream
   * Using refs to avoid dependency on handleEvent which changes frequently
   * This function is stable (empty dependency array) so it won't cause unnecessary reconnections
   */
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      disconnectFromSSE(eventSourceRef.current);
    }

    const eventSource = connectToSSE({
      onEvent: (event) => handleEventRef.current(event),
      onOpen: () => {
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      },
      onError: () => {
        setIsConnected(false);

        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectTimeoutRef.current = null;
            if (isAuthenticatedRef.current) {
              console.log("SSE: Attempting to reconnect...");
              connect();
            }
          }, RECONNECT_DELAY);
        }
      },
    });

    eventSourceRef.current = eventSource;
  }, []);

  // Store connect in a ref to avoid including it in useEffect dependencies
  // Since connect is stable (empty deps), we can safely reference it via ref
  const connectRef = useRef(connect);
  connectRef.current = connect;

  /**
   * Connect when authenticated, disconnect when not
   * Note: connect is intentionally excluded from dependencies since it's stable
   * and uses refs internally to access the latest handleEvent and isAuthenticated
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      connectRef.current();

      // Listen for token refresh events instead of polling
      const handleTokenRefresh = () => {
        console.log("SSE: Token refreshed, reconnecting...");
        connectRef.current();
      };

      window.addEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefresh);

      return () => {
        window.removeEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefresh);
        if (eventSourceRef.current) {
          disconnectFromSSE(eventSourceRef.current);
          eventSourceRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        // Stop all active sound loops on unmount to prevent orphaned sounds
        stopAllLoopingSounds();
      };
    } else {
      if (eventSourceRef.current) {
        disconnectFromSSE(eventSourceRef.current);
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      setEvents([]);
      setUnreadCount(0);
      setReadEventIds(new Set());
      // Stop all active sound loops when disconnecting
      stopAllLoopingSounds();
    }
  }, [isAuthenticated, user]);

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    // Stop all active sound loops
    stopAllLoopingSounds();
    // Clear events and reset unread count
    setEvents([]);
    setUnreadCount(0);
    setReadEventIds(new Set());
  }, []);

  /**
   * Mark all as read
   */
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
    setReadEventIds((prev) => {
      const newSet = new Set(prev);
      events.forEach((event) => {
        if (event.id) {
          newSet.add(event.id);
        }
      });
      return newSet;
    });
  }, [events]);

  /**
   * Mark a specific event as read
   */
  const markEventAsRead = useCallback((eventId: string) => {
    setReadEventIds((prev) => {
      // Check if event was already read before adding it
      const wasAlreadyRead = prev.has(eventId);
      const newSet = new Set(prev);
      newSet.add(eventId);

      // Only decrement unread count if this event was not already read
      if (!wasAlreadyRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      return newSet;
    });
  }, []);

  /**
   * Stop sound for a specific event without dismissing it
   */
  const stopEventSound = useCallback((eventId: string) => {
    // Find the event to get its type for sound cleanup
    setEvents((prev) => {
      const event = prev.find((e) => e.id === eventId);
      if (event) {
        // Use the same getSoundId function for consistency
        const soundId = getSoundId(event);
        // Stop the sound loop for this specific notification
        stopLoopingSound(soundId);
      }
      // Return events unchanged (don't remove the event)
      return prev;
    });
  }, []);

  /**
   * Dismiss a specific event
   */
  const dismissEvent = useCallback((eventId: string) => {
    setEvents((prev) => {
      // Find the event being dismissed to get its type for sound cleanup
      const eventToDismiss = prev.find((e) => e.id === eventId);
      if (eventToDismiss) {
        // Use the same getSoundId function for consistency
        const soundId = getSoundId(eventToDismiss);
        // Stop the sound loop for this specific notification
        stopLoopingSound(soundId);
      }
      // Remove the event from the list
      return prev.filter((e) => e.id !== eventId);
    });
  }, []);

  /**
   * Toggle notification sounds
   */
  const toggleSoundsHandler = useCallback(() => {
    const newState = !soundsEnabled;
    setSoundsEnabled(newState);
    setSoundsEnabledState(newState);
  }, [soundsEnabled]);

  // ============================================================================
  // Persistent Notification Functions
  // ============================================================================

  /**
   * Fetch persistent notifications from API (catch-up on login)
   * Fetches all notifications (read + unread) so the notification panel can display both
   */
  const fetchPersistentNotifications = useCallback(async (limit = 50) => {
    setIsPersistentLoading(true);
    try {
      const response = await getDashboardNotifications({
        limit,
        // No is_read filter - get all so panel can show read and unread
      });
      setPersistentNotifications(response.notifications);
      setPersistentTotal(response.total);
      setPersistentUnreadCount(response.unread_count);
    } catch (error) {
      console.error("Failed to fetch persistent notifications:", error);
    } finally {
      setIsPersistentLoading(false);
    }
  }, []);

  /**
   * Refresh unread count from API
   */
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setPersistentUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  /**
   * Mark a persistent notification as read (API call)
   */
  const markPersistentAsRead = useCallback(async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      // Update local state
      setPersistentNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setPersistentUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }
  }, []);

  /**
   * Mark all persistent notifications as read (API call)
   * When type is provided, only that type is marked read; unread count is decremented by that type's unread count.
   */
  const markAllPersistentAsRead = useCallback(
    async (type?: NotificationType) => {
      const notificationsSnapshot = persistentNotifications;
      const unreadMarkedCount = type
        ? notificationsSnapshot.filter((n) => n.type === type && !n.is_read).length
        : notificationsSnapshot.filter((n) => !n.is_read).length;

      try {
        await markAllNotificationsAsRead(type);
        const now = new Date().toISOString();
        setPersistentNotifications((prev) =>
          prev.map((n) => (!type || n.type === type ? { ...n, is_read: true, read_at: now } : n))
        );
        setPersistentUnreadCount((prev) => Math.max(0, prev - unreadMarkedCount));
      } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
        throw error;
      }
    },
    [persistentNotifications]
  );

  /**
   * Fetch persistent notifications on authentication
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPersistentNotifications();
    } else {
      // Clear persistent state on logout
      setPersistentNotifications([]);
      setPersistentTotal(0);
      setPersistentUnreadCount(0);
    }
  }, [isAuthenticated, user, fetchPersistentNotifications]);

  // Filter events by type for convenience
  const escalations = events.filter((e) => e.event_type === "escalation");
  const orderEvents = events.filter((e) => e.event_type === "order");
  const reservationEvents = events.filter((e) => e.event_type === "reservation");

  // Combined unread count (SSE + persistent)
  const totalUnreadCount = unreadCount + persistentUnreadCount;

  return (
    <SSEContext.Provider
      value={{
        // SSE (real-time)
        events,
        escalations,
        orderEvents,
        reservationEvents,
        isConnected,
        unreadCount,
        readEventIds,
        soundsEnabled,
        toggleSounds: toggleSoundsHandler,
        clearEvents,
        markAsRead,
        markEventAsRead,
        dismissEvent,
        stopEventSound,
        // Persistent notifications
        persistentNotifications,
        persistentTotal,
        persistentUnreadCount,
        isPersistentLoading,
        fetchPersistentNotifications,
        refreshUnreadCount,
        markPersistentAsRead,
        markAllPersistentAsRead,
        // Combined
        totalUnreadCount,
      }}
    >
      {children}
    </SSEContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useSSE = () => {
  const context = useContext(SSEContext);
  if (context === undefined) {
    throw new Error("useSSE must be used within an SSEProvider");
  }
  return context;
};
