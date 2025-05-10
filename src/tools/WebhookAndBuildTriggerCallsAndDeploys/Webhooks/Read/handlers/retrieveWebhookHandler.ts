import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { webhookSchemas } from "../../../schemas.js";
import { z } from "zod";

type RetrieveWebhookParams = z.infer<typeof webhookSchemas.retrieve>;

/**
 * Retrieves a single webhook by ID
 * 
 * @param params Parameters for retrieving a webhook
 * @returns Response with the webhook details
 */
export async function retrieveWebhookHandler(
  params: RetrieveWebhookParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Fetch the webhook by ID
    const webhook = await client.webhooks.find(params.webhookId);

    // Return the webhook details
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
        "The provided API token does not have permission to access webhooks."
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
      `Failed to retrieve webhook: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}