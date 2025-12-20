/**
 * Reservations Service
 * Handles all reservation-related API calls for the Client Dashboard
 * Uses dashboard endpoints with restaurant_id from auth context
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  Reservation,
  ReservationListResponse,
  ReservationListParams,
  ReservationCreateRequest,
  ReservationCreateResponse,
  ReservationUpdateRequest,
  ReservationFinalizeRequest,
  ReservationFinalizeResponse,
  ReservationCancelResponse,
} from "@/types/api.types";

// ============================================================================
// List Reservations
// ============================================================================

/**
 * Get paginated list of reservations for a restaurant
 * GET /api/v1/dashboard/restaurants/{restaurant_id}/reservations
 */
export async function getReservations(
  restaurantId: number,
  params?: ReservationListParams
): Promise<ReservationListResponse> {
  const response = await api.get<ReservationListResponse>(
    ENDPOINTS.RESERVATIONS.LIST(restaurantId),
    { params }
  );
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch reservations");
  }
  return response.data;
}

// ============================================================================
// Get Single Reservation
// ============================================================================

/**
 * Get reservation by ID
 * GET /api/v1/dashboard/reservations/{reservation_id}
 */
export async function getReservation(reservationId: number): Promise<Reservation> {
  const response = await api.get<Reservation>(ENDPOINTS.RESERVATIONS.GET(reservationId));
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch reservation details");
  }
  return response.data;
}

// ============================================================================
// Create Reservation
// ============================================================================

/**
 * Create a new confirmed reservation
 * POST /api/v1/dashboard/restaurants/{restaurant_id}/reservations
 */
export async function createReservation(
  restaurantId: number,
  data: ReservationCreateRequest
): Promise<ReservationCreateResponse> {
  const response = await api.post<ReservationCreateResponse>(
    ENDPOINTS.RESERVATIONS.CREATE(restaurantId),
    data
  );
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to create reservation");
  }
  return response.data;
}

// ============================================================================
// Update Reservation
// ============================================================================

/**
 * Update an existing reservation
 * PUT /api/v1/dashboard/reservations/{reservation_id}
 */
export async function updateReservation(
  reservationId: number,
  data: ReservationUpdateRequest
): Promise<Reservation> {
  const response = await api.put<Reservation>(ENDPOINTS.RESERVATIONS.UPDATE(reservationId), data);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update reservation");
  }
  return response.data;
}

// ============================================================================
// Finalize Reservation
// ============================================================================

/**
 * Finalize a pending reservation (change status from 'pending' to 'confirmed')
 * PUT /api/v1/dashboard/reservations/{reservation_id}/finalize
 */
export async function finalizeReservation(
  reservationId: number,
  data?: ReservationFinalizeRequest
): Promise<ReservationFinalizeResponse> {
  const response = await api.put<ReservationFinalizeResponse>(
    ENDPOINTS.RESERVATIONS.FINALIZE(reservationId),
    data || {}
  );
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to finalize reservation");
  }
  return response.data;
}

// ============================================================================
// Cancel Reservation
// ============================================================================

/**
 * Cancel a reservation (releases the time slot)
 * PUT /api/v1/dashboard/reservations/{reservation_id}/cancel
 */
export async function cancelReservation(reservationId: number): Promise<ReservationCancelResponse> {
  const response = await api.put<ReservationCancelResponse>(
    ENDPOINTS.RESERVATIONS.CANCEL(reservationId)
  );
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to cancel reservation");
  }
  return response.data;
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  Reservation,
  ReservationListResponse,
  ReservationListParams,
  ReservationCreateRequest,
  ReservationCreateResponse,
  ReservationUpdateRequest,
  ReservationFinalizeRequest,
  ReservationFinalizeResponse,
  ReservationCancelResponse,
  ReservationStatus,
  ReservationType,
} from "@/types/api.types";
