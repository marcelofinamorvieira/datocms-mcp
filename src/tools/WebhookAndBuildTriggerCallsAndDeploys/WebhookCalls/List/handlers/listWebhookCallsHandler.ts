import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { webhookCallSchemas } from "../../../schemas.js";
import { z } from "zod";

type ListWebhookCallsParams = z.infer<typeof webhookCallSchemas.list>;

/**
 * Retrieves a list of webhook call logs for a specific webhook
 * 
 * @param params Parameters for listing webhook call logs
 * @returns Response with the list of webhook call logs
 */
export async function listWebhookCallsHandler(
  params: ListWebhookCallsParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Prepare the query parameters
    const queryParams: Record<string, any> = {};

    // Add pagination parameters if provided
    if (params.page) {
      if (params.page.offset !== undefined) queryParams.page_offset = params.page.offset;
      if (params.page.limit !== undefined) queryParams.page_limit = params.page.limit;
    }

    // Add filter parameters if provided
    if (params.filter) {
      if (params.filter.status !== undefined) queryParams.filter_status = params.filter.status;
      if (params.filter.itemType !== undefined) queryParams.filter_item_type = params.filter.itemType;
      if (params.filter.event !== undefined) queryParams.filter_event = params.filter.event;
    }

    // Fetch webhook call logs for the specific webhook
    const callLogs = await client.webhookCalls.list({
      ...queryParams,
      webhookId: params.webhookId
    });

    // Format the response
    return createResponse({
      webhook_id: params.webhookId,
      calls: callLogs.map((call: any) => ({
        id: call.id,
        status: call.status,
        entity_type: call.entity_type,
        request_url: call.request_url,
        request_headers: call.request_headers,
        request_payload: call.request_payload,
        response_status: call.response_status,
        response_headers: call.response_headers,
        response_payload: call.response_payload,
        created_at: call.created_at
      })),
      total: callLogs.length,
    });
  } catch (error) {
    // Handle authorization errors
    if (
      typeof error === 'object' && 
      error !== null && 
      ('status' in error && error.status === 401 ||
       'message' in error && typeof error.message === 'string' && 
       (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')))
    ) {
      return createErrorResponse(
        "The provided API token does not have permission to access webhook call logs."
      );
    }

    // Handle not found errors for the webhook
    if (
      typeof error === 'object' && 
      error !== null && 
      ('status' in error && error.status === 404 ||
       'message' in error && typeof error.message === 'string' && 
       (error.message.includes('404') || error.message.toLowerCase().includes('not found')))
    ) {
      return createErrorResponse(
        `No webhook found with ID: ${params.webhookId}`
      );
    }

    // Handle other errors
    return createErrorResponse(
      `Failed to list webhook call logs: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}