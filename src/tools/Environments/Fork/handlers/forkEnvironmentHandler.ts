/**
 * @file forkEnvironmentHandler.ts
 * @description Handler for forking a DatoCMS environment
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { environmentSchemas } from "../../schemas.js";

/**
 * Handler for forking a DatoCMS environment
 */
export const forkEnvironmentHandler = async (args: z.infer<typeof environmentSchemas.fork>) => {
  const { apiToken, environmentId, newId, fast = false, force = false } = args;
  
  try {
    // Initialize DatoCMS client
    const client = buildClient({ apiToken });
    
    try {
      // Fork the environment with immediate_return set to false
      // to wait for the completion of the fork operation
      const forkOptions = {
        id: newId,
        immediate_return: false,
        fast,
        force
      };
      
      const environment = await client.environments.fork(environmentId, forkOptions);
      
      if (!environment) {
        return createErrorResponse(`Error: Failed to fork environment with ID '${environmentId}'.`);
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
    return createErrorResponse(`Error forking environment: ${error instanceof Error ? error.message : String(error)}`);
  }
};