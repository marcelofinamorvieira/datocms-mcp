/**
 * @file getItemTypeHandler.ts
 * @description Handler for retrieving a specific DatoCMS Item Type by ID
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import type { schemaSchemas } from "../../../schemas.js";

/**
 * Handler to retrieve a specific Item Type by ID
 */
export const getItemTypeHandler = async (args: z.infer<typeof schemaSchemas.get_item_type>) => {
  const { apiToken, itemTypeId, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Retrieve the item type
      const itemType = await client.itemTypes.find(itemTypeId);
      
      // Return the item type data
      return createResponse(JSON.stringify(itemType, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Check if it's a not found error
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: Item Type with ID '${itemTypeId}' was not found.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error retrieving DatoCMS Item Type: ${error instanceof Error ? error.message : String(error)}`);
  }
};