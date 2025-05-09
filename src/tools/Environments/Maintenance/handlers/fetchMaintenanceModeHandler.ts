/**
 * @file fetchMaintenanceModeHandler.ts
 * @description Handler for fetching the current maintenance mode status
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { environmentSchemas } from "../../schemas.js";

/**
 * Handler for fetching the current maintenance mode status
 */
export const fetchMaintenanceModeHandler = async (args: z.infer<typeof environmentSchemas.maintenance_status>) => {
  const { apiToken } = args;
  
  try {
    // Initialize DatoCMS client
    const client = buildClient({ apiToken });
    
    try {
      // Fetch maintenance mode status
      const maintenanceMode = await client.maintenanceMode.find();
      
      if (!maintenanceMode) {
        return createErrorResponse("Error: Failed to fetch maintenance mode status.");
      }
      
      return createResponse(JSON.stringify(maintenanceMode, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error fetching maintenance mode status: ${error instanceof Error ? error.message : String(error)}`);
  }
};