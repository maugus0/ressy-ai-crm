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

/**
 * SMS Redirect Configuration
 * Configuration for redirecting order/reservation requests to external platforms via SMS
 */
export interface SMSRedirectConfig {
  /** Whether SMS redirect is enabled for this capability */
  enabled: boolean;
  /** URL to redirect customers to (required when enabled) */
  redirect_url: string | null;
  /** Custom SMS message template (null = use default) */
  redirect_message: string | null;
}

/**
 * Restaurant Features - Configurable capabilities for RessyAI
 */
export interface RestaurantFeatures {
  orders_enabled: boolean;
  reservations_enabled: boolean;
  faqs_enabled: boolean;
  /**
   * SMS redirect configuration for orders.
   * Mutual exclusivity: orders_sms_redirect.enabled requires orders_enabled = false.
   * The UI enforces this; the backend should also validate.
   */
  orders_sms_redirect?: SMSRedirectConfig | null;
  /**
   * SMS redirect configuration for reservations.
   * Mutual exclusivity: reservations_sms_redirect.enabled requires reservations_enabled = false.
   * The UI enforces this; the backend should also validate.
   */
  reservations_sms_redirect?: SMSRedirectConfig | null;
}

/**
 * Day Hours - Operating hours for a single day
 */
export interface DayHours {
  open: string | null;
  close: string | null;
  is_closed: boolean;
  is_24_hours: boolean;
}

/**
 * Operating Hours - Weekly operating hours for the restaurant
 */
export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

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
  forward_escalations: boolean | null;
  escalation_phone_number: string | null;
  kill_switch_enabled: boolean;
  kill_switch_can_redirect: boolean;
  kill_switch_blockers: string[];
  /** Forward minutes for reservation booking window */
  forward_minutes: number;
  /** Backward minutes for cancellation window */
  backward_minutes: number;
  /** Whether credit card is required for reservations */
  is_credit_card_required_for_reservation: boolean;
  /** Weekly operating hours for the restaurant */
  operating_hours: OperatingHours | null;
  /** Restaurant timezone (IANA name) */
  timezone: string | null;
  /** Maximum seating capacity for the restaurant (null if not configured) */
  reservation_seating_capacity: number | null;
  /** How many days in advance reservations can be made (null if not configured) */
  reservation_advance_days: number | null;
  /** Restaurant feature flags for RessyAI capabilities */
  features: RestaurantFeatures | null;
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
  operating_hours?: OperatingHours | null;
  reservation_seating_capacity?: number;
  reservation_advance_days?: number;
  features?: Partial<RestaurantFeatures>;
  // Note: twilio_phone_number is read-only and cannot be updated by client
}

