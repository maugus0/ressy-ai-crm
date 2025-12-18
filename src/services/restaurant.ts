/**
 * Restaurant Service
 * Handles all restaurant-related API calls for Client Dashboard
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ClientRestaurant, ClientRestaurantUpdateRequest } from "@/types/api.types";

// ============================================================================
// Restaurant Functions
// ============================================================================

/**
 * Get the authenticated restaurant's details
 * GET /api/v1/client/restaurant
 */
export async function getRestaurant(): Promise<ClientRestaurant> {
  const response = await api.get<ClientRestaurant>(ENDPOINTS.RESTAURANT.GET);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch restaurant details");
  }

  return response.data;
}

/**
 * Update the authenticated restaurant's details
 * PUT /api/v1/client/restaurant
 * All fields are optional; server-side validation still applies
 */
export async function updateRestaurant(
  data: ClientRestaurantUpdateRequest
): Promise<ClientRestaurant> {
  const response = await api.put<ClientRestaurant>(ENDPOINTS.RESTAURANT.UPDATE, data);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update restaurant");
  }

  return response.data;
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type { ClientRestaurant, ClientRestaurantUpdateRequest };
