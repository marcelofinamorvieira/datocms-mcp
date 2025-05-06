/**
 * @file cancelScheduledPublicationHandler.ts
 * @description Handler for canceling a scheduled publication for a DatoCMS record
 * Extracted from the DestroyScheduledPublicationOnRecord tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for canceling a scheduled publication for a DatoCMS record
 */
export const cancelScheduledPublicationHandler = async (args: z.infer<typeof recordsSchemas.cancel_scheduled_publication>) => {
  const { apiToken, itemId, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Cancel the scheduled publication
      await client.scheduledPublication.destroy(itemId);
      
      // Return success response
      return createResponse(`Successfully cancelled scheduled publication for item with ID '${itemId}'.`);
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Check if it's a not found error
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: Item with ID '${itemId}' was not found or has no scheduled publication.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return {
      content: [{
        type: "text" as const,
        text: `Error cancelling scheduled publication: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
};
