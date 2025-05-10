import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { webhookSchemas } from "../../../schemas.js";
import { z } from "zod";

type ListWebhooksParams = z.infer<typeof webhookSchemas.list>;

/**
 * Retrieves a list of all webhooks in the DatoCMS project
 * 
 * @param params Parameters for listing webhooks
 * @returns Response with the list of webhooks
 */
export async function listWebhooksHandler(
  params: ListWebhooksParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Fetch all webhooks
    const webhooks = await client.webhooks.list();

    // Format the response with only the necessary information
    const formattedWebhooks = webhooks.map((webhook: any) => ({
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      headers: webhook.headers,
      payload_format: webhook.payload_type,
      triggers: webhook.triggers,
      https_only: webhook.https_only,
      created_at: webhook.created_at,
      updated_at: webhook.updated_at,
    }));

    // Return the list of webhooks
    return createResponse({
      webhooks: formattedWebhooks,
      total: formattedWebhooks.length
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

    // Handle other errors
    return createErrorResponse(
      `Failed to list webhooks: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}