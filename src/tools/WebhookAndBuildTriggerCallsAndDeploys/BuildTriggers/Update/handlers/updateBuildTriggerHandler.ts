import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { buildTriggerSchemas } from "../../../schemas.js";
import { z } from "zod";

type UpdateBuildTriggerParams = z.infer<typeof buildTriggerSchemas.update>;

/**
 * Updates an existing build trigger in DatoCMS
 * 
 * @param params Parameters for updating a build trigger
 * @returns Response with the updated build trigger details
 */
export async function updateBuildTriggerHandler(
  params: UpdateBuildTriggerParams
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
    if (params.adapter !== undefined) updatePayload.adapter = params.adapter;
    if (params.adapter_settings !== undefined) updatePayload.adapter_settings = params.adapter_settings;
    if (params.indexing_enabled !== undefined) updatePayload.indexing_enabled = params.indexing_enabled;

    // Update the build trigger
    const buildTrigger = await client.buildTriggers.update(params.buildTriggerId, updatePayload);

    // Return the updated build trigger details with type assertion to handle possible type mismatch
    const triggerData = buildTrigger as any;
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
        "The provided API token does not have permission to update build triggers."
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

    // Handle validation errors
    if (
      typeof error === 'object' && 
      error !== null && 
      ('status' in error && error.status === 422 ||
       'message' in error && typeof error.message === 'string' && 
       (error.message.includes('422') || error.message.toLowerCase().includes('validation')))
    ) {
      return createErrorResponse(
        `Invalid build trigger data: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Handle other errors
    return createErrorResponse(
      `Failed to update build trigger: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}