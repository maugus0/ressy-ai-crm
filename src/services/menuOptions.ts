/**
 * Menu Options Service
 * Handles option group and option value CRUD, plus attach/detach to menu items
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  OptionGroup,
  OptionValue,
  OptionGroupCreateRequest,
  OptionGroupUpdateRequest,
  OptionValueCreateRequest,
  OptionValueUpdateRequest,
  MenuItemOptionGroupAttachRequest,
} from "@/types/api.types";

// ============================================================================
// Option Group CRUD
// ============================================================================

export async function getOptionGroups(): Promise<OptionGroup[]> {
  const response = await api.get<OptionGroup[]>(ENDPOINTS.MENU_OPTIONS.GROUPS_LIST);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch option groups");
  }

  return response.data;
}

export async function getOptionGroup(groupId: number): Promise<OptionGroup> {
  const response = await api.get<OptionGroup>(ENDPOINTS.MENU_OPTIONS.GROUP_GET(groupId));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch option group");
  }

  return response.data;
}

export async function createOptionGroup(data: OptionGroupCreateRequest): Promise<OptionGroup> {
  const response = await api.post<OptionGroup>(ENDPOINTS.MENU_OPTIONS.GROUPS_CREATE, data);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to create option group");
  }

  return response.data;
}

export async function updateOptionGroup(
  groupId: number,
  data: OptionGroupUpdateRequest
): Promise<OptionGroup> {
  const response = await api.put<OptionGroup>(ENDPOINTS.MENU_OPTIONS.GROUP_UPDATE(groupId), data);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update option group");
  }

  return response.data;
}

export async function deleteOptionGroup(groupId: number): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(
    ENDPOINTS.MENU_OPTIONS.GROUP_DELETE(groupId)
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to delete option group");
  }

  return response.data;
}

// ============================================================================
// Option Value CRUD
// ============================================================================

export async function createOptionValue(
  groupId: number,
  data: OptionValueCreateRequest
): Promise<OptionValue> {
  const response = await api.post<OptionValue>(ENDPOINTS.MENU_OPTIONS.VALUE_CREATE(groupId), data);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to create option value");
  }

  return response.data;
}

export async function updateOptionValue(
  valueId: number,
  data: OptionValueUpdateRequest
): Promise<OptionValue> {
  const response = await api.put<OptionValue>(ENDPOINTS.MENU_OPTIONS.VALUE_UPDATE(valueId), data);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update option value");
  }

  return response.data;
}

export async function deleteOptionValue(valueId: number): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(
    ENDPOINTS.MENU_OPTIONS.VALUE_DELETE(valueId)
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to delete option value");
  }

  return response.data;
}

// ============================================================================
// Attach / Detach Option Groups to Menu Items
// ============================================================================

export async function attachOptionGroupToItem(
  menuId: number,
  data: MenuItemOptionGroupAttachRequest
): Promise<{ message: string; menu_item_id: number; group_id: number }> {
  const response = await api.post<{ message: string; menu_item_id: number; group_id: number }>(
    ENDPOINTS.MENU_OPTIONS.ITEM_ATTACH_GROUP(menuId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to attach option group");
  }

  return response.data;
}

export async function detachOptionGroupFromItem(
  menuId: number,
  groupId: number
): Promise<{ message: string; menu_item_id: number; group_id: number }> {
  const response = await api.delete<{ message: string; menu_item_id: number; group_id: number }>(
    ENDPOINTS.MENU_OPTIONS.ITEM_DETACH_GROUP(menuId, groupId)
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to detach option group");
  }

  return response.data;
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  OptionGroup,
  OptionValue,
  OptionGroupCreateRequest,
  OptionGroupUpdateRequest,
  OptionValueCreateRequest,
  OptionValueUpdateRequest,
  MenuItemOptionGroupAttachRequest,
};
