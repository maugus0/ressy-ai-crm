/**
 * Authentication Service
 * Handles all authentication-related API calls for Client Dashboard
 */

import { api, getStoredAuthData, setStoredAuthData, clearStoredAuthData } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { env } from "@/config/env";
import type {
  LoginCredentials,
  LoginResponse,
  LogoutResponse,
  StoredAuthData,
  AuthUser,
  AuthResult,
  RefreshResult,
} from "@/types/auth.types";
import { refreshTokenDirect } from "@/lib/utils/tokenRefresh";

// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  const response = await api.post<LoginResponse>(
    ENDPOINTS.AUTH.CLIENT_LOGIN,
    credentials,
    { skipAuth: true }
  );

  if (response.error || !response.data) {
    return { success: false, error: response.error || "Login failed" };
  }

  const data = response.data;

  // Calculate token expiry time
  const expiresAt = Date.now() + data.expires_in * 1000;

  // Store auth data
  const authData: StoredAuthData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    expires_at: expiresAt,
    uuid: data.uuid,
    email: data.email,
    role: data.role,
    permissions: data.permissions,
    restaurant_id: data.restaurant_id,
    restaurant_name: data.restaurant_name,
    user_type: data.user_type,
  };

  setStoredAuthData(authData);

  // Return user info
  const user: AuthUser = {
    uuid: data.uuid,
    email: data.email,
    role: data.role,
    permissions: data.permissions,
    restaurant_id: data.restaurant_id,
    restaurant_name: data.restaurant_name,
    user_type: data.user_type,
  };

  return { success: true, user };
}

/**
 * Logout - calls API and clears local storage
 */
export async function logout(): Promise<void> {
  try {
    await api.post<LogoutResponse>(ENDPOINTS.AUTH.LOGOUT);
  } catch (error) {
    console.warn("Logout API call failed:", error);
  } finally {
    // Always clear local storage regardless of API response
    clearStoredAuthData();
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<RefreshResult> {
  return refreshTokenDirect();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const authData = getStoredAuthData();
  if (!authData?.access_token) {
    return false;
  }

  // Check if token is expired
  if (authData.expires_at && Date.now() >= authData.expires_at) {
    return false;
  }

  return true;
}

/**
 * Check if token is expiring soon (within threshold)
 */
export function isTokenExpiringSoon(): boolean {
  const authData = getStoredAuthData();
  if (!authData?.expires_at) {
    return false;
  }

  return Date.now() >= authData.expires_at - env.TOKEN_REFRESH_THRESHOLD;
}

/**
 * Get current user from stored auth data
 */
export function getCurrentUser(): AuthUser | null {
  const authData = getStoredAuthData();
  if (!authData) {
    return null;
  }

  return {
    uuid: authData.uuid,
    email: authData.email,
    role: authData.role,
    permissions: authData.permissions,
    restaurant_id: authData.restaurant_id,
    restaurant_name: authData.restaurant_name,
    user_type: authData.user_type,
  };
}

/**
 * Get current restaurant ID
 */
export function getRestaurantId(): number | null {
  const authData = getStoredAuthData();
  return authData?.restaurant_id || null;
}

/**
 * Get current restaurant name
 */
export function getRestaurantName(): string | null {
  const authData = getStoredAuthData();
  return authData?.restaurant_name || null;
}

// ============================================================================
// Re-export for convenience
// ============================================================================

export type { LoginCredentials, AuthUser, AuthResult, RefreshResult };
