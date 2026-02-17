/**
 * Dashboard Notification Service
 * Handles persistent notification operations for Client Dashboard
 * Includes mark-as-read functionality (Client Dashboard only)
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  Notification,
  NotificationListResponse,
  NotificationQueryParams,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  NotificationType,
} from "@/types/notification.types";

// ============================================================================
// List Notifications
// ============================================================================

/**
 * Get notifications for authenticated restaurant
 * GET /api/v1/dashboard/notifications
 *
 * @param params - Query parameters for filtering and pagination
 * @returns NotificationListResponse with notifications, total, and unread_count
 */
export async function getDashboardNotifications(
  params?: NotificationQueryParams
): Promise<NotificationListResponse> {
  const queryParams: Record<string, string | number | boolean | undefined> = {};

  if (params?.type) queryParams.type = params.type;
  if (params?.is_read !== undefined) queryParams.is_read = params.is_read;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.offset) queryParams.offset = params.offset;

  const response = await api.get<NotificationListResponse>(ENDPOINTS.DASHBOARD_NOTIFICATIONS.LIST, {
    params: queryParams,
  });

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch notifications");
  }

  return response.data;
}

// ============================================================================
// Get Unread Count
// ============================================================================

/**
 * Get unread notification count
 * GET /api/v1/dashboard/notifications/unread-count
 *
 * @returns Number of unread notifications
 */
export async function getUnreadCount(): Promise<number> {
  const response = await api.get<UnreadCountResponse>(
    ENDPOINTS.DASHBOARD_NOTIFICATIONS.UNREAD_COUNT
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch unread count");
  }

  return response.data.unread_count;
}

// ============================================================================
// Get Single Notification
// ============================================================================

/**
 * Get single notification by ID
 * GET /api/v1/dashboard/notifications/{id}
 *
 * @param id - Notification ID
 * @returns Notification object
 */
export async function getNotification(id: number): Promise<Notification> {
  const response = await api.get<Notification>(ENDPOINTS.DASHBOARD_NOTIFICATIONS.GET(id));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch notification");
  }

  return response.data;
}

// ============================================================================
// Mark as Read
// ============================================================================

/**
 * Mark a single notification as read
 * PATCH /api/v1/dashboard/notifications/{id}/read
 *
 * @param id - Notification ID
 * @returns Updated notification with is_read=true and read_at timestamp
 */
export async function markNotificationAsRead(id: number): Promise<MarkAsReadResponse> {
  const response = await api.patch<MarkAsReadResponse>(
    ENDPOINTS.DASHBOARD_NOTIFICATIONS.MARK_READ(id)
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to mark notification as read");
  }

  return response.data;
}

/**
 * Mark all notifications as read
 * PATCH /api/v1/dashboard/notifications/read-all
 *
 * @param type - Optional: filter by notification type
 * @returns Number of notifications marked as read
 */
export async function markAllNotificationsAsRead(
  type?: NotificationType
): Promise<MarkAllAsReadResponse> {
  const params = type ? { type } : undefined;

  const response = await api.patch<MarkAllAsReadResponse>(
    ENDPOINTS.DASHBOARD_NOTIFICATIONS.MARK_ALL_READ,
    undefined,
    { params }
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to mark all notifications as read");
  }

  return response.data;
}

// ============================================================================
// Re-export Types
// ============================================================================

export type {
  Notification,
  NotificationListResponse,
  NotificationQueryParams,
  NotificationType,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
};
