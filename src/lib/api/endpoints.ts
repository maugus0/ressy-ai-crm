/**
 * API Endpoints
 * Centralized endpoint definitions matching backend routes
 * 
 * For Client Dashboard (Restaurant Manager Portal)
 * All endpoints are scoped to the logged-in restaurant's restaurant_id
 */

export const ENDPOINTS = {
  // ============================================================================
  // Authentication
  // ============================================================================
  AUTH: {
    CLIENT_LOGIN: "/auth/client/login",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
  },

  // ============================================================================
  // Dashboard (Stats & Analytics)
  // ============================================================================
  DASHBOARD: {
    STATS: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/stats`,
    ANALYTICS: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/analytics`,
  },

  // ============================================================================
  // Reservations (per restaurant)
  // ============================================================================
  RESERVATIONS: {
    LIST: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/reservations`,
    CREATE: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/reservations`,
    GET: (reservationId: number) => `/dashboard/reservations/${reservationId}`,
    UPDATE: (reservationId: number) => `/dashboard/reservations/${reservationId}`,
    FINALIZE: (reservationId: number) => `/dashboard/reservations/${reservationId}/finalize`,
    CANCEL: (reservationId: number) => `/dashboard/reservations/${reservationId}/cancel`,
  },

  // ============================================================================
  // Menu (per restaurant)
  // ============================================================================
  MENU: {
    LIST: (restaurantId: number) => `/client/restaurants/${restaurantId}/menu`,
    CREATE: (restaurantId: number) => `/client/restaurants/${restaurantId}/menu`,
    CATEGORIES: (restaurantId: number) => `/client/restaurants/${restaurantId}/menu/categories`,
    GET: (menuId: number) => `/client/menu/${menuId}`,
    UPDATE: (menuId: number) => `/client/menu/${menuId}`,
    DELETE: (menuId: number) => `/client/menu/${menuId}`,
    TOGGLE_AVAILABILITY: (menuId: number) => `/client/menu/${menuId}/availability`,
    TOGGLE_SPECIAL: (menuId: number) => `/client/menu/${menuId}/special`,
  },

  // ============================================================================
  // FAQ (per restaurant)
  // ============================================================================
  FAQ: {
    LIST: (restaurantId: number) => `/client/restaurants/${restaurantId}/faqs`,
    CREATE: (restaurantId: number) => `/client/restaurants/${restaurantId}/faqs`,
    BULK_CREATE: (restaurantId: number) => `/client/restaurants/${restaurantId}/faqs/bulk`,
    GET: (faqId: number) => `/client/faqs/${faqId}`,
    UPDATE: (faqId: number) => `/client/faqs/${faqId}`,
    DELETE: (faqId: number) => `/client/faqs/${faqId}`,
  },

  // ============================================================================
  // Calls (per restaurant)
  // ============================================================================
  CALLS: {
    LIST: (restaurantId: number) => `/client/restaurants/${restaurantId}/calls`,
    GET: (callId: number) => `/client/calls/${callId}`,
    TRANSCRIPT: (callId: number) => `/client/calls/${callId}/transcript`,
  },

  // ============================================================================
  // Callers (per restaurant)
  // ============================================================================
  CALLERS: {
    LIST: (restaurantId: number) => `/client/restaurants/${restaurantId}/callers`,
    GET: (callerId: number) => `/client/callers/${callerId}`,
    UPDATE: (callerId: number) => `/client/callers/${callerId}`,
    MARK_SPAM: (callerId: number) => `/client/callers/${callerId}/spam`,
    MARK_FRAUD: (callerId: number) => `/client/callers/${callerId}/fraud`,
  },

  // ============================================================================
  // Orders (per restaurant)
  // ============================================================================
  ORDERS: {
    LIST: (restaurantId: number) => `/client/restaurants/${restaurantId}/orders`,
    GET: (orderId: number) => `/client/orders/${orderId}`,
    UPDATE: (orderId: number) => `/client/orders/${orderId}`,
    FINALIZE: (orderId: number) => `/client/orders/${orderId}/finalize`,
    CANCEL: (orderId: number) => `/client/orders/${orderId}/cancel`,
  },

  // ============================================================================
  // Settings (per restaurant)
  // ============================================================================
  SETTINGS: {
    GET: (restaurantId: number) => `/client/restaurants/${restaurantId}/settings`,
    UPDATE: (restaurantId: number) => `/client/restaurants/${restaurantId}/settings`,
    OPENING_HOURS: (restaurantId: number) => `/client/restaurants/${restaurantId}/settings/hours`,
    RESERVATION_SETTINGS: (restaurantId: number) => `/client/restaurants/${restaurantId}/settings/reservations`,
  },
} as const;
