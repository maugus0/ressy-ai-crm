/**
 * Escalation Types for Client Dashboard
 * Maps to backend Escalations table and API responses
 *
 * These types are for database-persisted escalations fetched via API,
 * separate from real-time SSE escalation events (see api.types.ts for SSEEscalationData).
 */

// ============================================================================
// Enums / Literal Types
// ============================================================================

/** Escalation status enum matching backend */
export type EscalationStatus = "raised" | "forwarded" | "failed" | "resolved";

/** Escalation urgency enum matching backend */
export type EscalationUrgency = "standard" | "high" | "critical";

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Single escalation entity from API
 * GET /api/v1/client/escalations/{id}
 */
export interface Escalation {
  id: number;
  call_id: number | string | null;
  user_id: number | string | null;
  restaurant_id: number;
  restaurant_name?: string;
  twilio_call_sid?: string | null;
  call_sid?: string | null;
  caller_phone: string | null;
  escalation_phone_number: string | null;
  urgency: EscalationUrgency;
  reason: string | null;
  status: EscalationStatus;
  forwarded?: boolean;
  requested_at: string;
  created_at?: string;
  updated_at?: string | null;
}

// ============================================================================
// API Response Interfaces
// ============================================================================

/**
 * API response for escalation list (normalized)
 * GET /api/v1/client/escalations
 */
export interface EscalationListResponse {
  escalations: Escalation[];
  total: number;
  total_pages: number;
  page: number;
  limit: number;
}

/**
 * Raw API response before normalization
 * Backend returns { items, total, page, limit }
 */
export interface ClientEscalationsRawResponse {
  items: Array<{
    id: number;
    call_id: number | string | null;
    user_id: number | string | null;
    restaurant_id: number | string;
    restaurant_name?: string;
    call_sid?: string;
    caller_phone?: string;
    escalation_phone_number?: string;
    urgency: string;
    reason?: string;
    status: string;
    requested_at: string;
    created_at?: string;
    updated_at?: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

/**
 * API response for escalation status update
 * PATCH /api/v1/client/escalations/{id}/status
 */
export interface EscalationStatusUpdateResponse {
  id: number;
  status: EscalationStatus;
  updated_at: string;
}

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for escalation list
 * GET /api/v1/client/escalations?status=raised&urgency=high&page=1&limit=20
 */
export interface EscalationQueryParams {
  status?: EscalationStatus;
  urgency?: EscalationUrgency;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// ============================================================================
// Status Update Request
// ============================================================================

/**
 * Request body for status update
 * PATCH /api/v1/client/escalations/{id}/status
 */
export interface EscalationStatusUpdateRequest {
  status: EscalationStatus;
}
