/**
 * Token Refresh Utility
 * Handles token refresh directly without circular dependencies
 */

import { env } from "@/config/env";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { RefreshTokenResponse, StoredAuthData, AuthUser } from "@/types/auth.types";

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEY = "ressy_client_auth_data";

// ============================================================================
// Helper Functions
// ============================================================================

const getStoredAuthData = (): StoredAuthData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setStoredAuthData = (data: StoredAuthData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const clearStoredAuthData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// ============================================================================
// Token Refresh
// ============================================================================

export interface RefreshResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

/**
 * Directly refresh the access token using the refresh token
 * This function doesn't use the apiRequest to avoid circular dependencies
 */
export async function refreshTokenDirect(): Promise<RefreshResult> {
  const authData = getStoredAuthData();

  if (!authData?.refresh_token) {
    return { success: false, error: "No refresh token available" };
  }

  try {
    const response = await fetch(`${env.API_URL}${ENDPOINTS.AUTH.REFRESH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh_token: authData.refresh_token }),
    });

    if (!response.ok) {
      // Token refresh failed - clear auth data
      clearStoredAuthData();
      return { success: false, error: "Token refresh failed" };
    }

    const data: RefreshTokenResponse = await response.json();

    // Calculate new expiry time
    const expiresAt = Date.now() + data.expires_in * 1000;

    // Update stored auth data with new tokens
    const updatedAuthData: StoredAuthData = {
      ...authData,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: expiresAt,
    };

    setStoredAuthData(updatedAuthData);

    // Return the user data
    const user: AuthUser = {
      uuid: authData.uuid,
      email: authData.email,
      role: authData.role,
      permissions: authData.permissions,
      restaurant_id: authData.restaurant_id,
      restaurant_name: authData.restaurant_name,
      user_type: authData.user_type,
    };

    return { success: true, user };
  } catch (error) {
    console.error("Token refresh error:", error);
    clearStoredAuthData();
    return { success: false, error: "Network error during token refresh" };
  }
}

// Re-export for convenience
export { getStoredAuthData, setStoredAuthData, clearStoredAuthData, STORAGE_KEY };
