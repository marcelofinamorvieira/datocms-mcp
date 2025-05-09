/**
 * @file retrieveEnvironmentHandler.ts
 * @description Handler for retrieving DatoCMS environment information
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { environmentSchemas } from "../../schemas.js";

/**
 * Handler for retrieving DatoCMS environment information
 */
export const retrieveEnvironmentHandler = async (args: z.infer<typeof environmentSchemas.retrieve>) => {
  const { apiToken, environmentId } = args;
  
  try {
    // Initialize DatoCMS client
    const client = buildClient({ apiToken });
    
    try {
      // Fetch environment information
      const environment = await client.environments.find(environmentId);
      
      if (!environment) {
        return createErrorResponse(`Error: Failed to fetch environment with ID '${environmentId}'.`);
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
    return createErrorResponse(`Error retrieving environment: ${error instanceof Error ? error.message : String(error)}`);
  }
};