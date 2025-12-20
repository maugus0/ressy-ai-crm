/**
 * API Types
 * Type definitions for API-related data structures
 */

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// Restaurant Types
// ============================================================================

export interface Restaurant {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

/**
 * Client Restaurant - Response from GET /api/v1/client/restaurant
 * This is the authenticated restaurant's full details
 */
export interface ClientRestaurant {
  id: number;
  name: string;
  address: string;
  phone_number: string;
  twilio_phone_number: string | null;
  /** Forward minutes for reservation booking window */
  forward_minutes: number;
  /** Backward minutes for cancellation window */
  backward_minutes: number;
  /** Whether credit card is required for reservations */
  is_credit_card_required_for_reservation: boolean;
  /** Opening time in HH:MM:SS format */
  opening_time: string | null;
  /** Closing time in HH:MM:SS format */
  closing_time: string | null;
  created_at: string;
  updated_at: string;
  // Note: twilio_details, deepgram_details, open_table_details are intentionally excluded
  // as they should not be exposed to client dashboard users
}

/**
 * Client Restaurant Update Request - PUT /api/v1/client/restaurant
 * All fields are optional; server-side validation still applies
 */
export interface ClientRestaurantUpdateRequest {
  name?: string;
  address?: string;
  phone_number?: string;
  forward_minutes?: number;
  backward_minutes?: number;
  is_credit_card_required_for_reservation?: boolean;
  opening_time?: string;
  closing_time?: string;
  // Note: twilio_phone_number is read-only and cannot be updated by client
}

// ============================================================================
// Reservation Types (Dashboard API)
// ============================================================================

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
export type ReservationType = "in-house" | "online" | "phone" | "walk-in";

/**
 * Reservation - Response from dashboard reservation endpoints
 * GET /api/v1/dashboard/reservations/{reservation_id}
 * GET /api/v1/dashboard/restaurants/{restaurant_id}/reservations
 */
export interface Reservation {
  id: number;
  reservation_type: ReservationType;
  table_availability_request_id?: number | null;
  slot_booking_id?: number | null;
  user_id?: number;
  confirmation_number: string;
  last_cancel_time?: string | null;
  manage_reservation_url?: string | null;
  status: ReservationStatus;
  special_request?: string | null;
  party_size: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  date_time: string;
  restaurant_id: number;
  name: string;
  email?: string | null;
  phone_number: string;
}

/**
 * Reservation List Response
 * GET /api/v1/dashboard/restaurants/{restaurant_id}/reservations
 */
export interface ReservationListResponse {
  restaurant_id: number;
  reservations: Reservation[];
  total: number;
}

/**
 * Reservation List Query Parameters
 */
export interface ReservationListParams {
  status?: ReservationStatus;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Create Reservation Request
 * POST /api/v1/dashboard/restaurants/{restaurant_id}/reservations
 * Note: API uses 'email_address' in requests but returns 'email' in responses
 */
export interface ReservationCreateRequest {
  date_time: string;
  party_size: number;
  name: string;
  phone_number: string;
  email_address?: string; // API request field name (different from response 'email' field)
  special_request?: string;
  notes?: string;
}

/**
 * Create Reservation Response
 */
export interface ReservationCreateResponse {
  reservation_id: number;
  slot_id: number;
  confirmation_number: string;
  status: ReservationStatus;
  date_time: string;
  party_size: number;
  name: string;
  phone_number: string;
  email_address?: string | null;
  special_request?: string | null;
  notes?: string | null;
  message: string;
}

/**
 * Update Reservation Request
 * PUT /api/v1/dashboard/reservations/{reservation_id}
 */
export interface ReservationUpdateRequest {
  date_time?: string;
  party_size?: number;
  special_request?: string;
  notes?: string;
  confirmation_number?: string;
  status?: ReservationStatus;
  last_cancel_time?: string;
  manage_reservation_url?: string;
}

/**
 * Finalize Reservation Request (optional custom confirmation number)
 * PUT /api/v1/dashboard/reservations/{reservation_id}/finalize
 */
export interface ReservationFinalizeRequest {
  confirmation_number?: string;
}

/**
 * Finalize Reservation Response
 */
export interface ReservationFinalizeResponse {
  reservation_id: number;
  status: ReservationStatus;
  confirmation_number: string;
  message: string;
}

/**
 * Cancel Reservation Response
 * PUT /api/v1/dashboard/reservations/{reservation_id}/cancel
 */
export interface ReservationCancelResponse {
  reservation_id: number;
  status: "cancelled";
  message: string;
}

// Legacy types for backwards compatibility
export interface CreateReservationRequest {
  date_time: string;
  party_size: number;
  name: string;
  phone_number: string;
  email?: string;
  special_request?: string;
  notes?: string;
}

export interface UpdateReservationRequest {
  date_time?: string;
  party_size?: number;
  name?: string;
  phone_number?: string;
  email?: string;
  special_request?: string;
  notes?: string;
  status?: ReservationStatus;
}

// ============================================================================
// Menu Types (Client Dashboard)
// ============================================================================

/**
 * Menu Item - Response from GET /api/v1/client/menu and /api/v1/client/menu/{menu_id}
 */
export interface ClientMenuItem {
  id: number;
  restaurant_id: number;
  restaurant_name: string | null;
  category: string;
  sub_category: string | null;
  item_name: string;
  item_desc: string | null;
  /** Price as string from API (e.g., "15.99") */
  price: string;
  /** Average prep time in minutes */
  avg_prep_time: number;
  suggested_items: number[];
  is_available: boolean;
  is_special: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Menu Item Create Request - POST /api/v1/client/menu
 */
export interface ClientMenuItemCreateRequest {
  item_name: string;
  price: number;
  category: string;
  sub_category?: string;
  item_desc?: string;
  avg_prep_time?: number;
  is_available?: boolean;
  is_special?: boolean;
}

/**
 * Menu Item Update Request - PUT /api/v1/client/menu/{menu_id}
 */
export interface ClientMenuItemUpdateRequest {
  item_name?: string;
  price?: number;
  category?: string;
  sub_category?: string;
  item_desc?: string;
  avg_prep_time?: number;
  is_available?: boolean;
  is_special?: boolean;
}

/**
 * Menu Availability Toggle Request - PATCH /api/v1/client/menu/{menu_id}/availability
 */
export interface MenuAvailabilityRequest {
  is_available: boolean;
}

/**
 * Menu Special Toggle Request - PATCH /api/v1/client/menu/{menu_id}/special
 */
export interface MenuSpecialRequest {
  is_special: boolean;
}

/**
 * Bulk Availability Update Request - PATCH /api/v1/client/menu/bulk-availability
 */
export interface MenuBulkAvailabilityRequest {
  menu_item_ids: number[];
  is_available: boolean;
}

/**
 * Bulk Availability Update Response
 */
export interface MenuBulkAvailabilityResponse {
  updated_count: number;
  menu_item_ids: number[];
}

/**
 * Menu Categories Response - GET /api/v1/client/menu/categories
 * Returns categories as keys with arrays of sub-categories as values
 */
export interface MenuCategoriesResponse {
  categories: Record<string, string[]>;
}

/**
 * Menu List Response with Pagination
 */
export interface ClientMenuListResponse {
  items: ClientMenuItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Menu List Query Parameters
 */
export interface MenuListParams {
  page?: number;
  limit?: number;
  category?: string;
  sub_category?: string;
  is_available?: boolean;
  is_special?: boolean;
  search?: string;
}

/**
 * Menu Delete Response
 */
export interface MenuDeleteResponse {
  message: string;
  menu_id: number;
}

// Legacy MenuItem interface (for backwards compatibility)
export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  is_available: boolean;
  is_special: boolean;
  dietary_info?: string[];
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMenuItemRequest {
  name: string;
  description?: string;
  price: number;
  category: string;
  is_available?: boolean;
  is_special?: boolean;
  dietary_info?: string[];
  image_url?: string;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  is_available?: boolean;
  is_special?: boolean;
  dietary_info?: string[];
  image_url?: string;
}

// ============================================================================
// FAQ Types (Client Dashboard)
// ============================================================================

/**
 * FAQ - Response from GET /api/v1/client/faqs and /api/v1/client/faqs/{faq_id}
 */
export interface ClientFAQ {
  id: number;
  restaurant_id: number;
  restaurant_name?: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

/**
 * FAQ Create Request - POST /api/v1/client/faqs
 */
export interface ClientFAQCreateRequest {
  question: string;
  answer: string;
}

/**
 * FAQ Update Request - PUT /api/v1/client/faqs/{faq_id}
 */
export interface ClientFAQUpdateRequest {
  question?: string;
  answer?: string;
}

/**
 * Bulk FAQ Create Request - POST /api/v1/client/faqs/bulk
 */
export interface ClientBulkFAQCreateRequest {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * Bulk FAQ Create Response
 */
export interface ClientBulkFAQCreateResponse {
  items: ClientFAQ[];
}

/**
 * FAQ List Response with Pagination
 */
export interface ClientFAQListResponse {
  items: ClientFAQ[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * FAQ List Query Parameters
 */
export interface FAQListParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * FAQ Delete Response
 */
export interface FAQDeleteResponse {
  message: string;
}

// Legacy FAQ types (for backwards compatibility)
export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category?: string;
  is_active: boolean;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFAQRequest {
  question: string;
  answer: string;
  category?: string;
  is_active?: boolean;
  order?: number;
}

export interface UpdateFAQRequest {
  question?: string;
  answer?: string;
  category?: string;
  is_active?: boolean;
  order?: number;
}

// ============================================================================
// Call Types
// ============================================================================

export type CallStatus = "completed" | "missed" | "voicemail" | "in_progress";
export type CallOutcome = "booking" | "inquiry" | "cancelled" | "other";
export type CallSentiment = "positive" | "neutral" | "negative";

export interface Call {
  id: number;
  call_id: string;
  from_number: string;
  to_number?: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  status: CallStatus;
  outcome?: CallOutcome;
  sentiment?: CallSentiment;
  transcript?: string;
  summary?: string;
  cost?: number;
  created_at?: string;
}

export interface CallTranscriptSegment {
  speaker: string;
  text: string;
  timestamp?: string;
}

// ============================================================================
// Caller Types
// ============================================================================

export interface Caller {
  id: number;
  phone_number: string;
  name?: string;
  email?: string;
  total_calls: number;
  last_call_at?: string;
  is_spam: boolean;
  is_fraud: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateCallerRequest {
  name?: string;
  email?: string;
  is_spam?: boolean;
  is_fraud?: boolean;
  notes?: string;
}

// ============================================================================
// Order Types (Legacy)
// ============================================================================

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
export type OrderType = "takeout" | "delivery" | "dine_in";

export interface OrderItem {
  menu_item_id: number;
  name: string;
  quantity: number;
  price: number;
  special_instructions?: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  order_type: OrderType;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  special_instructions?: string;
  pickup_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  special_instructions?: string;
  pickup_time?: string;
}

// ============================================================================
// Dashboard Order Types (New API)
// ============================================================================

export type DashboardOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

/**
 * Order item in an order detail array
 */
export interface DashboardOrderItem {
  item_id?: number;
  name: string;
  quantity: number;
  price: number;
  instructions?: string | null;
}

/**
 * Order customization options
 */
export interface DashboardOrderCustomization {
  delivery?: boolean;
  table_number?: number;
  notes?: string;
  [key: string]: unknown;
}

/**
 * Dashboard Order - Response from dashboard order endpoints
 * GET /api/v1/dashboard/orders/{order_id}
 * GET /api/v1/dashboard/restaurants/{restaurant_id}/orders
 */
export interface DashboardOrder {
  id: number;
  user_id: number;
  restaurant_id: number;
  status: DashboardOrderStatus;
  total_amount: number;
  order_details: DashboardOrderItem[];
  customization: DashboardOrderCustomization;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Order List Response
 * GET /api/v1/dashboard/restaurants/{restaurant_id}/orders
 */
export interface DashboardOrderListResponse {
  restaurant_id: number;
  orders: DashboardOrder[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Order List Query Parameters
 */
export interface DashboardOrderListParams {
  status?: DashboardOrderStatus;
  start_date?: string;
  end_date?: string;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Order Item for Create Request
 */
export interface DashboardOrderCreateItem {
  item_id?: number;
  name: string;
  quantity: number;
  price?: number;
  instructions?: string;
}

/**
 * Create Order Request
 * POST /api/v1/dashboard/restaurants/{restaurant_id}/orders
 */
export interface DashboardOrderCreateRequest {
  order_details: DashboardOrderCreateItem[];
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customization?: DashboardOrderCustomization;
  status?: DashboardOrderStatus;
}

/**
 * Create Order Response
 */
export interface DashboardOrderCreateResponse extends DashboardOrder {
  message: string;
}

/**
 * Update Order Request
 * PUT /api/v1/dashboard/orders/{order_id}
 */
export interface DashboardOrderUpdateRequest {
  status?: DashboardOrderStatus;
  total_amount?: number;
  order_details?: DashboardOrderCreateItem[];
  customization?: DashboardOrderCustomization;
}

/**
 * Update Status Request
 * PUT /api/v1/dashboard/orders/{order_id}/status
 */
export interface DashboardOrderStatusRequest {
  status: DashboardOrderStatus;
}

/**
 * Update Status Response
 */
export interface DashboardOrderStatusResponse {
  order_id: number;
  status: DashboardOrderStatus;
  message: string;
}

/**
 * Cancel Order Response
 * PUT /api/v1/dashboard/orders/{order_id}/cancel
 */
export interface DashboardOrderCancelResponse {
  order_id: number;
  status: "cancelled";
  previous_status: DashboardOrderStatus;
  message: string;
}

/**
 * Delete Order Response
 * DELETE /api/v1/dashboard/orders/{order_id}
 */
export interface DashboardOrderDeleteResponse {
  order_id: number;
  message: string;
}

/**
 * Restore Order Response
 * PUT /api/v1/dashboard/orders/{order_id}/restore
 */
export interface DashboardOrderRestoreResponse {
  order_id: number;
  message: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface DashboardStats {
  total_calls: number;
  total_reservations: number;
  total_orders: number;
  total_revenue: number;
  calls_today: number;
  reservations_today: number;
  orders_today: number;
}

export interface CallsOverTime {
  date: string;
  calls: number;
  bookings: number;
}

export interface IntentData {
  name: string;
  value: number;
  color?: string;
}

export interface OutcomeData {
  outcome: string;
  value: number;
}

// ============================================================================
// Settings Types
// ============================================================================

export interface RestaurantSettings {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  opening_hours?: OpeningHours[];
  reservation_settings?: ReservationSettings;
}

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
}

export interface ReservationSettings {
  max_party_size: number;
  min_advance_hours: number;
  max_advance_days: number;
  slot_duration_minutes: number;
  buffer_minutes: number;
}
