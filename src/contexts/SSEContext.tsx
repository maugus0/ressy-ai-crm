/* eslint-disable react-refresh/only-export-components */
/**
 * SSE Context
 * Provides global access to Server-Sent Events and notifications for Client Dashboard
 *
 * Features:
 * - Real-time event streaming for orders, reservations, and escalations
 * - Toast notifications for incoming events
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
import { toast } from "sonner";
import type { SSEEvent } from "@/types/api.types";
import {
  initializeAudio,
  areSoundsEnabled,
  setSoundsEnabled,
  startLoopingSound,
  stopLoopingSound,
  type NotificationEventType,
} from "@/lib/utils/notification-sounds";
import { getAccessToken } from "@/lib/api/client";

// ============================================================================
// Types
// ============================================================================

interface SSEContextType {
  /** All received events (most recent first) */
  events: SSEEvent[];
  /** Escalation events only */
  escalations: SSEEvent[];
  /** Order events only */
  orderEvents: SSEEvent[];
  /** Reservation events only */
  reservationEvents: SSEEvent[];
  /** Whether SSE connection is active */
  isConnected: boolean;
  /** Number of unread notifications */
  unreadCount: number;
  /** Whether notification sounds are enabled */
  soundsEnabled: boolean;
  /** Toggle notification sounds on/off */
  toggleSounds: () => void;
  /** Clear all events */
  clearEvents: () => void;
  /** Mark all as read (reset unread count) */
  markAsRead: () => void;
  /** Dismiss a specific event */
  dismissEvent: (eventId: string) => void;
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

// ============================================================================
// Provider
// ============================================================================

export const SSEProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundsEnabled, setSoundsEnabledState] = useState(areSoundsEnabled());
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const currentTokenRef = useRef<string | null>(null);
  const tokenCheckIntervalRef = useRef<number | null>(null);

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
   * Show toast notification based on event type and play appropriate sound
   */
  const showNotification = useCallback((event: SSEEvent) => {
    const { event_type, subtype, data } = event;
    const toastId = `${event_type}-${event.id || Date.now()}`;

    const getDescription = () => {
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

    const dismissToast = () => {
      stopLoopingSound(toastId);
      toast.dismiss(toastId);
    };

    let soundType: NotificationEventType = "generic";

    switch (event_type) {
      case "escalation":
        {
          soundType = "escalation";
          const reason = data?.reason as string;
          const urgency = data?.urgency as string;
          const escalationMessages: Record<string, string> = {
            user_requested: "Customer requested human assistance",
            internal_server_error: "System error during call",
            suspected_spam: "Call flagged as potential spam",
          };
          const baseMessage = escalationMessages[subtype] || "Unknown escalation";

          let title = "⚠️ Escalation Alert";
          if (urgency) {
            title = `⚠️ Escalation Alert (${urgency})`;
          }

          const description = reason || baseMessage;

          toast.error(title, {
            id: toastId,
            description: description,
            duration: Infinity,
            action: {
              label: "Okay",
              onClick: dismissToast,
            },
          });
        }
        break;

      case "order":
        {
          soundType = "order";
          const orderMessages: Record<string, { icon: string; title: string }> = {
            new_order: { icon: "🛍️", title: "New Order" },
            order_updated: { icon: "📝", title: "Order Updated" },
            order_cancelled: { icon: "❌", title: "Order Cancelled" },
          };
          const config = orderMessages[subtype];
          if (config) {
            toast.info(`${config.icon} ${config.title}`, {
              id: toastId,
              description: getDescription(),
              duration: Infinity,
              action: {
                label: "Okay",
                onClick: dismissToast,
              },
            });
          }
        }
        break;

      case "reservation":
        {
          soundType = "reservation";
          const reservationMessages: Record<string, { icon: string; title: string }> = {
            new_reservation: { icon: "📅", title: "New Reservation" },
            reservation_updated: { icon: "📝", title: "Reservation Updated" },
            reservation_cancelled: { icon: "❌", title: "Reservation Cancelled" },
          };
          const config = reservationMessages[subtype];
          if (config) {
            toast.info(`${config.icon} ${config.title}`, {
              id: toastId,
              description: getDescription(),
              duration: Infinity,
              action: {
                label: "Okay",
                onClick: dismissToast,
              },
            });
          }
        }
        break;

      default:
        break;
    }

    startLoopingSound(toastId, soundType);
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

      // Show toast notification
      showNotification(event);
    },
    [showNotification]
  );

  /**
   * Connect to SSE stream
   */
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      disconnectFromSSE(eventSourceRef.current);
    }

    const token = getAccessToken();
    currentTokenRef.current = token;

    const eventSource = connectToSSE({
      onEvent: handleEvent,
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
            if (isAuthenticated) {
              console.log("SSE: Attempting to reconnect...");
              connect();
            }
          }, RECONNECT_DELAY);
        }
      },
    });

    eventSourceRef.current = eventSource;
  }, [handleEvent, isAuthenticated]);

  /**
   * Connect when authenticated, disconnect when not
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();

      tokenCheckIntervalRef.current = window.setInterval(() => {
        const newToken = getAccessToken();
        if (newToken && newToken !== currentTokenRef.current) {
          console.log("SSE: Token changed, reconnecting...");
          connect();
        }
      }, 5000);
    } else {
      if (eventSourceRef.current) {
        disconnectFromSSE(eventSourceRef.current);
        eventSourceRef.current = null;
      }
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
        tokenCheckIntervalRef.current = null;
      }
      currentTokenRef.current = null;
      setIsConnected(false);
      setEvents([]);
      setUnreadCount(0);
    }

    return () => {
      if (eventSourceRef.current) {
        disconnectFromSSE(eventSourceRef.current);
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
        tokenCheckIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, user, connect]);

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
    setUnreadCount(0);
  }, []);

  /**
   * Mark all as read
   */
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  /**
   * Dismiss a specific event
   */
  const dismissEvent = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }, []);

  /**
   * Toggle notification sounds
   */
  const toggleSoundsHandler = useCallback(() => {
    const newState = !soundsEnabled;
    setSoundsEnabled(newState);
    setSoundsEnabledState(newState);
  }, [soundsEnabled]);

  // Filter events by type for convenience
  const escalations = events.filter((e) => e.event_type === "escalation");
  const orderEvents = events.filter((e) => e.event_type === "order");
  const reservationEvents = events.filter((e) => e.event_type === "reservation");

  return (
    <SSEContext.Provider
      value={{
        events,
        escalations,
        orderEvents,
        reservationEvents,
        isConnected,
        unreadCount,
        soundsEnabled,
        toggleSounds: toggleSoundsHandler,
        clearEvents,
        markAsRead,
        dismissEvent,
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
