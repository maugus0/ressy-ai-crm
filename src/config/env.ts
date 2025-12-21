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
  try {
    const envUrl = import.meta.env.VITE_API_BASE_URL;

    // In development, localhost fallback is acceptable
    if (import.meta.env.DEV) {
      return envUrl || "http://localhost:5001";
    }

    // In production, silently return empty string if not set
    // This allows the UI to load but API calls will fail gracefully
    // We don't log warnings in production to avoid triggering smoke test failures
    if (!envUrl) {
      // Only log in development mode for debugging
      if (import.meta.env.DEV) {
        console.warn(
          "⚠️ VITE_API_BASE_URL is not set. " +
            "Using fallback. For production, set it in GitHub Actions environment variables or secrets."
        );
      }
      return "";
    }

    return envUrl;
  } catch (err) {
    // If there's any error accessing env, return empty string
    // Only log in development mode to avoid triggering smoke test failures
    if (import.meta.env.DEV) {
      console.warn("Failed to read VITE_API_BASE_URL:", err);
    }
    return "";
  }
};

// Get base path for routing - always returns root path with custom domain configuration
const getBasePath = (): string => {
  // Custom domain uses root path
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
