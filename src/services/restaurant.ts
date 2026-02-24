/**
 * Restaurant Service
 * Handles all restaurant-related API calls for Client Dashboard
 */

import { api, getAccessToken } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { env } from "@/config/env";
import { refreshTokenDirect } from "@/lib/utils/tokenRefresh";
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

const executeKillSwitchRequest = async (
  data: ClientRestaurantKillSwitchUpdateRequest
): Promise<Response> => {
  const url = `${env.API_URL}${ENDPOINTS.RESTAURANT.KILL_SWITCH}`;

  const makeRequest = (token: string | null) =>
    fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

  let token = getAccessToken();
  let response = await makeRequest(token);

  if (response.status === 401 && token) {
    const refreshResult = await refreshTokenDirect();
    if (refreshResult.success) {
      token = getAccessToken();
      response = await makeRequest(token);
    }
  }

  return response;
};

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
  const response = await executeKillSwitchRequest(data);

  const responseJson = (await response.json().catch(() => null)) as
    | KillSwitchErrorResponse
    | ClientRestaurant
    | null;

  if (!response.ok || !responseJson) {
    const errorPayload = responseJson as KillSwitchErrorResponse | null;
    const detail = errorPayload?.detail;
    const detailMessage =
      typeof detail === "string"
        ? detail
        : detail?.message || errorPayload?.message || "Failed to update kill switch";
    const blockers = typeof detail === "object" ? detail?.kill_switch_blockers || [] : [];
    throw new RestaurantKillSwitchError(detailMessage, blockers);
  }

  return responseJson as ClientRestaurant;
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  ClientRestaurant,
  ClientRestaurantKillSwitchUpdateRequest,
  ClientRestaurantUpdateRequest,
};
