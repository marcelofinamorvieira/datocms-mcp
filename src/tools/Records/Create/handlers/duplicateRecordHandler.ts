/**
 * @file duplicateRecordHandler.ts
 * @description Handler for duplicating a DatoCMS record
 * Extracted from the DuplicateDatoCMSRecord tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for duplicating a DatoCMS record
 */
export const duplicateRecordHandler = async (args: z.infer<typeof recordsSchemas.duplicate>) => {
  const { apiToken, itemId, returnOnlyConfirmation = false, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Duplicate the item
      const duplicatedItem = await client.items.duplicate(itemId);
      
      // If no item returned, return error
      if (!duplicatedItem) {
        return createErrorResponse(`Error: Failed to duplicate record with ID '${itemId}'.`);
      }

      // Return only confirmation message if requested (to save on tokens)
      if (returnOnlyConfirmation) {
        return createResponse(`Successfully duplicated record with ID '${itemId}'. New record ID: '${duplicatedItem.id}'`);
      }

      // Otherwise return the full record data
      return createResponse(JSON.stringify(duplicatedItem, null, 2));
      
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
    return createErrorResponse(`Error duplicating DatoCMS record: ${error instanceof Error ? error.message : String(error)}`);
  }
};
