/**
 * @file bulkDestroyRecordsHandler.ts
 * @description Handler for deleting multiple DatoCMS records in bulk
 * Extracted from the BulkDestroyDatoCMSRecords tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for deleting multiple DatoCMS records in bulk
 */
export const bulkDestroyRecordsHandler = async (args: z.infer<typeof recordsSchemas.bulk_destroy>) => {
  const { apiToken, itemIds, confirmation, environment } = args;
  
  // Require explicit confirmation due to destructive nature
  if (!confirmation) {
    return createErrorResponse("Error: Explicit confirmation is required to delete records. Set 'confirmation' parameter to true to proceed with deletion.");
  }

  // Check if we have any IDs to delete
  if (itemIds.length === 0) {
    return createErrorResponse("Error: No record IDs provided for deletion.");
  }
  
  // Check maximum number of records (similar to bulk publish)
  if (itemIds.length > 200) {
    return createErrorResponse("Error: Maximum of 200 records allowed per bulk delete request.");
  }

  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Format input for bulkDestroy with explicit type annotation
      // Format each ID into the required structure for the API
      const itemsToDelete = itemIds.map(id => ({ type: "item" as const, id }));
      
      // Execute bulk deletion
      await client.items.bulkDestroy({
        items: itemsToDelete,
      });
      
      // Return success response with count
      return createResponse(`Successfully deleted ${itemIds.length} record(s) with IDs: ${itemIds.join(", ")}`);
      
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
    return createErrorResponse(`Error bulk deleting DatoCMS records: ${error instanceof Error ? error.message : String(error)}`);
  }
};
