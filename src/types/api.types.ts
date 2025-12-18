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
// Reservation Types
// ============================================================================

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

export interface Reservation {
  id: number;
  confirmation_number: string;
  status: ReservationStatus;
  date_time: string;
  party_size: number;
  name: string;
  phone_number: string;
  email?: string;
  special_request?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

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
// Menu Types
// ============================================================================

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
// FAQ Types
// ============================================================================

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
// Order Types
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
