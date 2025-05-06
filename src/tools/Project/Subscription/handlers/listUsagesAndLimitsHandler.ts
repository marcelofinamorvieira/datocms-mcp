/**
 * @file listUsagesAndLimitsHandler.ts
 * @description Handler for listing DatoCMS usages and subscription limits
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { projectSchemas } from "../../schemas.js";

/**
 * Handler for listing DatoCMS usages and subscription limits
 */
export const listUsagesAndLimitsHandler = async (args: z.infer<typeof projectSchemas.list_usages_and_limits>) => {
  const { apiToken, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Retrieve subscription limits
      // @ts-expect-error - The DatoCMS types may not be fully up-to-date
      const usagesAndLimits = await client.usagesAndLimits.list();
      
      // Return the usages and limits
      return createResponse(JSON.stringify({
        message: "Successfully retrieved usages and subscription limits.",
        usagesAndLimits
      }, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error listing usages and subscription limits: ${error instanceof Error ? error.message : String(error)}`);
  }
};
