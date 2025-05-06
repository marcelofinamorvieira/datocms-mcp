/**
 * @file getProjectInfoHandler.ts
 * @description Handler for retrieving DatoCMS project information
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { projectSchemas } from "../../schemas.js";

/**
 * Handler for retrieving DatoCMS project information
 */
export const getProjectInfoHandler = async (args: z.infer<typeof projectSchemas.get_info>) => {
  const { apiToken, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Retrieve the project information
      const project = await client.site.find();
      
      // If no project found, return error
      if (!project) {
        return createErrorResponse("Error: Could not retrieve project information.");
      }

      // Convert to JSON and create response (will be chunked only if necessary)
      return createResponse(JSON.stringify(project, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error retrieving DatoCMS site information: ${error instanceof Error ? error.message : String(error)}`);
  }
};