export interface ClientRestaurantKillSwitchUpdateRequest {
  enabled: boolean;
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
// Call Types (Legacy)
// ============================================================================

export type CallStatus =
  | "completed"
  | "missed"
  | "voicemail"
  | "in_progress"
  | "failed"
  | "abandoned"
  | "agent_bypassed";
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
// Client Calls Types (New API)
// ============================================================================

/**
 * Call list item from GET /api/v1/client/calls
 */
export interface ClientCallListItem {
  call_id: string;
  restaurant_id: string;
  restaurant_name: string;
  caller_phone: string;
  duration_seconds: number;
  status: string;
  started_at: string;
  has_transcript: boolean;
  summary?: string | null;
}

/**
 * Call list response from GET /api/v1/client/calls
 */
export interface ClientCallListResponse {
  items: ClientCallListItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Call list query parameters
 */
export interface ClientCallListParams {
  date_from?: string;
  date_to?: string;
  status?: string;
  duration_min?: number;
  duration_max?: number;
  caller_phone?: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "duration";
  sort_order?: "asc" | "desc";
}

/**
 * Transcript entry from call details
 */
export interface ClientCallTranscriptEntry {
  sequence: number;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}

/**
 * Call details from GET /api/v1/client/calls/{call_id}
 */
export interface ClientCallDetails {
  call_id: string;
  restaurant_id: string;
  restaurant_name: string;
  caller_phone: string;
  status: string;
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
  cost?: number | null;
  call_direction: "inbound" | "outbound";
  has_transcript: boolean;
  transcript?: ClientCallTranscriptEntry[] | null;
  order_id?: string | null;
  reservation_id?: string | null;
  summary?: string | null;
}

/**
 * Call search parameters
 */
export interface ClientCallSearchParams {
  q: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "duration";
  sort_order?: "asc" | "desc";
}

/**
 * Conversion rates from call analytics
 */
export interface ClientCallConversionRates {
  orders: number;
  reservations: number;
  rate: number;
}

/**
 * Call analytics response from GET /api/v1/client/calls/analytics
 */
export interface ClientCallAnalyticsResponse {
  total_calls: number;
  average_call_duration: number;
  status_breakdown: Record<string, number>;
  time_of_day_distribution: CallTimeDistribution[];
  calls_by_day_of_week: CallDayOfWeekDistribution[];
  conversion_rates: ClientCallConversionRates;
}

/**
 * Call export parameters
 */
export interface ClientCallExportParams {
  date_from?: string;
  date_to?: string;
  status?: string;
  duration_min?: number;
  duration_max?: number;
  caller_phone?: string;
  sort_by?: "created_at" | "duration";
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
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
// Dashboard User Types (Callers/Customers)
// ============================================================================

/**
 * User statistics for a specific restaurant
 */
export interface DashboardUserStatistics {
  total_calls: number;
  total_orders: number;
  total_reservations: number;
}

/**
 * Dashboard User - Response from dashboard user endpoints
 * GET /api/v1/dashboard/restaurants/{restaurant_id}/users
 */
export interface DashboardUser {
  id: number;
  name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  is_spam: number | boolean;
  credit_card: string | null;
  created_at: string;
  updated_at: string;
  statistics?: DashboardUserStatistics;
}

/**
 * Dashboard User Details Response
 * GET /api/v1/dashboard/users/{user_id}
 */
export interface DashboardUserDetailsResponse {
  id: number;
  name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  is_spam: number | boolean;
  credit_card: string | null;
  created_at: string;
  updated_at: string;
  restaurant_ids: number[];
  statistics?: DashboardUserStatistics;
}

/**
 * Dashboard User List Response
 * GET /api/v1/dashboard/restaurants/{restaurant_id}/users
 */
export interface DashboardUserListResponse {
  restaurant_id: number;
  users: DashboardUser[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Dashboard User List Query Parameters
 */
export interface DashboardUserListParams {
  search?: string;
  is_spam?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Dashboard User Create Request
 * POST /api/v1/dashboard/restaurants/{restaurant_id}/users
 */
export interface DashboardUserCreateRequest {
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  is_spam?: boolean;
  credit_card?: string;
}

/**
 * Dashboard User Create Response
 */
export interface DashboardUserCreateResponse {
  message: string;
  user_id: number;
  user: DashboardUser;
  is_new_user: boolean;
}

/**
 * Dashboard User Update Request
 * PUT /api/v1/dashboard/users/{user_id}
 */
export interface DashboardUserUpdateRequest {
  name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  is_spam?: boolean;
  credit_card?: string;
}

/**
 * Dashboard User Update Response
 */
export interface DashboardUserUpdateResponse {
  message: string;
  user: DashboardUser;
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
// Order History Types
// ============================================================================

/**
 * Order History Action Types
 */
export type OrderHistoryAction =
  | "created"
  | "status_changed"
  | "items_updated"
  | "updated"
  | "cancelled"
  | "deleted"
  | "restored";

/**
 * Order History Entry
 * Represents a single change in order history
 */
export interface OrderHistoryEntry {
  id: number;
  action: OrderHistoryAction;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  change_summary: string;
  created_at: string;
}

/**
 * Dashboard Order with History
 * Extended response when fetching order details by ID
 * GET /api/v1/dashboard/orders/{order_id}
 */
export interface DashboardOrderWithHistory extends DashboardOrder {
  history: OrderHistoryEntry[];
}

// ============================================================================
// Reservation History Types
// ============================================================================

/**
 * Reservation History Action Types
 */
export type ReservationHistoryAction =
  | "created"
  | "status_changed"
  | "updated"
  | "confirmed"
  | "cancelled"
  | "finalized";

/**
 * Reservation History Entry
 * Represents a single change in reservation history
 */
export interface ReservationHistoryEntry {
  id: number;
  action: ReservationHistoryAction;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  change_summary: string;
  created_at: string;
}

/**
 * Reservation with History
 * Extended response when fetching reservation details by ID
 * GET /api/v1/dashboard/reservations/{reservation_id}
 */
export interface ReservationWithHistory extends Reservation {
  history: ReservationHistoryEntry[];
}

// ============================================================================
// Client Analytics Types
// ============================================================================

/**
 * Recent Activity Item
 * Part of the analytics overview response
 */
export interface AnalyticsRecentActivity {
  id: number;
  type: "call" | "reservation" | "order";
  description: string;
  status: string;
  timestamp: string;
}

/**
 * Today's Schedule Item
 * Part of the analytics overview response
 */
export interface AnalyticsTodaySchedule {
  id: number;
  time: string;
  party_size: number;
  customer_name: string;
  status: string;
  special_request?: string;
}

/**
 * Pending Order Item
 * Part of the analytics overview response
 */
export interface AnalyticsPendingOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  timestamp: string;
}

/**
 * Restaurant Analytics Overview
 * GET /api/v1/client/analytics
 */
export interface AnalyticsOverview {
  // Call stats
  total_calls: number;
  calls_today: number;
  average_call_duration: number;
  // Reservation stats
  total_reservations: number;
  reservations_today: number;
  confirmed_reservations: number;
  pending_reservations: number;
  // Order stats
  total_orders: number;
  orders_today: number;
  total_revenue: number;
  revenue_today: number;
  pending_orders_count: number;
  // Menu stats
  total_menu_items: number;
  available_menu_items: number;
  special_items: number;
  menu_categories: string[];
  // FAQ & Customers
  total_faqs: number;
  total_customers: number;
  // Recent activity
  recent_activity: AnalyticsRecentActivity[];
  todays_schedule: AnalyticsTodaySchedule[];
  pending_orders: AnalyticsPendingOrder[];
}

/**
 * Time of Day Distribution
 * Part of call analytics response
 */
export interface CallTimeDistribution {
  hour_bucket: number;
  count: number;
}

/**
 * Calls by Day of Week
 * Part of call analytics response
 */
export interface CallDayOfWeekDistribution {
  day_of_week: number;
  count: number;
}

/**
 * Call Analytics
 * GET /api/v1/client/analytics/calls
 */
export interface CallAnalytics {
  total_calls: number;
  calls_today: number;
  average_call_duration: number;
  status_breakdown: Record<string, number>;
  time_of_day_distribution: CallTimeDistribution[];
  calls_by_day_of_week: CallDayOfWeekDistribution[];
}

/**
 * Reservation Analytics
 * GET /api/v1/client/analytics/reservations
 */
export interface ReservationAnalytics {
  total_reservations: number;
  reservations_today: number;
  confirmed_reservations: number;
  pending_reservations: number;
  cancelled_reservations: number;
  completed_reservations: number;
  no_show_reservations: number;
}

/**
 * Order Analytics
 * GET /api/v1/client/analytics/orders
 */
export interface OrderAnalytics {
  total_orders: number;
  orders_today: number;
  total_revenue: number;
  revenue_today: number;
  pending_orders: number;
  confirmed_orders: number;
  preparing_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

/**
 * Menu Analytics
 * GET /api/v1/client/analytics/menu
 */
export interface MenuAnalytics {
  total_menu_items: number;
  available_menu_items: number;
  unavailable_menu_items: number;
  special_items: number;
  categories: string[];
  category_count: number;
}

// Legacy types for backwards compatibility
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
// SSE (Server-Sent Events) Types
// ============================================================================

/**
 * SSE Event Types
 * The main event categories sent by the backend
 */
export type SSEEventType = "escalation" | "order" | "reservation" | "system" | "heartbeat";

/**
 * SSE Event Subtypes
 * Specific event subtypes within each category
 */
export type SSEEscalationSubtype =
  | "user_requested"
  | "internal_server_error"
  | "suspected_spam"
  | "sms_redirect_failed"
  | "kill_switch_redirected";
export type SSESystemSubtype = "kill_switch_toggled" | "kill_switch_bulk_updated";
export type SSEOrderSubtype = "new_order" | "order_updated" | "order_cancelled";
export type SSEReservationSubtype =
  | "new_reservation"
  | "reservation_updated"
  | "reservation_cancelled";
export type SSEEventSubtype =
  | SSEEscalationSubtype
  | SSESystemSubtype
  | SSEOrderSubtype
  | SSEReservationSubtype
  | "heartbeat";

/**
 * SSE Escalation Type
 * Types of escalation events that can be triggered
 */
export type SSEEscalationType =
  | "user_requested"
  | "internal_server_error"
  | "suspected_spam"
  | "sms_redirect_failed"
  | "kill_switch_redirected";

/**
 * SSE Event
 * The main event structure received from the SSE stream
 */
export interface SSEEvent {
  /** Unique identifier for this event */
  id: string;
  /** Main event category */
  event_type: SSEEventType;
  /** Specific event subtype */
  subtype: SSEEventSubtype;
  /** Restaurant ID this event belongs to */
  restaurant_id: number;
  /** ISO timestamp of when the event occurred */
  timestamp: string;
  /** Event-specific data payload */
  data: Record<string, unknown>;
}

/**
 * SSE Escalation Event Data
 * Data payload for escalation events
 */
export interface SSEEscalationData {
  restaurant_name?: string;
  caller_phone?: string;
  call_id?: string;
  summary?: string;
  /** Reason for escalation (e.g., "Customer requested to speak with manager about billing issue") */
  reason?: string;
  /** Urgency level (e.g., "urgent", "critical", "high", "medium") */
  urgency?: string;
  /** Error message if this is an error escalation */
  error_message?: string;
  /** Error code if this is an error escalation */
  error_code?: string;
  /** Spam score (0-1) if this is a spam escalation */
  spam_score?: number;
  /** Array of spam indicators (e.g., ["rapid_hangup", "known_spam_number"]) */
  indicators?: string[];
}

/**
 * SSE Order Event Data
 * Data payload for order events
 */
export interface SSEOrderData {
  order_id?: number;
  status?: string;
  total_amount?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery?: boolean;
  table_number?: string;
  notes?: string;
  item_count?: number;
}

/**
 * SSE Reservation Event Data
 * Data payload for reservation events
 */
export interface SSEReservationData {
  reservation_id?: number;
  confirmation_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  party_size?: number;
  date_time?: string;
  status?: string;
  special_request?: string;
  notes?: string;
}

/**
 * SSE Connection Statistics
 * Response from GET /api/v1/sse/events/stats
 */
export interface SSEConnectionStats {
  total_connections: number;
  connections_by_restaurant: Record<string, number>;
  uptime_seconds: number;
}

/**
 * SSE Trigger Escalation Request
 * POST /api/v1/sse/events/escalation/{restaurant_id}
 */
export interface SSETriggerEscalationRequest {
  type: SSEEscalationType;
  data: Record<string, unknown>;
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
