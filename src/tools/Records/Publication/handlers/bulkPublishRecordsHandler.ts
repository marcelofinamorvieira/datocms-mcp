/**
 * @file bulkPublishRecordsHandler.ts
 * @description Handler for publishing multiple DatoCMS records in bulk
 * Extracted from the BulkPublishDatoCMSRecords tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for publishing multiple DatoCMS records in bulk
 */
export const bulkPublishRecordsHandler = async (args: z.infer<typeof recordsSchemas.bulk_publish>) => {
  const { apiToken, itemIds, environment } = args;

  // Check if we have any IDs to publish
  if (itemIds.length === 0) {
    return createErrorResponse("Error: No record IDs provided for publication.");
  }
  
  // Check maximum number of records (DatoCMS API limit)
  if (itemIds.length > 200) {
    return createErrorResponse("Error: Maximum of 200 records allowed per bulk publish request.");
  }

  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Format input for bulkPublish with explicit type annotation
      const itemsToPublish = itemIds.map(id => ({ type: "item" as const, id }));
      
      // Call bulkPublish API
      await client.items.bulkPublish({
        items: itemsToPublish
      });
      
      // Return only confirmation message
      return createResponse(`Successfully published ${itemIds.length} record(s).`);
      
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
    return createErrorResponse(`Error bulk publishing DatoCMS records: ${error instanceof Error ? error.message : String(error)}`);
  }
};
