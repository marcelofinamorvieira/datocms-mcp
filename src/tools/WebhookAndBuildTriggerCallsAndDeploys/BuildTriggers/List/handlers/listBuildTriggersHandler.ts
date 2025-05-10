import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { buildTriggerSchemas } from "../../../schemas.js";
import { z } from "zod";

type ListBuildTriggersParams = z.infer<typeof buildTriggerSchemas.list>;

/**
 * Retrieves a list of all build triggers in the DatoCMS project
 * 
 * @param params Parameters for listing build triggers
 * @returns Response with the list of build triggers
 */
export async function listBuildTriggersHandler(
  params: ListBuildTriggersParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Fetch all build triggers
    const buildTriggers = await client.buildTriggers.list();

    // Format the response with only the necessary information
    const formattedBuildTriggers = buildTriggers.map(trigger => {
      // Cast to any to handle potential type mismatches
      const triggerData = trigger as any;

      return {
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
      };
    });

    // Return the list of build triggers
    return createResponse({
      build_triggers: formattedBuildTriggers,
      total: formattedBuildTriggers.length
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

    // Handle other errors
    return createErrorResponse(
      `Failed to list build triggers: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}