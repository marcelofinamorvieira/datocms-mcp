/**
 * @file getFieldsetHandler.ts
 * @description Handler for retrieving a specific fieldset by ID
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse , extractDetailedErrorInfo } from "../../../../../utils/errorHandlers.js";
import type { schemaSchemas } from "../../../schemas.js";

/**
 * Handler to retrieve a specific fieldset by ID
 */
export const getFieldsetHandler = async (args: z.infer<typeof schemaSchemas.get_fieldset>) => {
  const { apiToken, fieldsetId, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Retrieve the fieldset
      const fieldset = await client.fieldsets.find(fieldsetId);
      
      // Return the fieldset data
      return createResponse(JSON.stringify(fieldset, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Check if it's a not found error
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: Fieldset with ID '${fieldsetId}' was not found.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error retrieving DatoCMS fieldset: ${extractDetailedErrorInfo(error)}`);
  }
};