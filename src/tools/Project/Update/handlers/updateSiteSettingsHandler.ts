/**
 * @file updateSiteSettingsHandler.ts
 * @description Handler for updating DatoCMS site settings
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { projectSchemas } from "../../schemas.js";

/**
 * Handler for updating DatoCMS site settings
 */
export const updateSiteSettingsHandler = async (args: z.infer<typeof projectSchemas.update_site_settings>) => {
  const { apiToken, settings, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Update the site settings
      const updatedSite = await client.site.update(settings);
      
      // If update was successful, return the updated site
      if (updatedSite) {
        return createResponse(JSON.stringify({
          message: "Site settings updated successfully.",
          site: updatedSite
        }, null, 2));
      }
      
      return createErrorResponse("Error: Failed to update site settings.");
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error updating DatoCMS site settings: ${error instanceof Error ? error.message : String(error)}`);
  }
};
