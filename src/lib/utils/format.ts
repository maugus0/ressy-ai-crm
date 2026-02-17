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
 * @deprecated Use formatRelativeTimeLong from "@/lib/utils/formatRelativeTime" instead
 * @param timestamp - ISO timestamp string
 * @returns Relative time string
 */
export { formatRelativeTimeLong as formatRelativeTime } from "@/lib/utils/formatRelativeTime";

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
