/**
 * @file deleteEnvironmentHandler.ts
 * @description Handler for deleting a DatoCMS environment
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { environmentSchemas } from "../../schemas.js";

/**
 * Handler for deleting a DatoCMS environment
 */
export const deleteEnvironmentHandler = async (args: z.infer<typeof environmentSchemas.delete>) => {
  const { apiToken, environmentId, confirmation } = args;
  
  // Validate confirmation
  if (confirmation !== "confirm") {
    return createErrorResponse("Error: You must explicitly confirm deletion by setting confirmation to 'confirm'.");
  }
  
  try {
    // Initialize DatoCMS client
    const client = buildClient({ apiToken });
    
    try {
      // Delete the environment
      const environment = await client.environments.destroy(environmentId);
      
      if (!environment) {
        return createErrorResponse(`Error: Failed to delete environment with ID '${environmentId}'.`);
      }
      
      return createResponse(JSON.stringify(environment, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: Environment with ID '${environmentId}' was not found.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error deleting environment: ${error instanceof Error ? error.message : String(error)}`);
  }
};