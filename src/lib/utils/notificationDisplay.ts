/**
 * Notification display helpers
 * Human-readable labels for notification types and subtypes
 */

import type { EscalationSubtype, Notification, SystemSubtype } from "@/types/notification.types";

/** Human-readable labels for escalation subtypes */
export const ESCALATION_SUBTYPE_LABELS: Record<EscalationSubtype, string> = {
  user_requested: "Human Assistance Requested",
  internal_server_error: "System Error",
  suspected_spam: "Spam Detected",
  sms_redirect_failed: "SMS Redirect Failed",
  kill_switch_redirected: "RessyAI Agent Bypassed",
};

export const SYSTEM_SUBTYPE_LABELS: Record<SystemSubtype, string> = {
  kill_switch_toggled: "RessyAI Agent Status Updated",
  kill_switch_bulk_updated: "RessyAI Agent Bulk Status Updated",
};

/**
 * Get display title for a notification.
 * Prefers data.title (from backend) when available; otherwise uses notification.title
 * or a friendly subtype label for escalation types.
 */
export function getNotificationDisplayTitle(notification: Notification): string {
  if (notification.type === "system" && notification.subtype === "kill_switch_toggled") {
    const enabled = Boolean(notification.data?.enabled);
    return enabled ? "RessyAI Agent Disabled" : "RessyAI Agent Enabled";
  }

  if (notification.type === "system" && notification.subtype) {
    const label = SYSTEM_SUBTYPE_LABELS[notification.subtype as SystemSubtype];
    if (label) return label;
  }

  const dataTitle = notification.data?.title;
  if (dataTitle && typeof dataTitle === "string") {
    return dataTitle;
  }

  if (notification.type === "escalation" && notification.subtype) {
    const label = ESCALATION_SUBTYPE_LABELS[notification.subtype as EscalationSubtype];
    if (label) return label;
  }
  return notification.title;
}

/**
 * Get display message/description for a notification.
 * Prefers data.description (from backend) when available; otherwise uses notification.message.
 */
export function getNotificationDisplayMessage(notification: Notification): string {
  if (notification.type === "system" && notification.subtype === "kill_switch_toggled") {
    const actor =
      (notification.data?.actor_email as string) || (notification.data?.actor_type as string);
    return actor ? `Changed by ${actor}` : notification.message;
  }

  if (notification.type === "system" && notification.subtype === "kill_switch_bulk_updated") {
    const updatedCount = Number(notification.data?.updated_count ?? 0);
    const skippedCount = Number(notification.data?.skipped_count ?? 0);
    return `Updated ${updatedCount} restaurants, skipped ${skippedCount}.`;
  }

  const dataDesc = notification.data?.description;
  if (dataDesc && typeof dataDesc === "string") {
    return dataDesc;
  }
  return notification.message;
}

/**
 * Get human-readable label for escalation subtype.
 * Use for Type column/badge when displaying escalation notifications.
 */
export function getEscalationSubtypeLabel(subtype: string): string {
  return ESCALATION_SUBTYPE_LABELS[subtype as EscalationSubtype] ?? subtype.replace(/_/g, " ");
}
