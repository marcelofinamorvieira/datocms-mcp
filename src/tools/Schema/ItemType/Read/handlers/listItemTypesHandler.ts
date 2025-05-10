/**
 * @file listItemTypesHandler.ts
 * @description Handler for listing all item types in a DatoCMS project
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import type { schemaSchemas } from "../../../schemas.js";

/**
 * Handler to list all Item Types in a DatoCMS project
 */
export const listItemTypesHandler = async (args: z.infer<typeof schemaSchemas.list_item_types>) => {
  const { apiToken, environment, page } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // The client.itemTypes.list() method doesn't take any parameters in this version of the client
      // We'll request all item types and then handle pagination in memory if needed
      const allItemTypes = await client.itemTypes.list();

      // Apply pagination in memory if provided
      let itemTypes = allItemTypes;
      if (page) {
        const start = page.offset || 0;
        const end = start + (page.limit || 10);
        itemTypes = allItemTypes.slice(start, end);
      }
      
      // Return the item types
      return createResponse(JSON.stringify(itemTypes, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error listing DatoCMS Item Types: ${error instanceof Error ? error.message : String(error)}`);
  }
};