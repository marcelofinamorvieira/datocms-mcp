/**
 * @file destroyRecordHandler.ts
 * @description Handler for deleting a DatoCMS record
 * Extracted from the DestroyDatoCMSRecord tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for deleting a DatoCMS record
 */
export const destroyRecordHandler = async (args: z.infer<typeof recordsSchemas.destroy>) => {
  const { apiToken, itemId, confirmation, returnOnlyConfirmation = false, environment } = args;
  
  // Require explicit confirmation due to destructive nature
  if (!confirmation) {
    return createErrorResponse("Error: Explicit confirmation is required to delete the record. Set 'confirmation' parameter to true to proceed with deletion.");
  }

  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      const deletedItem = await client.items.destroy(itemId);
      
      // If no item returned, return error
      if (!deletedItem) {
        return createErrorResponse(`Error: Failed to delete record with ID '${itemId}'.`);
      }

      // Return only confirmation message if requested (to save on tokens)
      if (returnOnlyConfirmation) {
        return createResponse(`Successfully deleted record with ID '${itemId}'.`);
      }

      // Otherwise return the full record data
      return createResponse(JSON.stringify(deletedItem, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: Record with ID '${itemId}' was not found.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error deleting DatoCMS record: ${error instanceof Error ? error.message : String(error)}`);
  }
};
