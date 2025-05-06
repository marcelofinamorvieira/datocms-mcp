/**
 * @file getRecordReferencesHandler.ts
 * @description Handler for retrieving references to a specific DatoCMS record
 * Extracted from the GetDatoCMSRecordReferences tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { returnMostPopulatedLocale } from "../../../../utils/returnMostPopulatedLocale.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for retrieving references to a specific DatoCMS record
 */
export const getRecordReferencesHandler = async (args: z.infer<typeof recordsSchemas.references>) => {
  const {
    apiToken,
    itemId,
    version = "current",
    returnAllLocales = false,
    nested = true,
    returnOnlyIds = false,
    environment
  } = args;

  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Retrieve records that reference the specified item with nested parameter
      const referencingItems = await client.items.references(itemId, { nested, version });

      // Return empty result message if no items found
      if (referencingItems.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: "No items found linking to the specified record."
          }]
        };
      }
      
      // If returnOnlyIds is true, return just the IDs using map for cleaner code
      if (returnOnlyIds) {
        const itemIds = referencingItems.map(item => item.id);
        return createResponse(JSON.stringify(itemIds, null, 2));
      }
      
      // Process the items to filter locales (saves on tokens) unless returnAllLocales is true
      const processedItems = returnMostPopulatedLocale(referencingItems, returnAllLocales);
      
      // Convert to JSON and create response (will be chunked only if necessary)
      return createResponse(JSON.stringify(processedItems, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Check if it's a not found error
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: Record with ID '${itemId}' was not found.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return {
      content: [{
        type: "text" as const,
        text: `Error retrieving DatoCMS record references: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
};
