/**
 * Authentication Types
 * Type definitions for authentication-related data structures
 */

// ============================================================================
// Request Types
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  uuid: string;
  email: string;
  role: string;
  permissions: string[];
  restaurant_id: number;
  restaurant_name: string;
  user_type: "restaurant" | "admin";
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LogoutResponse {
  message: string;
}

// ============================================================================
// Stored Auth Data
// ============================================================================

export interface StoredAuthData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: number; // Unix timestamp in milliseconds
  uuid: string;
  email: string;
  role: string;
  permissions: string[];
  restaurant_id: number;
  restaurant_name: string;
  user_type: "restaurant" | "admin";
}

// ============================================================================
// User Types
// ============================================================================

export interface AuthUser {
  uuid: string;
  email: string;
  role: string;
  permissions: string[];
  restaurant_id: number;
  restaurant_name: string;
  user_type: "restaurant" | "admin";
}

// ============================================================================
// Context Types
// ============================================================================

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  restaurantId: number | null;
  restaurantName: string | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// ============================================================================
// Auth Result Types
// ============================================================================

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

export interface RefreshResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}
