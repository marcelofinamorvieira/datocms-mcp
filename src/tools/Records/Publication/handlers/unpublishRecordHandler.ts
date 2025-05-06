/**
 * @file unpublishRecordHandler.ts
 * @description Handler for unpublishing a DatoCMS record
 * Extracted from the UnpublishDatoCMSRecord tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for unpublishing a DatoCMS record
 */
export const unpublishRecordHandler = async (args: z.infer<typeof recordsSchemas.unpublish>) => {
  const { apiToken, itemId, recursive = false, environment } = args;

  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Unpublish entire record (all locales) - content_in_locales is not in the schema
      const unpublishedItem = await client.items.unpublish(itemId, undefined, { recursive });
      
      if (!unpublishedItem) {
        return createErrorResponse(`Error: Failed to unpublish record with ID '${itemId}'.`);
      }
      
      return createResponse(`Successfully unpublished record with ID '${itemId}'.`);
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: Record with ID '${itemId}' not found.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error unpublishing DatoCMS record: ${error instanceof Error ? error.message : String(error)}`);
  }
};
