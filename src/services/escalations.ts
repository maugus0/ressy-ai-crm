/**
 * Client Escalation Service
 * Handles escalation operations scoped to authenticated restaurant
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  Escalation,
  EscalationListResponse,
  EscalationQueryParams,
  EscalationStatus,
  EscalationUrgency,
  ClientEscalationsRawResponse,
  EscalationStatusUpdateResponse,
} from "@/types/escalation.types";

const VALID_ESCALATION_STATUSES: EscalationStatus[] = ["raised", "forwarded", "failed", "resolved"];
const VALID_ESCALATION_URGENCIES: EscalationUrgency[] = ["standard", "high", "critical"];

function parseEscalationStatus(value: string): EscalationStatus {
  return VALID_ESCALATION_STATUSES.includes(value as EscalationStatus)
    ? (value as EscalationStatus)
    : "raised";
}
function parseEscalationUrgency(value: string): EscalationUrgency {
  return VALID_ESCALATION_URGENCIES.includes(value as EscalationUrgency)
    ? (value as EscalationUrgency)
    : "standard";
}

// ============================================================================
// List Escalations
// ============================================================================

/**
 * Get escalations for authenticated restaurant
 * GET /api/v1/client/escalations
 *
 * Normalizes backend response { items } to { escalations }
 *
 * @param params - Query parameters for filtering and pagination
 * @returns EscalationListResponse with normalized escalations array
 */
export async function getClientEscalations(
  params?: EscalationQueryParams
): Promise<EscalationListResponse> {
  const queryParams: Record<string, string | number | boolean | undefined> = {};

  if (params?.status) queryParams.status = params.status;
  if (params?.urgency) queryParams.urgency = params.urgency;
  if (params?.page) queryParams.page = params.page;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.sort_by) queryParams.sort_by = params.sort_by;
  if (params?.sort_order) queryParams.sort_order = params.sort_order;

  const response = await api.get<EscalationListResponse | ClientEscalationsRawResponse>(
    ENDPOINTS.CLIENT_ESCALATIONS.LIST,
    { params: queryParams }
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch escalations");
  }

  // Normalize response if backend returns { items } instead of { escalations }
  if ("items" in response.data) {
    const raw = response.data as ClientEscalationsRawResponse;
    return {
      escalations: raw.items.map((item) => ({
        id: item.id,
        call_id: item.call_id,
        user_id: item.user_id,
        restaurant_id: Number(item.restaurant_id),
        restaurant_name: item.restaurant_name,
        twilio_call_sid: item.call_sid ?? null,
        call_sid: item.call_sid,
        caller_phone: item.caller_phone ?? null,
        escalation_phone_number: item.escalation_phone_number ?? null,
        urgency: parseEscalationUrgency(item.urgency),
        reason: item.reason ?? null,
        status: parseEscalationStatus(item.status),
        requested_at: item.requested_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      total: raw.total,
      total_pages: Math.ceil(raw.total / (raw.limit || 1)),
      page: raw.page,
      limit: raw.limit,
    };
  }

  return response.data as EscalationListResponse;
}

// ============================================================================
// Get Single Escalation
// ============================================================================

/**
 * Get single escalation by ID
 * GET /api/v1/client/escalations/{id}
 *
 * @param id - Escalation ID
 * @returns Escalation object
 */
export async function getClientEscalation(id: number): Promise<Escalation> {
  const response = await api.get<Escalation>(ENDPOINTS.CLIENT_ESCALATIONS.GET(id));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch escalation details");
  }

  return response.data;
}

// ============================================================================
// Update Escalation Status
// ============================================================================

/**
 * Update escalation status
 * PATCH /api/v1/client/escalations/{id}/status
 *
 * @param id - Escalation ID
 * @param status - New status value
 * @returns Updated escalation
 */
export async function updateClientEscalationStatus(
  id: number,
  status: EscalationStatus
): Promise<EscalationStatusUpdateResponse> {
  const response = await api.patch<EscalationStatusUpdateResponse>(
    ENDPOINTS.CLIENT_ESCALATIONS.UPDATE_STATUS(id),
    { status }
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update escalation status");
  }

  return response.data;
}

// ============================================================================
// Re-export Types
// ============================================================================

export type {
  Escalation,
  EscalationListResponse,
  EscalationQueryParams,
  EscalationStatus,
  EscalationUrgency,
  EscalationStatusUpdateResponse,
};
