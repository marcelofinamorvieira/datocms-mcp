/**
 * @file deactivateMaintenanceModeHandler.ts
 * @description Handler for deactivating maintenance mode
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { environmentSchemas } from "../../schemas.js";

/**
 * Handler for deactivating maintenance mode
 */
export const deactivateMaintenanceModeHandler = async (args: z.infer<typeof environmentSchemas.maintenance_deactivate>) => {
  const { apiToken } = args;
  
  try {
    // Initialize DatoCMS client
    const client = buildClient({ apiToken });
    
    try {
      // Deactivate maintenance mode
      const maintenanceMode = await client.maintenanceMode.deactivate();
      
      if (!maintenanceMode) {
        return createErrorResponse("Error: Failed to deactivate maintenance mode.");
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
    return createErrorResponse(`Error deactivating maintenance mode: ${error instanceof Error ? error.message : String(error)}`);
  }
};