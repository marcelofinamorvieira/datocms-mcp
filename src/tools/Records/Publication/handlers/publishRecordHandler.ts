/**
 * @file publishRecordHandler.ts
 * @description Handler for publishing a DatoCMS record
 * Extracted from the PublishDatoCMSRecord tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for publishing a DatoCMS record
 */
export const publishRecordHandler = async (args: z.infer<typeof recordsSchemas.publish>) => {
  const { apiToken, itemId, content_in_locales, non_localized_content, recursive = false, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      let publishedItem: unknown;
      
      // Determine publishing mode based on provided parameters
      if (content_in_locales || non_localized_content !== undefined) {
        // Selective publishing with specified parameters
        // The DatoCMS API requires both properties to be present for selective publishing
        const publishOptions: {
          content_in_locales: string[];
          non_localized_content: boolean;
        } = {
          content_in_locales: content_in_locales || [],
          non_localized_content: non_localized_content ?? false
        };
        
        publishedItem = await client.items.publish(itemId, publishOptions, { recursive });
      } else {
        // Publish entire record (all locales & non-localized content)
        publishedItem = await client.items.publish(itemId, undefined, { recursive });
      }
      
      if (!publishedItem) {
        return createErrorResponse(`Error: Failed to publish record with ID '${itemId}'.`);
      }
      
      return createResponse(JSON.stringify(publishedItem, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: Record with ID '${itemId}' was not found.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return {
      content: [{
        type: "text" as const,
        text: `Error publishing DatoCMS record: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
};
