/**
 * @file restoreRecordVersionHandler.ts
 * @description Handler for restoring a specific version of a DatoCMS record
 * Extracted from the RestoreDatoCMSRecordVersion tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for restoring a specific version of a DatoCMS record
 */
export const restoreRecordVersionHandler = async (args: z.infer<typeof recordsSchemas.version_restore>) => {
  const { apiToken, itemId, versionId, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Restore the specified version
      const restoredVersion = await client.itemVersions.restore(versionId);
      
      return createResponse(JSON.stringify({
        message: `Successfully restored version ${versionId} for record ${itemId}.`,
        version: restoredVersion
      }, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Check if it's a not found error
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: Record version with ID '${versionId}' was not found.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(
      `Error restoring record version: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
