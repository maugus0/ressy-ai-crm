/**
 * Token Refresh Utilities
 * Centralized token refresh logic to avoid circular dependencies
 */

import { ENDPOINTS } from "@/lib/api/endpoints";
import { env } from "@/config/env";
import type {
  RefreshTokenRequest,
  RefreshTokenResponse,
  StoredAuthData,
  AuthUser,
} from "@/types/auth.types";

// Storage key for auth data - exported for use in client.ts
export const STORAGE_KEY = "ressy_auth_data";

// Local storage helpers to avoid circular dependency with client.ts
const getStoredAuthDataLocal = (): StoredAuthData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setStoredAuthDataLocal = (data: StoredAuthData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const clearStoredAuthDataLocal = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Refresh access token using refresh token
 * This function is here to avoid circular dependency between client.ts and auth.ts
 */
export const refreshTokenDirect = async (): Promise<{
  success: boolean;
  error?: string;
  user?: AuthUser;
}> => {
  const authData = getStoredAuthDataLocal();

  if (!authData?.refresh_token) {
    return {
      success: false,
      error: "No refresh token available",
    };
  }

  const payload: RefreshTokenRequest = {
    refresh_token: authData.refresh_token,
  };

  try {
    const url = `${env.API_URL}${ENDPOINTS.AUTH.REFRESH}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      clearStoredAuthDataLocal();
      return {
        success: false,
        error: json.detail || json.message || "Token refresh failed",
      };
    }

    const data: RefreshTokenResponse = await response.json();
    const { access_token, refresh_token: new_refresh_token, expires_in } = data;

    // Update stored auth data with new tokens
    const updatedAuthData: StoredAuthData = {
      ...authData,
      access_token,
      refresh_token: new_refresh_token,
      expires_at: Date.now() + expires_in * 1000,
    };

    setStoredAuthDataLocal(updatedAuthData);

    // Build user object from stored auth data
    const user: AuthUser = {
      uuid: authData.uuid,
      email: authData.email,
      role: authData.role,
      permissions: authData.permissions,
      restaurant_id: authData.restaurant_id,
      restaurant_name: authData.restaurant_name,
      user_type: authData.user_type,
    };

    return {
      success: true,
      user,
    };
  } catch (error) {
    clearStoredAuthDataLocal();
    return {
      success: false,
      error: error instanceof Error ? error.message : "Token refresh failed",
    };
  }
};
