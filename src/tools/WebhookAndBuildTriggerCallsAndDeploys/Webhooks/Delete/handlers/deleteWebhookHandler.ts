import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { webhookSchemas } from "../../../schemas.js";
import { z } from "zod";

type DeleteWebhookParams = z.infer<typeof webhookSchemas.delete>;

/**
 * Deletes a webhook from DatoCMS
 * 
 * @param params Parameters for deleting a webhook
 * @returns Response indicating success or failure
 */
export async function deleteWebhookHandler(
  params: DeleteWebhookParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Delete the webhook
    await client.webhooks.destroy(params.webhookId);

    // Return success response
    return createResponse({
      success: true,
      message: `Webhook with ID ${params.webhookId} has been successfully deleted.`
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
        "The provided API token does not have permission to delete webhooks."
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
      `Failed to delete webhook: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}