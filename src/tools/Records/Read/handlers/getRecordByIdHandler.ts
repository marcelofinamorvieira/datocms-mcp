/**
 * @file getRecordByIdHandler.ts
 * @description Handler for retrieving a specific DatoCMS record by ID
 * Extracted from the GetDatoCMSRecordById tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { returnMostPopulatedLocale } from "../../../../utils/returnMostPopulatedLocale.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler to retrieve a specific DatoCMS record by its ID
 */
export const getRecordByIdHandler = async (args: z.infer<typeof recordsSchemas.get>) => {
  const { apiToken, itemId, version = "published", returnAllLocales = false, nested = true, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Prepare query parameters
      const queryParams: Record<string, unknown> = {
        version,
        nested
      };
    
      // Retrieve the item
      const item = await client.items.find(itemId, queryParams);
      
      // If no item found, return error
      if (!item) {
        return createErrorResponse(`Error: Record with ID '${itemId}' was not found.`);
      }

      // Process the item to filter locales (saves on tokens) unless returnAllLocales is true
      const processedItem = returnMostPopulatedLocale(item, returnAllLocales);

      // Convert to JSON and create response (will be chunked only if necessary)
      return createResponse(JSON.stringify(processedItem, null, 2));
      
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
  } catch (error: unknown) {
    return createErrorResponse(`Error retrieving DatoCMS record: ${error instanceof Error ? error.message : String(error)}`);
  }
};
