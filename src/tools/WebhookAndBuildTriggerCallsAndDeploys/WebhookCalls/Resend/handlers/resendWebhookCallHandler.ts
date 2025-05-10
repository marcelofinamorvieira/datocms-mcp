import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { webhookCallSchemas } from "../../../schemas.js";
import { z } from "zod";

type ResendWebhookCallParams = z.infer<typeof webhookCallSchemas.resend>;

/**
 * Resends a specific webhook call
 * 
 * @param params Parameters for resending a webhook call
 * @returns Response indicating success or failure of the resend operation
 */
export async function resendWebhookCallHandler(
  params: ResendWebhookCallParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Use the client's baseURL and apiToken to make a direct API call for resending a webhook
    // Since the specific method might not be available in the client SDK
    const baseClient = client as any;
    
    // Access the HTTP client used by the DatoCMS client
    await baseClient.client.request({
      method: 'POST',
      url: `/webhook-calls/${params.callId}/resend`,
      params: { webhook_id: params.webhookId }
    });

    // Return success response
    return createResponse({
      success: true,
      message: `Webhook call with ID ${params.callId} for webhook ${params.webhookId} has been successfully resent.`
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
        "The provided API token does not have permission to resend webhook calls."
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
        `No webhook call found with ID: ${params.callId} for webhook: ${params.webhookId}`
      );
    }

    // Handle other errors
    return createErrorResponse(
      `Failed to resend webhook call: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}