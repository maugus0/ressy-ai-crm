/**
 * Calls Service
 * Client-scoped calls API for restaurant dashboard
 * All endpoints are auto-scoped to the authenticated restaurant via JWT token
 */

import { api, getAccessToken } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { env } from "@/config/env";
import type {
  ClientCallListItem,
  ClientCallListResponse,
  ClientCallListParams,
  ClientCallDetails,
  ClientCallSearchParams,
  ClientCallAnalyticsResponse,
  ClientCallExportParams,
} from "@/types/api.types";

// ============================================================================
// Get Calls List
// ============================================================================

/**
 * Get paginated call history with filtering and sorting
 * GET /api/v1/client/calls
 */
export async function getCalls(params?: ClientCallListParams): Promise<ClientCallListResponse> {
  // Build query string
  const queryParams = new URLSearchParams();

  if (params?.date_from) queryParams.append("date_from", params.date_from);
  if (params?.date_to) queryParams.append("date_to", params.date_to);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.duration_min !== undefined)
    queryParams.append("duration_min", params.duration_min.toString());
  if (params?.duration_max !== undefined)
    queryParams.append("duration_max", params.duration_max.toString());
  if (params?.caller_phone) queryParams.append("caller_phone", params.caller_phone);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort_by) queryParams.append("sort_by", params.sort_by);
  if (params?.sort_order) queryParams.append("sort_order", params.sort_order);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `${ENDPOINTS.CALLS.LIST}?${queryString}` : ENDPOINTS.CALLS.LIST;

  const response = await api.get<ClientCallListResponse>(endpoint);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch calls");
  }
  return response.data;
}

// ============================================================================
// Get Call Details
// ============================================================================

/**
 * Get full call details with transcript
 * GET /api/v1/client/calls/{call_id}
 */
export async function getCallDetails(callId: string): Promise<ClientCallDetails> {
  const response = await api.get<ClientCallDetails>(ENDPOINTS.CALLS.GET(callId));
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch call details");
  }
  return response.data;
}

// ============================================================================
// Get Call Analytics
// ============================================================================

/**
 * Get call analytics for a date range
 * GET /api/v1/client/calls/analytics
 */
export async function getCallAnalytics(
  dateFrom: string,
  dateTo: string
): Promise<ClientCallAnalyticsResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append("date_from", dateFrom);
  queryParams.append("date_to", dateTo);

  const endpoint = `${ENDPOINTS.CALLS.ANALYTICS}?${queryParams.toString()}`;
  const response = await api.get<ClientCallAnalyticsResponse>(endpoint);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch call analytics");
  }
  return response.data;
}

// ============================================================================
// Search Calls
// ============================================================================

/**
 * Search calls by phone or transcript text
 * GET /api/v1/client/calls/search
 */
export async function searchCalls(params: ClientCallSearchParams): Promise<ClientCallListResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append("q", params.q);

  if (params.date_from) queryParams.append("date_from", params.date_from);
  if (params.date_to) queryParams.append("date_to", params.date_to);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.sort_by) queryParams.append("sort_by", params.sort_by);
  if (params.sort_order) queryParams.append("sort_order", params.sort_order);

  const endpoint = `${ENDPOINTS.CALLS.SEARCH}?${queryParams.toString()}`;
  const response = await api.get<ClientCallListResponse>(endpoint);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to search calls");
  }
  return response.data;
}

// ============================================================================
// Export Calls
// ============================================================================

/**
 * Export calls as CSV
 * GET /api/v1/client/calls/export
 * Returns a Blob for download
 */
export async function exportCalls(params?: ClientCallExportParams): Promise<Blob> {
  const queryParams = new URLSearchParams();

  if (params?.date_from) queryParams.append("date_from", params.date_from);
  if (params?.date_to) queryParams.append("date_to", params.date_to);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.duration_min !== undefined)
    queryParams.append("duration_min", params.duration_min.toString());
  if (params?.duration_max !== undefined)
    queryParams.append("duration_max", params.duration_max.toString());
  if (params?.caller_phone) queryParams.append("caller_phone", params.caller_phone);
  if (params?.sort_by) queryParams.append("sort_by", params.sort_by);
  if (params?.sort_order) queryParams.append("sort_order", params.sort_order);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `${ENDPOINTS.CALLS.EXPORT}?${queryString}`
    : ENDPOINTS.CALLS.EXPORT;

  const url = `${env.API_URL}${endpoint}`;
  const token = getAccessToken();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/csv",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to export calls: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Download exported calls CSV
 * Helper function to trigger browser download
 */
export function downloadCallsCSV(blob: Blob, filename?: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `calls-export-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  ClientCallListItem,
  ClientCallListResponse,
  ClientCallListParams,
  ClientCallDetails,
  ClientCallSearchParams,
  ClientCallAnalyticsResponse,
  ClientCallExportParams,
  ClientCallTranscriptEntry,
  ClientCallConversionRates,
} from "@/types/api.types";
