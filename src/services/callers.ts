/**
 * Callers (Dashboard Users) Service
 * API calls for customer/user management in the dashboard
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  DashboardUser,
  DashboardUserDetailsResponse,
  DashboardUserListResponse,
  DashboardUserListParams,
  DashboardUserCreateRequest,
  DashboardUserCreateResponse,
  DashboardUserUpdateRequest,
  DashboardUserUpdateResponse,
} from "@/types/api.types";

// ============================================================================
// List Users
// ============================================================================

/**
 * Get paginated list of users for a restaurant
 * GET /api/v1/dashboard/restaurants/{restaurant_id}/users
 */
export async function getUsers(
  restaurantId: number,
  params?: DashboardUserListParams
): Promise<DashboardUserListResponse> {
  const response = await api.get<DashboardUserListResponse>(ENDPOINTS.USERS.LIST(restaurantId), {
    params: params
      ? {
          search: params.search,
          is_spam: params.is_spam,
          limit: params.limit,
          offset: params.offset,
        }
      : undefined,
  });
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch users");
  }
  return response.data;
}

// ============================================================================
// Get User Details
// ============================================================================

/**
 * Get user by ID with full details
 * GET /api/v1/dashboard/users/{user_id}
 */
export async function getUserDetails(userId: number): Promise<DashboardUserDetailsResponse> {
  const response = await api.get<DashboardUserDetailsResponse>(ENDPOINTS.USERS.GET(userId));
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch user details");
  }
  return response.data;
}

// ============================================================================
// Create User
// ============================================================================

/**
 * Create a new user or add an existing user to the restaurant
 * POST /api/v1/dashboard/restaurants/{restaurant_id}/users
 */
export async function createUser(
  restaurantId: number,
  data: DashboardUserCreateRequest
): Promise<DashboardUserCreateResponse> {
  const response = await api.post<DashboardUserCreateResponse>(
    ENDPOINTS.USERS.CREATE(restaurantId),
    data
  );
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to create user");
  }
  return response.data;
}

// ============================================================================
// Update User
// ============================================================================

/**
 * Update an existing user
 * PUT /api/v1/dashboard/users/{user_id}
 */
export async function updateUser(
  userId: number,
  data: DashboardUserUpdateRequest
): Promise<DashboardUserUpdateResponse> {
  const response = await api.put<DashboardUserUpdateResponse>(ENDPOINTS.USERS.UPDATE(userId), data);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update user");
  }
  return response.data;
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  DashboardUser,
  DashboardUserDetailsResponse,
  DashboardUserListResponse,
  DashboardUserListParams,
  DashboardUserCreateRequest,
  DashboardUserCreateResponse,
  DashboardUserUpdateRequest,
  DashboardUserUpdateResponse,
  DashboardUserStatistics,
} from "@/types/api.types";
