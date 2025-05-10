/**
 * @file listFieldsetsHandler.ts
 * @description Handler for listing fieldsets, with optional filtering by item type
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { fieldsetSchemas } from "../../schemas.js";

/**
 * Handler to list fieldsets, with optional filtering by item type
 */
export const listFieldsetsHandler = async (args: z.infer<typeof fieldsetSchemas.list>) => {
  const { apiToken, itemTypeId, page, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Prepare filter parameters for pagination only
      // Note: The API requires itemTypeId directly, not as part of queryParams
      const queryParams: Record<string, unknown> = {};

      // Add pagination if provided
      if (page) {
        queryParams.page = page;
      }

      // If no itemTypeId is provided, throw an error as it's required
      if (!itemTypeId) {
        return createErrorResponse("Error: itemTypeId is required for listing fieldsets.");
      }

      // List fieldsets for the specified item type
      // The library expects itemTypeId as first parameter
      const fieldsets = await client.fieldsets.list(itemTypeId);
      
      // Return the fieldsets data
      return createResponse(JSON.stringify(fieldsets, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error listing DatoCMS fieldsets: ${error instanceof Error ? error.message : String(error)}`);
  }
};