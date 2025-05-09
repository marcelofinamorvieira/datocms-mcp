/**
 * @file promoteEnvironmentHandler.ts
 * @description Handler for promoting a DatoCMS environment to primary status
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { environmentSchemas } from "../../schemas.js";

/**
 * Handler for promoting a DatoCMS environment to primary status
 */
export const promoteEnvironmentHandler = async (args: z.infer<typeof environmentSchemas.promote>) => {
  const { apiToken, environmentId } = args;
  
  try {
    // Initialize DatoCMS client
    const client = buildClient({ apiToken });
    
    try {
      // Promote the environment to primary
      const environment = await client.environments.promote(environmentId);
      
      if (!environment) {
        return createErrorResponse(`Error: Failed to promote environment with ID '${environmentId}' to primary.`);
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
    return createErrorResponse(`Error promoting environment: ${error instanceof Error ? error.message : String(error)}`);
  }
};