import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { buildTriggerSchemas } from "../../../schemas.js";
import { z } from "zod";

type CreateBuildTriggerParams = z.infer<typeof buildTriggerSchemas.create>;

/**
 * Creates a new build trigger in DatoCMS
 * 
 * @param params Parameters for creating a build trigger
 * @returns Response with the created build trigger details
 */
export async function createBuildTriggerHandler(
  params: CreateBuildTriggerParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Create the build trigger with the provided parameters
    const buildTrigger = await client.buildTriggers.create({
      name: params.name,
      adapter: params.adapter,
      adapter_settings: params.adapter_settings,
      indexing_enabled: params.indexing_enabled ?? false,
    } as any);

    // Parse the build trigger response and use 'as any' since typings might not match exactly
    const triggerData = buildTrigger as any;

    // Return the created build trigger details
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
        "The provided API token does not have permission to create build triggers."
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
      `Failed to create build trigger: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}