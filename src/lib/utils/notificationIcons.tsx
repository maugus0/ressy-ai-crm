/**
 * Shared notification type icon utilities
 * Provides consistent icons and colors for notification types
 */

import { Bell, ShoppingBag, CalendarDays, AlertTriangle } from "lucide-react";
import type { NotificationType } from "@/types/notification.types";

// ============================================================================
// Icon Components
// ============================================================================

/**
 * Get icon component for notification type
 *
 * @param type - Notification type (order, reservation, escalation)
 * @param className - Additional CSS classes (default: "h-4 w-4")
 * @returns React element with appropriate icon and color
 */
export function getNotificationTypeIcon(
  type: NotificationType,
  className = "h-4 w-4"
): React.ReactElement {
  switch (type) {
    case "order":
      return <ShoppingBag className={`${className} text-blue-500`} />;
    case "reservation":
      return <CalendarDays className={`${className} text-green-500`} />;
    case "escalation":
      return <AlertTriangle className={`${className} text-destructive`} />;
    default:
      return <Bell className={className} />;
  }
}

// ============================================================================
// Badge Colors
// ============================================================================

/**
 * Badge/chip colors for notification types
 */
export const notificationTypeBadgeColors: Record<NotificationType, string> = {
  order: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  reservation: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  escalation: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

/**
 * Get badge color class for notification type
 */
export function getNotificationTypeBadgeColor(type: NotificationType): string {
  return (
    notificationTypeBadgeColors[type] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  );
}

// ============================================================================
// Type Labels
// ============================================================================

/**
 * Human-readable labels for notification types
 */
export const notificationTypeLabels: Record<NotificationType, string> = {
  order: "Order",
  reservation: "Reservation",
  escalation: "Escalation",
};

/**
 * Get human-readable label for notification type
 */
export function getNotificationTypeLabel(type: NotificationType): string {
  return notificationTypeLabels[type] || type;
}
