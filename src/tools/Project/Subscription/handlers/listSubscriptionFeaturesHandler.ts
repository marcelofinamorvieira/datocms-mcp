/**
 * @file listSubscriptionFeaturesHandler.ts
 * @description Handler for listing DatoCMS subscription features
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { projectSchemas } from "../../schemas.js";

/**
 * Handler for listing DatoCMS subscription features
 */
export const listSubscriptionFeaturesHandler = async (args: z.infer<typeof projectSchemas.list_subscription_features>) => {
  const { apiToken, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Retrieve subscription features
      const features = await client.subscriptionFeatures.list();
      
      // Return the subscription features
      return createResponse(JSON.stringify({
        message: "Successfully retrieved subscription features.",
        features
      }, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error listing subscription features: ${error instanceof Error ? error.message : String(error)}`);
  }
};
