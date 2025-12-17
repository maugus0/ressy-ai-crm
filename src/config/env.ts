/**
 * Environment Configuration
 * Centralized configuration for environment variables
 *
 * IMPORTANT: All API URLs come from environment variables
 * - Local dev: Create .env.local with VITE_API_BASE_URL
 * - Production: Set VITE_API_BASE_URL in GitHub Actions secrets/environment variables
 */

// Validate that API_BASE_URL is set (except in development where localhost is acceptable)
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // In development, localhost fallback is acceptable
  if (import.meta.env.DEV) {
    return envUrl || "http://localhost:5001";
  }

  // In production, require environment variable
  if (!envUrl) {
    console.error(
      "❌ VITE_API_BASE_URL is not set! " +
        "Please set it in GitHub Actions environment variables or secrets for production builds."
    );
    // Still return localhost as fallback, but log error
    return "http://localhost:5001";
  }

  return envUrl;
};

// Get base path for GitHub Pages or other custom deployments
const getBasePath = (): string => {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/ressy-ai-crm")) {
    return "/ressy-ai-crm";
  }
  return "";
};

export const env = {
  /**
   * API Base URL - MUST be set via environment variable
   * - Local: Set in .env.local
   * - Production: Set in GitHub Actions environment/secrets
   */
  API_BASE_URL: getApiBaseUrl(),

  /**
   * API Version prefix
   */
  API_VERSION: import.meta.env.VITE_API_VERSION || "v1",

  /**
   * Full API URL with version
   */
  get API_URL(): string {
    return `${this.API_BASE_URL}/api/${this.API_VERSION}`;
  },

  /**
   * Base path for routing (GitHub Pages support)
   */
  BASE_PATH: getBasePath(),

  /**
   * Token refresh interval in milliseconds (15 minutes)
   */
  TOKEN_REFRESH_INTERVAL: 15 * 60 * 1000,

  /**
   * Token refresh threshold - refresh if expiring within this time (5 minutes)
   */
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000,

  /**
   * Is development mode
   */
  IS_DEV: import.meta.env.DEV,

  /**
   * Is production mode
   */
  IS_PROD: import.meta.env.PROD,
} as const;

// Type for the env object
export type EnvConfig = typeof env;

// Log the API URL being used (helpful for debugging)
if (import.meta.env.DEV) {
  console.log("🔧 API Configuration:", {
    API_BASE_URL: env.API_BASE_URL,
    API_URL: env.API_URL,
    BASE_PATH: env.BASE_PATH,
    source: import.meta.env.VITE_API_BASE_URL ? "environment variable" : "fallback (localhost)",
  });
}
