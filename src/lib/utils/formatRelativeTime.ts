/**
 * Shared relative time formatting utility
 * Centralizes time formatting logic used across notification and escalation components
 */

import { parseApiDate } from "./timezone";

// ============================================================================
// Short Format (e.g., "5m ago", "2h ago")
// ============================================================================

/**
 * Format a timestamp to short relative time
 * Used in notification badges, compact lists
 *
 * @param timestamp - ISO timestamp string or Date object
 * @returns Short relative time string (e.g., "5m ago", "2h ago", "3d ago")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? parseApiDate(timestamp) : timestamp;
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString();
}

// ============================================================================
// Long Format (e.g., "5 minutes ago", "2 hours ago")
// ============================================================================

/**
 * Format a timestamp to longer relative time
 * Used in notification details, expanded views
 *
 * @param timestamp - ISO timestamp string or Date object
 * @returns Long relative time string (e.g., "5 minutes ago", "2 hours ago")
 */
export function formatRelativeTimeLong(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? parseApiDate(timestamp) : timestamp;
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin === 1) return "1 minute ago";
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHour === 1) return "1 hour ago";
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString();
}

// ============================================================================
// Countdown Format (e.g., "in 5 minutes", "in 2 hours")
// ============================================================================

/**
 * Format a future timestamp to countdown
 * Used for scheduled events, upcoming reservations
 *
 * @param timestamp - ISO timestamp string or Date object
 * @returns Countdown string (e.g., "in 5 minutes", "in 2 hours")
 */
export function formatCountdown(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? parseApiDate(timestamp) : timestamp;
  if (!date) return "";

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs <= 0) return "Now";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 60) return `in ${diffMin} min`;
  if (diffHour < 24) return `in ${diffHour}h`;
  if (diffDay === 1) return "Tomorrow";
  return `in ${diffDay} days`;
}
