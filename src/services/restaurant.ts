/**
 * Restaurant Service
 * Handles all restaurant-related API calls for Client Dashboard
 */

import { api, apiRequestWithErrorData } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ClientRestaurant,
  ClientRestaurantKillSwitchUpdateRequest,
  ClientRestaurantUpdateRequest,
} from "@/types/api.types";

// ============================================================================
// Restaurant Functions
// ============================================================================

interface KillSwitchErrorDetail {
  message?: string;
  kill_switch_blockers?: string[];
}

interface KillSwitchErrorResponse {
  detail?: string | KillSwitchErrorDetail;
  message?: string;
}

export class RestaurantKillSwitchError extends Error {
  killSwitchBlockers: string[];

  constructor(message: string, killSwitchBlockers: string[] = []) {
    super(message);
    this.name = "RestaurantKillSwitchError";
    this.killSwitchBlockers = killSwitchBlockers;
  }
}

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

/**
 * Toggle kill switch for the authenticated restaurant
 * PATCH /api/v1/client/restaurant/kill-switch
 */
export async function updateRestaurantKillSwitch(
  data: ClientRestaurantKillSwitchUpdateRequest
): Promise<ClientRestaurant> {
  const response = await apiRequestWithErrorData<ClientRestaurant, KillSwitchErrorResponse>(
    ENDPOINTS.RESTAURANT.KILL_SWITCH,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  if (response.error || !response.data) {
    const detail = response.errorData?.detail;
    const blockers = typeof detail === "object" ? detail?.kill_switch_blockers || [] : [];
    const statusMessage = (() => {
      if (response.status === 401) return "Session expired. Please login again.";
      if (response.status === 403)
        return "Access denied. You don't have permission to perform this action.";
      if (response.status >= 500) return "Server error while updating RessyAI Agent status.";
      if (response.status > 0)
        return `Failed to update RessyAI Agent status (HTTP ${response.status}).`;
      return "Failed to update RessyAI Agent status";
    })();
    const detailMessage =
      typeof detail === "string" ? detail : detail?.message || response.error || statusMessage;
    throw new RestaurantKillSwitchError(detailMessage, blockers);
  }

  return response.data;
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  ClientRestaurant,
  ClientRestaurantKillSwitchUpdateRequest,
  ClientRestaurantUpdateRequest,
};
