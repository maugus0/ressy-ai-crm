/**
 * Time Utility Functions
 * Handles time format conversions and validation
 */

import type { OperatingHours } from "@/types/api.types";

// Regex patterns for time formats
const TIME_HH_MM_SS = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Days of week constant
export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// Day display names
export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/**
 * Get the day name from a Date object
 */
export const getDayName = (date: Date): DayOfWeek => {
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayMap: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return dayMap[dayIndex];
};

/**
 * Get operating hours for a specific date
 */
export const getHoursForDate = (
  operatingHours: OperatingHours | null | undefined,
  date: Date
): { open: string | null; close: string | null; is_closed: boolean; is_24_hours: boolean } => {
  if (!operatingHours) {
    return { open: null, close: null, is_closed: false, is_24_hours: false };
  }

  const dayName = getDayName(date);
  const dayHours = operatingHours[dayName];
  return {
    open: dayHours.open,
    close: dayHours.close,
    is_closed: dayHours.is_closed,
    is_24_hours: dayHours.is_24_hours ?? false,
  };
};

/**
 * Format time from HH:MM:SS to HH:MM for display
 */
export const formatTimeForDisplay = (time: string | null | undefined): string => {
  if (!time) return "";
  return time.slice(0, 5); // "09:00:00" -> "09:00"
};

/**
 * Check if a time is within operating hours for a given date
 * Returns { valid: boolean, error?: string } for detailed feedback
 */
export const isWithinOperatingHoursForDate = (
  operatingHours: OperatingHours | null | undefined,
  date: Date,
  time: string // HH:MM format
): { valid: boolean; error?: string } => {
  if (!operatingHours) {
    return { valid: true }; // No restrictions if hours not set
  }

  const dayHours = getHoursForDate(operatingHours, date);
  const dayName = getDayName(date);
  const dayLabel = DAY_LABELS[dayName];

  if (dayHours.is_closed) {
    return { valid: false, error: `Restaurant is closed on ${dayLabel}` };
  }

  // 24-hour operation - always valid
  if (dayHours.is_24_hours) {
    return { valid: true };
  }

  if (!dayHours.open || !dayHours.close) {
    return { valid: true }; // No restrictions if hours not set for this day
  }

  const openTime = dayHours.open.slice(0, 5);
  const closeTime = dayHours.close.slice(0, 5);
  const normalizedTime = time.slice(0, 5);

  // Overnight hours: close < open (e.g. 22:00–02:00). The range is treated as
  // belonging to the day the shift starts; times from midnight up to closeTime
  // are considered valid for that same day (e.g. Saturday 01:00 for Saturday 22:00–02:00).
  if (closeTime < openTime) {
    if (normalizedTime >= openTime || normalizedTime <= closeTime) {
      return { valid: true };
    }
  } else {
    // Normal case: opening < closing
    if (normalizedTime >= openTime && normalizedTime <= closeTime) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    error: `Reservation time must be within opening hours (${formatTime12Hour(openTime)} - ${formatTime12Hour(closeTime)}) on ${dayLabel}`,
  };
};

/**
 * Format time to 12-hour format with AM/PM
 */
export const formatTime12Hour = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
};

/**
 * Get available time range for a date
 * Returns { is_24_hours: true } for 24-hour days, or { start, end } for regular hours
 */
export const getAvailableTimeRange = (
  operatingHours: OperatingHours | null | undefined,
  date: Date
): { start: string; end: string; is_24_hours?: boolean } | null => {
  const dayHours = getHoursForDate(operatingHours, date);

  if (dayHours.is_closed) {
    return null;
  }

  if (dayHours.is_24_hours) {
    return { start: "00:00", end: "23:59", is_24_hours: true };
  }

  if (!dayHours.open || !dayHours.close) {
    return null;
  }

  return {
    start: formatTimeForDisplay(dayHours.open),
    end: formatTimeForDisplay(dayHours.close),
  };
};

/**
 * Validates if a time string is in valid HH:MM or HH:MM:SS format
 * with proper hour (00-23) and minute/second (00-59) ranges
 */
export const isValidTimeFormat = (time: string): boolean => {
  return TIME_HH_MM_SS.test(time) || TIME_HH_MM.test(time);
};

/**
 * Convert HH:MM to HH:MM:SS format required by backend
 * Returns undefined for empty/invalid input
 */
export const formatTimeForApi = (time: string | undefined): string | undefined => {
  if (!time || time.trim() === "") return undefined;

  // If already in HH:MM:SS format and valid, return as is
  if (TIME_HH_MM_SS.test(time)) return time;

  // If in HH:MM format and valid, append :00
  if (TIME_HH_MM.test(time)) return `${time}:00`;

  // Invalid format - return undefined
  return undefined;
};

/**
 * Convert HH:MM:SS to HH:MM format for HTML input display
 * Returns empty string for empty/invalid input
 */
export const formatTimeForInput = (time: string | null | undefined): string => {
  if (!time || time.trim() === "") return "";

  // If in HH:MM:SS format, strip seconds
  if (TIME_HH_MM_SS.test(time)) return time.slice(0, 5);

  // If already in HH:MM format, return as is
  if (TIME_HH_MM.test(time)) return time;

  // Invalid format - return empty
  return "";
};
