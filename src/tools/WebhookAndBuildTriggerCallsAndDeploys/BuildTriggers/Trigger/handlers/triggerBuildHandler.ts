import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { buildTriggerSchemas } from "../../../schemas.js";
import { z } from "zod";

type TriggerBuildParams = z.infer<typeof buildTriggerSchemas.trigger>;

/**
 * Triggers a build for a specific build trigger
 * 
 * @param params Parameters for triggering a build
 * @returns Response indicating success or failure
 */
export async function triggerBuildHandler(
  params: TriggerBuildParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Trigger the build
    const result = await client.buildTriggers.trigger(params.buildTriggerId);

    // Return success response with type assertion since the API might return incomplete data
    const resultData = result as any;
    return createResponse({
      success: true,
      message: `Build triggered successfully for build trigger ID: ${params.buildTriggerId}`,
      build_id: resultData?.id || "unknown",
      status: resultData?.status || "triggered",
      started_at: resultData?.started_at || new Date().toISOString(),
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
        "The provided API token does not have permission to trigger builds."
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
      `Failed to trigger build: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}