/**
 * FAQ Service
 * Handles all FAQ-related API calls for the Client Dashboard
 * All endpoints are auto-scoped to the authenticated restaurant
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ClientFAQ,
  ClientFAQCreateRequest,
  ClientFAQUpdateRequest,
  ClientFAQListResponse,
  ClientBulkFAQCreateRequest,
  ClientBulkFAQCreateResponse,
  FAQListParams,
  FAQDeleteResponse,
} from "@/types/api.types";

// ============================================================================
// List FAQs
// ============================================================================

/**
 * Get paginated list of FAQs for the authenticated restaurant
 */
export async function getFAQs(params?: FAQListParams): Promise<ClientFAQListResponse> {
  const response = await api.get<ClientFAQListResponse>(ENDPOINTS.FAQ.LIST, {
    params: params
      ? {
          page: params.page,
          limit: params.limit,
          search: params.search,
        }
      : undefined,
  });
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch FAQs");
  }
  return response.data;
}

// ============================================================================
// Get Single FAQ
// ============================================================================

/**
 * Get FAQ by ID
 */
export async function getFAQ(faqId: number): Promise<ClientFAQ> {
  const response = await api.get<ClientFAQ>(ENDPOINTS.FAQ.GET(faqId));
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch FAQ details");
  }
  return response.data;
}

// ============================================================================
// Create FAQ
// ============================================================================

/**
 * Create a new FAQ
 */
export async function createFAQ(data: ClientFAQCreateRequest): Promise<ClientFAQ> {
  const response = await api.post<ClientFAQ>(ENDPOINTS.FAQ.CREATE, data);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to create FAQ");
  }
  return response.data;
}

// ============================================================================
// Update FAQ
// ============================================================================

/**
 * Update an existing FAQ
 */
export async function updateFAQ(faqId: number, data: ClientFAQUpdateRequest): Promise<ClientFAQ> {
  const response = await api.put<ClientFAQ>(ENDPOINTS.FAQ.UPDATE(faqId), data);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update FAQ");
  }
  return response.data;
}

// ============================================================================
// Delete FAQ
// ============================================================================

/**
 * Delete an FAQ
 */
export async function deleteFAQ(faqId: number): Promise<FAQDeleteResponse> {
  const response = await api.delete<FAQDeleteResponse>(ENDPOINTS.FAQ.DELETE(faqId));
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to delete FAQ");
  }
  return response.data;
}

// ============================================================================
// Bulk Create FAQs
// ============================================================================

/**
 * Bulk create FAQs from array
 */
export async function bulkCreateFAQs(
  data: ClientBulkFAQCreateRequest
): Promise<ClientBulkFAQCreateResponse> {
  const response = await api.post<ClientBulkFAQCreateResponse>(ENDPOINTS.FAQ.BULK_CREATE, data);
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to bulk create FAQs");
  }
  return response.data;
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  ClientFAQ,
  ClientFAQCreateRequest,
  ClientFAQUpdateRequest,
  ClientFAQListResponse,
  ClientBulkFAQCreateRequest,
  ClientBulkFAQCreateResponse,
  FAQListParams,
  FAQDeleteResponse,
};
