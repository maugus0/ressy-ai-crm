/**
 * Persistent Notification Types for Client Dashboard
 * Maps to backend Notifications table and API responses
 *
 * These types are for database-persisted notifications fetched via API,
 * separate from real-time SSE events (see api.types.ts for SSEEvent).
 */

// ============================================================================
// Enums / Literal Types
// ============================================================================

/** Notification types matching backend enum */
export type NotificationType = "order" | "reservation" | "escalation";

/** Escalation subtypes from backend (user_requested, internal_server_error, etc.) */
export type EscalationSubtype =
  | "user_requested"
  | "internal_server_error"
  | "suspected_spam"
  | "sms_redirect_failed";

/** Notification subtypes for granular categorization */
export type NotificationSubtype =
  | "new_order"
  | "order_modified"
  | "order_cancelled"
  | "new_reservation"
  | "reservation_modified"
  | "reservation_cancelled"
  | "escalation_raised"
  | "escalation_resolved"
  | EscalationSubtype;

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Single notification entity from API
 * GET /api/v1/dashboard/notifications/{id}
 */
export interface Notification {
  id: number;
  restaurant_id: number;
  type: NotificationType;
  subtype: NotificationSubtype | null;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  entity_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// ============================================================================
// API Response Interfaces
// ============================================================================

/**
 * API response for notification list
 * GET /api/v1/dashboard/notifications
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

/**
 * API response for unread count
 * GET /api/v1/dashboard/notifications/unread-count
 */
export interface UnreadCountResponse {
  unread_count: number;
}

/**
 * API response for mark as read
 * PATCH /api/v1/dashboard/notifications/{id}/read
 */
export interface MarkAsReadResponse {
  id: number;
  is_read: boolean;
  read_at: string;
}

/**
 * API response for mark all as read
 * PATCH /api/v1/dashboard/notifications/read-all
 */
export interface MarkAllAsReadResponse {
  marked_count: number;
}

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for notification list
 * GET /api/v1/dashboard/notifications?type=order&is_read=false&limit=50&offset=0
 */
export interface NotificationQueryParams {
  type?: NotificationType;
  is_read?: boolean;
  limit?: number;
  offset?: number;
}
