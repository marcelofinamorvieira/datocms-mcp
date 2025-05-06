/**
 * @file bulkUnpublishRecordsHandler.ts
 * @description Handler for unpublishing multiple DatoCMS records in bulk
 * Extracted from the BulkUnpublishDatoCMSRecords tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for unpublishing multiple DatoCMS records in bulk
 */
export const bulkUnpublishRecordsHandler = async (args: z.infer<typeof recordsSchemas.bulk_unpublish>) => {
  const { apiToken, itemIds, environment } = args;

  // Check if we have any IDs to unpublish
  if (itemIds.length === 0) {
    return createErrorResponse("Error: No record IDs provided for unpublication.");
  }
  
  // Check maximum number of records (DatoCMS API limit)
  if (itemIds.length > 200) {
    return createErrorResponse("Error: Maximum of 200 records allowed per bulk unpublish request.");
  }

  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Format input for bulkUnpublish with explicit type annotation
      const itemsToUnpublish = itemIds.map(id => ({ type: "item" as const, id }));
      
      // Call bulkUnpublish API
      await client.items.bulkUnpublish({
        items: itemsToUnpublish
      });
      
      // Return only confirmation message
      return createResponse(`Successfully unpublished ${itemIds.length} record(s).`);
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      if (isNotFoundError(apiError)) {
        return createErrorResponse("Error: One or more records in the provided IDs were not found.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error bulk unpublishing DatoCMS records: ${error instanceof Error ? error.message : String(error)}`);
  }
};
