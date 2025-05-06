/**
 * @file listRecordVersionsHandler.ts
 * @description Handler for listing versions of a DatoCMS record
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { createErrorResponse, isAuthorizationError, isNotFoundError } from "../../../../utils/errorHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler to list versions of a DatoCMS record
 */
export const listRecordVersionsHandler = async (args: z.infer<typeof recordsSchemas.versions_list>) => {
  const { apiToken, itemId, page, environment, returnOnlyIds = true } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Prepare pagination parameters
      const paginationParams = page ? {
        page: {
          limit: page.limit,
          offset: page.offset
        }
      } : {};
      
      // List versions of the item with pagination
      const versions = await client.itemVersions.list(itemId, paginationParams);
      
      // If no versions returned or empty array, provide appropriate message
      if (!versions || versions.length === 0) {
        return createResponse(JSON.stringify({
          message: `No versions found for record with ID '${itemId}'.`,
          pagination: {
            limit: paginationParams.page?.limit || null,
            offset: paginationParams.page?.offset || 0,
            total: 0
          },
          versions: []
        }, null, 2));
      }

      // Process versions based on returnOnlyIds parameter
      const processedVersions = returnOnlyIds 
        ? versions.map(version => ({
            id: version.id,
            created_at: version.created_at,
            timestamp: version.created_at // Alias for easier understanding
          }))
        : versions;

      // Return the versions data with pagination info
      // The versions response may not include metadata about the total count, so we just use what we have
      return createResponse(JSON.stringify({
        message: `Successfully retrieved ${versions.length} versions for record with ID '${itemId}'`,
        pagination: {
          limit: paginationParams.page?.limit || versions.length,
          offset: paginationParams.page?.offset || 0,
          total: versions.length, // We can only use the returned number since meta may not be available
          has_more: versions.length === paginationParams.page?.limit // Indicate if there might be more versions to fetch
        },
        returnOnlyIds, // Include this flag in the response for clarity
        versions: processedVersions
      }, null, 2));
      
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
    return createErrorResponse(`Error listing versions: ${error instanceof Error ? error.message : String(error)}`);
  }
};
