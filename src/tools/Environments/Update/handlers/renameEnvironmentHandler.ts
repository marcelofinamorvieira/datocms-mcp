/**
 * @file renameEnvironmentHandler.ts
 * @description Handler for renaming a DatoCMS environment
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { environmentSchemas } from "../../schemas.js";

/**
 * Handler for renaming a DatoCMS environment
 */
export const renameEnvironmentHandler = async (args: z.infer<typeof environmentSchemas.rename>) => {
  const { apiToken, environmentId, newId } = args;
  
  try {
    // Initialize DatoCMS client
    const client = buildClient({ apiToken });
    
    try {
      // Rename the environment
      const environment = await client.environments.rename(environmentId, {
        id: newId
      });
      
      if (!environment) {
        return createErrorResponse(`Error: Failed to rename environment with ID '${environmentId}'.`);
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
    return createErrorResponse(`Error renaming environment: ${error instanceof Error ? error.message : String(error)}`);
  }
};