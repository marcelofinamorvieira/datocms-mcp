/**
 * @file deleteItemTypeHandler.ts
 * @description Handler for deleting DatoCMS Item Types
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import type { schemaSchemas } from "../../../schemas.js";

/**
 * Handler to delete an Item Type from DatoCMS
 */
export const deleteItemTypeHandler = async (args: z.infer<typeof schemaSchemas.delete_item_type>) => {
  const { apiToken, itemTypeId, confirmation, environment } = args;
  
  // Check for explicit confirmation
  if (!confirmation) {
    return createErrorResponse("Error: You must provide explicit confirmation to delete this item type. Set 'confirmation: true' to confirm.");
  }
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Delete the item type
      await client.itemTypes.destroy(itemTypeId);
      
      // Return success response
      return createResponse(JSON.stringify({
        success: true,
        message: `Item Type ${itemTypeId} was successfully deleted.`
      }, null, 2));
      
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
    return createErrorResponse(`Error deleting DatoCMS Item Type: ${error instanceof Error ? error.message : String(error)}`);
  }
};