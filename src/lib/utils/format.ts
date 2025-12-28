/**
 * Formatting Utility Functions
 * Shared formatting functions for dates, times, and relative time
 */

/**
 * Format a timestamp to date and time strings in Vancouver timezone
 * @param timestamp - ISO timestamp string
 * @returns Object with date and time strings
 */
export const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Vancouver",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Vancouver",
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
  const eventTime = new Date(timestamp);
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
 * Format a date/time string that's already in Vancouver local time
 * Assumes the input is in format "YYYY-MM-DDTHH:mm:ss" (Vancouver local time, no timezone)
 * Formats as "Dec 28, 2025" and "7:00 PM" (12-hour format)
 * @param dateTime - Date/time string in format "YYYY-MM-DDTHH:mm:ss" (Vancouver local time)
 * @param monthNames - Array of month abbreviations (default: English months)
 * @returns Object with date and time strings
 */
export const formatVancouverDateTimeDirect = (
  dateTime: string,
  monthNames: readonly string[] = [
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
  // API returns date_time in Vancouver time already (e.g., "2025-12-28T19:00:00")
  // Format it directly without timezone conversion since it's already in Vancouver time
  const [datePart, timePart] = dateTime.split("T");
  if (!datePart || !timePart) {
    return { date: "", time: "" };
  }

  // Parse the date parts
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // Format date: "Dec 28, 2025"
  const dateStr = `${monthNames[month - 1]} ${day}, ${year}`;

  // Format time: "7:00 PM" (12-hour format)
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  const minuteStr = minute.toString().padStart(2, "0");
  const timeStr = `${hour12}:${minuteStr} ${ampm}`;

  return {
    date: dateStr,
    time: timeStr,
  };
};
