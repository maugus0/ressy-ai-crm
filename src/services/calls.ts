/**
 * Calls Service
 * Client-scoped calls API for restaurant dashboard
 * All endpoints are auto-scoped to the authenticated restaurant via JWT token
 */

import { api, getAccessToken, buildQueryString } from "@/lib/api/client";
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
  const response = await api.get<ClientCallListResponse>(ENDPOINTS.CALLS.LIST, {
    params: params
      ? {
          date_from: params.date_from,
          date_to: params.date_to,
          status: params.status,
          duration_min: params.duration_min,
          duration_max: params.duration_max,
          caller_phone: params.caller_phone,
          page: params.page,
          limit: params.limit,
          sort_by: params.sort_by,
          sort_order: params.sort_order,
        }
      : undefined,
  });
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
  const response = await api.get<ClientCallAnalyticsResponse>(ENDPOINTS.CALLS.ANALYTICS, {
    params: {
      date_from: dateFrom,
      date_to: dateTo,
    },
  });

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
  const response = await api.get<ClientCallListResponse>(ENDPOINTS.CALLS.SEARCH, {
    params: {
      q: params.q,
      date_from: params.date_from,
      date_to: params.date_to,
      page: params.page,
      limit: params.limit,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
    },
  });

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
  const queryString = buildQueryString(
    params
      ? {
          date_from: params.date_from,
          date_to: params.date_to,
          status: params.status,
          duration_min: params.duration_min,
          duration_max: params.duration_max,
          caller_phone: params.caller_phone,
          sort_by: params.sort_by,
          sort_order: params.sort_order,
          page: params.page,
          limit: params.limit,
        }
      : undefined
  );
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
