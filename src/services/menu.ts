/**
 * Menu Service
 * Handles all menu-related API calls for Client Dashboard
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ClientMenuItem,
  ClientMenuItemCreateRequest,
  ClientMenuItemUpdateRequest,
  ClientMenuListResponse,
  MenuListParams,
  MenuCategoriesResponse,
  MenuAvailabilityRequest,
  MenuSpecialRequest,
  MenuBulkAvailabilityRequest,
  MenuBulkAvailabilityResponse,
  MenuDeleteResponse,
} from "@/types/api.types";

// ============================================================================
// Menu CRUD Functions
// ============================================================================

/**
 * Get paginated list of menu items with optional filters
 * GET /api/v1/client/menu
 */
export async function getMenuItems(params?: MenuListParams): Promise<ClientMenuListResponse> {
  const response = await api.get<ClientMenuListResponse>(ENDPOINTS.MENU.LIST, {
    params: params
      ? {
          page: params.page,
          limit: params.limit,
          category: params.category,
          sub_category: params.sub_category,
          is_available: params.is_available,
          is_special: params.is_special,
          search: params.search,
        }
      : undefined,
  });

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch menu items");
  }

  return response.data;
}

/**
 * Get a single menu item by ID
 * GET /api/v1/client/menu/{menu_id}
 */
export async function getMenuItem(menuId: number): Promise<ClientMenuItem> {
  const response = await api.get<ClientMenuItem>(ENDPOINTS.MENU.GET(menuId));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch menu item");
  }

  return response.data;
}

/**
 * Create a new menu item
 * POST /api/v1/client/menu
 */
export async function createMenuItem(data: ClientMenuItemCreateRequest): Promise<ClientMenuItem> {
  const response = await api.post<ClientMenuItem>(ENDPOINTS.MENU.CREATE, data);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to create menu item");
  }

  return response.data;
}

/**
 * Update an existing menu item
 * PUT /api/v1/client/menu/{menu_id}
 */
export async function updateMenuItem(
  menuId: number,
  data: ClientMenuItemUpdateRequest
): Promise<ClientMenuItem> {
  const response = await api.put<ClientMenuItem>(ENDPOINTS.MENU.UPDATE(menuId), data);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update menu item");
  }

  return response.data;
}

/**
 * Delete a menu item
 * DELETE /api/v1/client/menu/{menu_id}
 */
export async function deleteMenuItem(menuId: number): Promise<MenuDeleteResponse> {
  const response = await api.delete<MenuDeleteResponse>(ENDPOINTS.MENU.DELETE(menuId));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to delete menu item");
  }

  return response.data;
}

// ============================================================================
// Menu Toggle Functions
// ============================================================================

/**
 * Toggle menu item availability
 * PATCH /api/v1/client/menu/{menu_id}/availability
 */
export async function toggleMenuAvailability(
  menuId: number,
  data: MenuAvailabilityRequest
): Promise<ClientMenuItem> {
  const response = await api.patch<ClientMenuItem>(
    ENDPOINTS.MENU.TOGGLE_AVAILABILITY(menuId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update availability");
  }

  return response.data;
}

/**
 * Toggle menu item special status
 * PATCH /api/v1/client/menu/{menu_id}/special
 */
export async function toggleMenuSpecial(
  menuId: number,
  data: MenuSpecialRequest
): Promise<ClientMenuItem> {
  const response = await api.patch<ClientMenuItem>(ENDPOINTS.MENU.TOGGLE_SPECIAL(menuId), data);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update special status");
  }

  return response.data;
}

/**
 * Bulk update menu item availability
 * PATCH /api/v1/client/menu/bulk-availability
 */
export async function bulkUpdateMenuAvailability(
  data: MenuBulkAvailabilityRequest
): Promise<MenuBulkAvailabilityResponse> {
  const response = await api.patch<MenuBulkAvailabilityResponse>(
    ENDPOINTS.MENU.BULK_AVAILABILITY,
    data
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to bulk update availability");
  }

  return response.data;
}

// ============================================================================
// Menu Categories
// ============================================================================

/**
 * Get all categories and sub-categories for the restaurant's menu
 * GET /api/v1/client/menu/categories
 */
export async function getMenuCategories(): Promise<MenuCategoriesResponse> {
  const response = await api.get<MenuCategoriesResponse>(ENDPOINTS.MENU.CATEGORIES);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch menu categories");
  }

  return response.data;
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  ClientMenuItem,
  ClientMenuItemCreateRequest,
  ClientMenuItemUpdateRequest,
  ClientMenuListResponse,
  MenuListParams,
  MenuCategoriesResponse,
  MenuAvailabilityRequest,
  MenuSpecialRequest,
  MenuBulkAvailabilityRequest,
  MenuBulkAvailabilityResponse,
  MenuDeleteResponse,
};
