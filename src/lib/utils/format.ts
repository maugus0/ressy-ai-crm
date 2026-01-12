/**
 * Formatting Utility Functions
 * Shared formatting functions for dates, times, and relative time
 */

import { parseApiDate } from "@/lib/utils/timezone";

/**
 * Format a timestamp to date and time strings in local timezone
 * @param timestamp - ISO timestamp string
 * @returns Object with date and time strings
 */
export const formatDateTime = (timestamp: string) => {
  const date = parseApiDate(timestamp);
  if (!date) {
    return { date: "", time: "" };
  }
  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

/**
 * Format a timestamp as relative time (e.g., "5 minutes ago")
 * @param timestamp - ISO timestamp string
 * @returns Relative time string
 */
export const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const eventTime = parseApiDate(timestamp);
  if (!eventTime) return "";
  const diffMs = now.getTime() - eventTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

/**
 * Format a date/time string in local timezone
 * @param dateTime - ISO timestamp string
 * @param monthNames - Array of month abbreviations (default: English months)
 * @returns Object with date and time strings
 */
// Legacy name retained for compatibility; formats using local timezone.
export const formatVancouverDateTimeDirect = (
  dateTime: string,
  _monthNames: readonly string[] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
) => {
  const date = parseApiDate(dateTime);
  if (!date) return { date: "", time: "" };
  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};
