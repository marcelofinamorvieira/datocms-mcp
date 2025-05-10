import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { webhookSchemas } from "../../../schemas.js";
import { z } from "zod";

type UpdateWebhookParams = z.infer<typeof webhookSchemas.update>;

/**
 * Updates an existing webhook in DatoCMS
 * 
 * @param params Parameters for updating a webhook
 * @returns Response with the updated webhook details
 */
export async function updateWebhookHandler(
  params: UpdateWebhookParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Build update payload with only the provided parameters
    const updatePayload: Record<string, any> = {};
    
    if (params.name !== undefined) updatePayload.name = params.name;
    if (params.url !== undefined) updatePayload.url = params.url;
    if (params.headers !== undefined) updatePayload.headers = params.headers;
    if (params.events !== undefined) updatePayload.events = params.events;
    if (params.payload_format !== undefined) updatePayload.payload_format = params.payload_format;
    if (params.triggers !== undefined) updatePayload.triggers = params.triggers;
    if (params.httpsOnly !== undefined) updatePayload.https_only = params.httpsOnly;

    // Update the webhook
    const webhook = await client.webhooks.update(params.webhookId, updatePayload as any);

    // Return the updated webhook details
    return createResponse({
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      headers: webhook.headers,
      events: webhook.events,
      payload_format: (webhook as any).payload_type, 
      triggers: (webhook as any).triggers,
      https_only: (webhook as any).https_only,
      created_at: (webhook as any).created_at,
      updated_at: (webhook as any).updated_at,
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
        "The provided API token does not have permission to update webhooks."
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
        `No webhook found with ID: ${params.webhookId}`
      );
    }

    // Handle other errors
    return createErrorResponse(
      `Failed to update webhook: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}