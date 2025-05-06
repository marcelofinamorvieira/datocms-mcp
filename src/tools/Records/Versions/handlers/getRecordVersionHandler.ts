/**
 * @file getRecordVersionHandler.ts
 * @description Handler for retrieving a specific version of a DatoCMS record
 * Extracted from the GetDatoCMSRecordVersion tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createErrorResponse } from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for retrieving a specific version of a DatoCMS record
 */
export const getRecordVersionHandler = async (args: z.infer<typeof recordsSchemas.version_get>) => {
  const { apiToken, versionId, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Fetch the specific version of the record
      const itemVersion = await client.itemVersions.find(versionId);
      
      // Return the version information as JSON using createResponse for consistent formatting
      return createResponse(JSON.stringify({
        message: `Successfully retrieved record version with ID: ${versionId}`,
        version: itemVersion
      }, null, 2));
      
    } catch (error: unknown) {
      // Handle specific error cases
      if (error instanceof Error && error.message.includes("404")) {
        return createErrorResponse(
          `Record version not found: The version with ID ${versionId} does not exist or has been deleted.`
        );
      }
      
      return createErrorResponse(
        `Error retrieving record version: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  } catch (error: unknown) {
    return createErrorResponse(
      `Error initializing DatoCMS client: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
