import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { buildTriggerSchemas } from "../../../schemas.js";
import { z } from "zod";

type RetrieveBuildTriggerParams = z.infer<typeof buildTriggerSchemas.retrieve>;

/**
 * Retrieves a specific build trigger by ID
 * 
 * @param params Parameters for retrieving a build trigger
 * @returns Response with the build trigger details
 */
export async function retrieveBuildTriggerHandler(
  params: RetrieveBuildTriggerParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Fetch the build trigger by ID
    const buildTrigger = await client.buildTriggers.find(params.buildTriggerId);

    // Cast to any to handle potential type mismatches
    const triggerData = buildTrigger as any;

    // Return the build trigger details
    return createResponse({
      id: triggerData.id,
      type: triggerData.type,
      name: triggerData.name,
      adapter: triggerData.adapter,
      adapter_settings: triggerData.adapter_settings,
      indexing_enabled: triggerData.indexing_enabled,
      frontend_url: triggerData.frontend_url,
      webhook_token: triggerData.webhook_token,
      created_at: triggerData.meta?.created_at || triggerData.created_at,
      updated_at: triggerData.meta?.updated_at || triggerData.updated_at,
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
        "The provided API token does not have permission to access build triggers."
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
        `No build trigger found with ID: ${params.buildTriggerId}`
      );
    }

    // Handle other errors
    return createErrorResponse(
      `Failed to retrieve build trigger: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}