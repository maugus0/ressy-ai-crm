/**
 * Notification click navigation helper
 * Returns the path + search to show the relevant order, reservation, escalation, or call
 */

import type { Notification } from "@/types/notification.types";

// ============================================================================
// Types
// ============================================================================

export interface NavigationTarget {
  /** Route path (e.g., "/dashboard/orders") */
  path: string;
  /** Query string without leading ? (e.g., "order_id=123") */
  search?: string;
}

/** Backend may use call_id, call_sid, or twilio_call_sid */
function getCallIdFromData(d: Record<string, unknown>): string | undefined {
  if (d.call_id != null) return String(d.call_id);
  if (d.call_sid != null) return String(d.call_sid);
  if (d.twilio_call_sid != null) return String(d.twilio_call_sid);
  return undefined;
}

// ============================================================================
// Navigation Logic
// ============================================================================

/**
 * Get navigation target for a notification click
 * Determines where to navigate based on notification type and data
 *
 * @param notification - The notification object
 * @returns NavigationTarget with path and optional search params
 */
export function getNotificationNavigationTarget(notification: Notification): NavigationTarget {
  const { type, entity_id, data } = notification;
  const d = data ?? {};

  switch (type) {
    case "order": {
      const orderId = (d.order_id as number | undefined) ?? entity_id;
      if (orderId != null) {
        return { path: "/dashboard/orders", search: `order_id=${orderId}` };
      }
      return { path: "/dashboard/orders" };
    }

    case "reservation": {
      const reservationId = (d.reservation_id as number | undefined) ?? entity_id;
      if (reservationId != null) {
        return { path: "/dashboard/reservations", search: `reservation_id=${reservationId}` };
      }
      return { path: "/dashboard/reservations" };
    }

    case "escalation": {
      const escalationId = d.escalation_id as number | undefined;
      const callId = getCallIdFromData(d as Record<string, unknown>);

      // If we have escalation_id, go to escalation detail
      if (escalationId != null) {
        return { path: `/dashboard/escalations/${escalationId}` };
      }

      // Otherwise show the call where escalation happened
      const callIdFallback = callId ?? (entity_id != null ? String(entity_id) : undefined);
      if (callIdFallback) {
        return {
          path: "/dashboard/calls",
          search: `call_id=${encodeURIComponent(callIdFallback)}`,
        };
      }

      return { path: "/dashboard/escalations" };
    }

    case "system": {
      if (
        notification.subtype === "kill_switch_toggled" ||
        notification.subtype === "kill_switch_bulk_updated"
      ) {
        return { path: "/dashboard/settings" };
      }
      return { path: "/dashboard/notifications" };
    }

    default:
      return { path: "/dashboard/notifications" };
  }
}

/**
 * Build full URL from navigation target
 *
 * @param target - NavigationTarget object
 * @returns Full URL string with path and query params
 */
export function buildNavigationUrl(target: NavigationTarget): string {
  if (target.search) {
    return `${target.path}?${target.search}`;
  }
  return target.path;
}
