/**
 * @file listEnvironmentsHandler.ts
 * @description Handler for listing all DatoCMS environments
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { environmentSchemas } from "../../schemas.js";

/**
 * Handler for listing all DatoCMS environments
 */
export const listEnvironmentsHandler = async (args: z.infer<typeof environmentSchemas.list>) => {
  const { apiToken } = args;
  
  try {
    // Initialize DatoCMS client
    const client = buildClient({ apiToken });
    
    try {
      // List all environments
      const environments = await client.environments.list();
      
      if (!environments || environments.length === 0) {
        return createResponse(JSON.stringify([], null, 2));
      }
      
      return createResponse(JSON.stringify(environments, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error listing environments: ${error instanceof Error ? error.message : String(error)}`);
  }
};