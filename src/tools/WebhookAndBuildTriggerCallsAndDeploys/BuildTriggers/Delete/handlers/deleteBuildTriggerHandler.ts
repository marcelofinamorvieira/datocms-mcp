import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { buildTriggerSchemas } from "../../../schemas.js";
import { z } from "zod";

type DeleteBuildTriggerParams = z.infer<typeof buildTriggerSchemas.delete>;

/**
 * Deletes a build trigger from DatoCMS
 * 
 * @param params Parameters for deleting a build trigger
 * @returns Response indicating success or failure
 */
export async function deleteBuildTriggerHandler(
  params: DeleteBuildTriggerParams
) {
  try {
    // Initialize the client with the API token and environment
    const clientParams = params.environment 
      ? { apiToken: params.apiToken, environment: params.environment } 
      : { apiToken: params.apiToken };
    const client = buildClient(clientParams);

    // Delete the build trigger
    await client.buildTriggers.destroy(params.buildTriggerId);

    // Return success response
    return createResponse({
      success: true,
      message: `Build trigger with ID ${params.buildTriggerId} has been successfully deleted.`
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
        "The provided API token does not have permission to delete build triggers."
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
      `Failed to delete build trigger: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}