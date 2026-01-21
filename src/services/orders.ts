/**
 * Orders Service
 * Handles all order-related API calls for the Client Dashboard
 * Uses dashboard endpoints with restaurant_id from auth context
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  DashboardOrder,
  DashboardOrderWithHistory,
  DashboardOrderListResponse,
  DashboardOrderListParams,
  DashboardOrderCreateRequest,
  DashboardOrderCreateResponse,
  DashboardOrderUpdateRequest,
  DashboardOrderStatusRequest,
  DashboardOrderStatusResponse,
  DashboardOrderCancelResponse,
  DashboardOrderDeleteResponse,
  DashboardOrderRestoreResponse,
} from "@/types/api.types";

// ============================================================================
// List Orders
// ============================================================================

/**
 * Get paginated list of orders for a restaurant
 * GET /api/v1/dashboard/restaurants/{restaurant_id}/orders
 */
export async function getOrders(
  restaurantId: number,
  params?: DashboardOrderListParams
): Promise<DashboardOrderListResponse> {
  const response = await api.get<DashboardOrderListResponse>(ENDPOINTS.ORDERS.LIST(restaurantId), {
    params: params
      ? {
          status: params.status,
          start_date: params.start_date,
          end_date: params.end_date,
          include_deleted: params.include_deleted,
          limit: params.limit,
          offset: params.offset,
        }
      : undefined,
  });

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch orders");
  }
  return response.data;
}

// ============================================================================
// Get Single Order
// ============================================================================

/**
 * Get order by ID with history
 * GET /api/v1/dashboard/orders/{order_id}
 * Returns order details including change history
 */
export async function getOrderDetails(orderId: number): Promise<DashboardOrderWithHistory> {
  const response = await api.get<DashboardOrderWithHistory>(ENDPOINTS.ORDERS.GET(orderId));
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch order details");
  }
  return response.data;
}

// ============================================================================
// Create Order
// ============================================================================

/**
 * Create a new order
 * POST /api/v1/dashboard/restaurants/{restaurant_id}/orders
 */
export async function createOrder(
  restaurantId: number,
  data: DashboardOrderCreateRequest
): Promise<DashboardOrderCreateResponse> {
  const response = await api.post<DashboardOrderCreateResponse>(
    ENDPOINTS.ORDERS.CREATE(restaurantId),
    data
  );
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to create order");
  }
  return response.data;
}

// ============================================================================
// Update Order
// ============================================================================

/**
 * Update an existing order
 * PUT /api/v1/dashboard/orders/{order_id}
 */
export async function updateOrder(
  orderId: number,
  data: DashboardOrderUpdateRequest
): Promise<DashboardOrder> {
  const response = await api.put<DashboardOrder>(ENDPOINTS.ORDERS.UPDATE(orderId), data);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update order");
  }
  return response.data;
}

// ============================================================================
// Update Order Status
// ============================================================================

/**
 * Update only the order status
 * PUT /api/v1/dashboard/orders/{order_id}/status
 */
export async function updateOrderStatus(
  orderId: number,
  data: DashboardOrderStatusRequest
): Promise<DashboardOrderStatusResponse> {
  const response = await api.put<DashboardOrderStatusResponse>(
    ENDPOINTS.ORDERS.UPDATE_STATUS(orderId),
    data
  );
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update order status");
  }
  return response.data;
}

// ============================================================================
// Cancel Order
// ============================================================================

/**
 * Cancel an order
 * PUT /api/v1/dashboard/orders/{order_id}/cancel
 */
export async function cancelOrder(orderId: number): Promise<DashboardOrderCancelResponse> {
  const response = await api.put<DashboardOrderCancelResponse>(ENDPOINTS.ORDERS.CANCEL(orderId));
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to cancel order");
  }
  return response.data;
}

// ============================================================================
// Delete Order
// ============================================================================

/**
 * Soft delete an order
 * DELETE /api/v1/dashboard/orders/{order_id}
 */
export async function deleteOrder(orderId: number): Promise<DashboardOrderDeleteResponse> {
  const response = await api.delete<DashboardOrderDeleteResponse>(ENDPOINTS.ORDERS.DELETE(orderId));
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to delete order");
  }
  return response.data;
}

// ============================================================================
// Restore Order
// ============================================================================

/**
 * Restore a soft-deleted order
 * PUT /api/v1/dashboard/orders/{order_id}/restore
 */
export async function restoreOrder(orderId: number): Promise<DashboardOrderRestoreResponse> {
  const response = await api.put<DashboardOrderRestoreResponse>(ENDPOINTS.ORDERS.RESTORE(orderId));
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to restore order");
  }
  return response.data;
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  DashboardOrder,
  DashboardOrderItem,
  DashboardOrderCustomization,
  DashboardOrderListResponse,
  DashboardOrderListParams,
  DashboardOrderCreateRequest,
  DashboardOrderCreateItem,
  DashboardOrderCreateResponse,
  DashboardOrderUpdateRequest,
  DashboardOrderStatusRequest,
  DashboardOrderStatusResponse,
  DashboardOrderCancelResponse,
  DashboardOrderDeleteResponse,
  DashboardOrderRestoreResponse,
  DashboardOrderStatus,
} from "@/types/api.types";
