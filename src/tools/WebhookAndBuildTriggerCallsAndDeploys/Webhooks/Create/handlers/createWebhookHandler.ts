import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { webhookSchemas } from "../../../schemas.js";
import { z } from "zod";

type CreateWebhookParams = z.infer<typeof webhookSchemas.create>;

/**
 * Creates a new webhook in DatoCMS
 * 
 * @param params Parameters for creating a webhook
 * @returns Response with the created webhook details
 */
export async function createWebhookHandler(
  params: CreateWebhookParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Create the webhook with the provided parameters
    const webhook = await client.webhooks.create({
      name: params.name,
      url: params.url,
      headers: params.headers || {},
      events: params.events,
      payload_type: params.payload_format,
      https_only: params.httpsOnly,
      triggers: params.triggers,
    } as any);

    // Cast webhook to any to access properties
    const webhookAny = webhook as any;

    // Return the created webhook details
    return createResponse({
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      headers: webhook.headers,
      events: webhook.events,
      payload_format: webhookAny.payload_type,
      triggers: webhookAny.triggers,
      https_only: webhookAny.https_only,
      created_at: webhookAny.created_at,
      updated_at: webhookAny.updated_at,
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
        "The provided API token does not have permission to create webhooks."
      );
    }

    // Handle other errors
    return createErrorResponse(
      `Failed to create webhook: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}