/**
 * Analytics Service
 * Client-scoped analytics API calls for restaurant dashboard
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AnalyticsOverview,
  CallAnalytics,
  ReservationAnalytics,
  OrderAnalytics,
  MenuAnalytics,
} from "@/types/api.types";

// ============================================================================
// Get Analytics Overview
// ============================================================================

/**
 * Get comprehensive restaurant analytics
 * GET /api/v1/client/analytics
 */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const response = await api.get<AnalyticsOverview>(ENDPOINTS.ANALYTICS.OVERVIEW);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch analytics overview");
  }
  return response.data;
}

// ============================================================================
// Get Call Analytics
// ============================================================================

/**
 * Get detailed call analytics
 * GET /api/v1/client/analytics/calls
 */
export async function getCallAnalytics(): Promise<CallAnalytics> {
  const response = await api.get<CallAnalytics>(ENDPOINTS.ANALYTICS.CALLS);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch call analytics");
  }
  return response.data;
}

// ============================================================================
// Get Reservation Analytics
// ============================================================================

/**
 * Get detailed reservation analytics
 * GET /api/v1/client/analytics/reservations
 */
export async function getReservationAnalytics(): Promise<ReservationAnalytics> {
  const response = await api.get<ReservationAnalytics>(ENDPOINTS.ANALYTICS.RESERVATIONS);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch reservation analytics");
  }
  return response.data;
}

// ============================================================================
// Get Order Analytics
// ============================================================================

/**
 * Get detailed order analytics
 * GET /api/v1/client/analytics/orders
 */
export async function getOrderAnalytics(): Promise<OrderAnalytics> {
  const response = await api.get<OrderAnalytics>(ENDPOINTS.ANALYTICS.ORDERS);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch order analytics");
  }
  return response.data;
}

// ============================================================================
// Get Menu Analytics
// ============================================================================

/**
 * Get detailed menu analytics
 * GET /api/v1/client/analytics/menu
 */
export async function getMenuAnalytics(): Promise<MenuAnalytics> {
  const response = await api.get<MenuAnalytics>(ENDPOINTS.ANALYTICS.MENU);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch menu analytics");
  }
  return response.data;
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  AnalyticsOverview,
  CallAnalytics,
  ReservationAnalytics,
  OrderAnalytics,
  MenuAnalytics,
  AnalyticsRecentActivity,
  AnalyticsTodaySchedule,
  AnalyticsPendingOrder,
} from "@/types/api.types";
