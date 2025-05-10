import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { webhookCallSchemas } from "../../../schemas.js";
import { z } from "zod";

type RetrieveWebhookCallParams = z.infer<typeof webhookCallSchemas.retrieve>;

/**
 * Retrieves a specific webhook call log by ID
 * 
 * @param params Parameters for retrieving a webhook call log
 * @returns Response with the webhook call log details
 */
export async function retrieveWebhookCallHandler(
  params: RetrieveWebhookCallParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Fetch the specific webhook call log
    const call = await client.webhookCalls.find(params.callId);

    // Format the response
    return createResponse({
      id: call.id,
      webhook_id: params.webhookId,
      status: call.status,
      entity_type: call.entity_type,
      request_url: call.request_url,
      request_headers: call.request_headers,
      request_payload: call.request_payload,
      response_status: call.response_status,
      response_headers: call.response_headers,
      response_payload: call.response_payload,
      created_at: call.created_at
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

    // Handle not found errors
    if (
      typeof error === 'object' && 
      error !== null && 
      ('status' in error && error.status === 404 ||
       'message' in error && typeof error.message === 'string' && 
       (error.message.includes('404') || error.message.toLowerCase().includes('not found')))
    ) {
      return createErrorResponse(
        `No webhook call log found with ID: ${params.callId} for webhook: ${params.webhookId}`
      );
    }

    // Handle other errors
    return createErrorResponse(
      `Failed to retrieve webhook call log: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}