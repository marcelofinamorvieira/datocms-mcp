/**
 * @file schedulePublicationHandler.ts
 * @description Handler for scheduling a DatoCMS record publication
 * Extracted from the CreateScheduledPublicationOnRecord tool
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler function for scheduling a DatoCMS record publication
 */
export const schedulePublicationHandler = async (args: z.infer<typeof recordsSchemas.schedule_publication>) => {
  const { apiToken, itemId, publication_scheduled_at: publicationDate, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    // Create the scheduled publication
    try {
      const scheduledPublication = await client.scheduledPublication.create(
        itemId,
        {
          publication_scheduled_at: publicationDate
        }
      );
      
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            message: "Successfully scheduled the item for publication.",
            scheduledPublication
          }, null, 2)
        }]
      };
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return {
      content: [{
        type: "text" as const,
        text: `Error creating scheduled publication: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
};
