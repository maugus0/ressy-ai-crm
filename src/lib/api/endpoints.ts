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
  // Analytics (Client-scoped - auto-scoped to authenticated restaurant)
  // ============================================================================
  ANALYTICS: {
    /** GET /api/v1/client/analytics - Get comprehensive restaurant analytics */
    OVERVIEW: "/client/analytics",
    /** GET /api/v1/client/analytics/calls - Get call analytics */
    CALLS: "/client/analytics/calls",
    /** GET /api/v1/client/analytics/reservations - Get reservation analytics */
    RESERVATIONS: "/client/analytics/reservations",
    /** GET /api/v1/client/analytics/orders - Get order analytics */
    ORDERS: "/client/analytics/orders",
    /** GET /api/v1/client/analytics/menu - Get menu analytics */
    MENU: "/client/analytics/menu",
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
  // Menu (client-scoped - auto-scoped to authenticated restaurant)
  // ============================================================================
  MENU: {
    /** POST /api/v1/client/menu - Create menu item */
    CREATE: "/client/menu",
    /** GET /api/v1/client/menu - List menu items with filters */
    LIST: "/client/menu",
    /** GET /api/v1/client/menu/categories - Get categories and sub-categories */
    CATEGORIES: "/client/menu/categories",
    /** GET /api/v1/client/menu/{menu_id} - Get menu item details */
    GET: (menuId: number) => `/client/menu/${menuId}`,
    /** PUT /api/v1/client/menu/{menu_id} - Update menu item */
    UPDATE: (menuId: number) => `/client/menu/${menuId}`,
    /** DELETE /api/v1/client/menu/{menu_id} - Delete menu item */
    DELETE: (menuId: number) => `/client/menu/${menuId}`,
    /** PATCH /api/v1/client/menu/{menu_id}/availability - Toggle availability */
    TOGGLE_AVAILABILITY: (menuId: number) => `/client/menu/${menuId}/availability`,
    /** PATCH /api/v1/client/menu/{menu_id}/special - Toggle special status */
    TOGGLE_SPECIAL: (menuId: number) => `/client/menu/${menuId}/special`,
    /** PATCH /api/v1/client/menu/bulk-availability - Bulk update availability */
    BULK_AVAILABILITY: "/client/menu/bulk-availability",
  },

  // ============================================================================
  // FAQ (client-scoped - auto-scoped to authenticated restaurant)
  // ============================================================================
  FAQ: {
    /** POST /api/v1/client/faqs - Create FAQ */
    CREATE: "/client/faqs",
    /** GET /api/v1/client/faqs - List FAQs with pagination and search */
    LIST: "/client/faqs",
    /** POST /api/v1/client/faqs/bulk - Bulk create FAQs */
    BULK_CREATE: "/client/faqs/bulk",
    /** GET /api/v1/client/faqs/{faq_id} - Get FAQ by ID */
    GET: (faqId: number) => `/client/faqs/${faqId}`,
    /** PUT /api/v1/client/faqs/{faq_id} - Update FAQ */
    UPDATE: (faqId: number) => `/client/faqs/${faqId}`,
    /** DELETE /api/v1/client/faqs/{faq_id} - Delete FAQ */
    DELETE: (faqId: number) => `/client/faqs/${faqId}`,
  },

  // ============================================================================
  // Calls (client-scoped - auto-scoped to authenticated restaurant)
  // ============================================================================
  CALLS: {
    /** GET /api/v1/client/calls - Get own calls with filtering and pagination */
    LIST: "/client/calls",
    /** GET /api/v1/client/calls/analytics - Get call analytics for date range */
    ANALYTICS: "/client/calls/analytics",
    /** GET /api/v1/client/calls/search - Search calls by phone or transcript */
    SEARCH: "/client/calls/search",
    /** GET /api/v1/client/calls/export - Export calls as CSV */
    EXPORT: "/client/calls/export",
    /** GET /api/v1/client/calls/{call_id} - Get call details with transcript */
    GET: (callId: string) => `/client/calls/${callId}`,
  },

  // ============================================================================
  // Dashboard Users (Callers/Customers - per restaurant)
  // ============================================================================
  USERS: {
    /** GET /api/v1/dashboard/restaurants/{restaurant_id}/users - List users */
    LIST: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/users`,
    /** POST /api/v1/dashboard/restaurants/{restaurant_id}/users - Create user */
    CREATE: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/users`,
    /** GET /api/v1/dashboard/users/{user_id} - Get user by ID */
    GET: (userId: number) => `/dashboard/users/${userId}`,
    /** PUT /api/v1/dashboard/users/{user_id} - Update user */
    UPDATE: (userId: number) => `/dashboard/users/${userId}`,
  },

  // ============================================================================
  // Orders (Dashboard API - per restaurant)
  // ============================================================================
  ORDERS: {
    /** GET /api/v1/dashboard/restaurants/{restaurant_id}/orders - List orders */
    LIST: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/orders`,
    /** POST /api/v1/dashboard/restaurants/{restaurant_id}/orders - Create order */
    CREATE: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/orders`,
    /** GET /api/v1/dashboard/orders/{order_id} - Get order by ID */
    GET: (orderId: number) => `/dashboard/orders/${orderId}`,
    /** PUT /api/v1/dashboard/orders/{order_id} - Update order */
    UPDATE: (orderId: number) => `/dashboard/orders/${orderId}`,
    /** DELETE /api/v1/dashboard/orders/{order_id} - Soft delete order */
    DELETE: (orderId: number) => `/dashboard/orders/${orderId}`,
    /** PUT /api/v1/dashboard/orders/{order_id}/status - Update status only */
    UPDATE_STATUS: (orderId: number) => `/dashboard/orders/${orderId}/status`,
    /** PUT /api/v1/dashboard/orders/{order_id}/cancel - Cancel order */
    CANCEL: (orderId: number) => `/dashboard/orders/${orderId}/cancel`,
    /** PUT /api/v1/dashboard/orders/{order_id}/restore - Restore deleted order */
    RESTORE: (orderId: number) => `/dashboard/orders/${orderId}/restore`,
  },

  // ============================================================================
  // Restaurant (client-scoped - auto-scoped to authenticated restaurant)
  // ============================================================================
  RESTAURANT: {
    /** GET /api/v1/client/restaurant - Get authenticated restaurant details */
    GET: "/client/restaurant",
    /** PUT /api/v1/client/restaurant - Update authenticated restaurant */
    UPDATE: "/client/restaurant",
  },

  // ============================================================================
  // Settings (legacy - per restaurant)
  // ============================================================================
  SETTINGS: {
    GET: (restaurantId: number) => `/client/restaurants/${restaurantId}/settings`,
    UPDATE: (restaurantId: number) => `/client/restaurants/${restaurantId}/settings`,
    OPENING_HOURS: (restaurantId: number) => `/client/restaurants/${restaurantId}/settings/hours`,
    RESERVATION_SETTINGS: (restaurantId: number) =>
      `/client/restaurants/${restaurantId}/settings/reservations`,
  },

  // ============================================================================
  // SSE (Server-Sent Events)
  // ============================================================================
  SSE: {
    /** GET /api/v1/sse/events/stream - Subscribe to SSE event stream */
    STREAM: "/sse/events/stream",
    /** POST /api/v1/sse/events/escalation/{restaurant_id} - Trigger escalation */
    ESCALATION: (restaurantId: number) => `/sse/events/escalation/${restaurantId}`,
    /** GET /api/v1/sse/events/stats - Get SSE connection statistics */
    STATS: "/sse/events/stats",
  },
} as const;
