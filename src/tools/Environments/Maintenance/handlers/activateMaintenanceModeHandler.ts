/**
 * @file activateMaintenanceModeHandler.ts
 * @description Handler for activating maintenance mode
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { environmentSchemas } from "../../schemas.js";

/**
 * Handler for activating maintenance mode
 */
export const activateMaintenanceModeHandler = async (args: z.infer<typeof environmentSchemas.maintenance_activate>) => {
  const { apiToken, force = false } = args;
  
  try {
    // Initialize DatoCMS client
    const client = buildClient({ apiToken });
    
    try {
      // Activate maintenance mode
      const options = { force };
      const maintenanceMode = await client.maintenanceMode.activate(options);
      
      if (!maintenanceMode) {
        return createErrorResponse("Error: Failed to activate maintenance mode.");
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
    return createErrorResponse(`Error activating maintenance mode: ${error instanceof Error ? error.message : String(error)}`);
  }
};