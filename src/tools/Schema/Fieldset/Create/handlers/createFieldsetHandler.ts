/**
 * @file createFieldsetHandler.ts
 * @description Handler for creating a new fieldset in DatoCMS
 */

import type { z } from "zod";
import { UnifiedClientManager } from "../../../../../utils/unifiedClientManager.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse , extractDetailedErrorInfo } from "../../../../../utils/errorHandlers.js";
import type { schemaSchemas } from "../../../schemas.js";

/**
 * Handler to create a new fieldset in DatoCMS
 */
export const createFieldsetHandler = async (args: z.infer<typeof schemaSchemas.create_fieldset>) => {
  const { 
    apiToken, 
    itemTypeId, 
    title, 
    hint = null, 
    position, 
    collapsible = false, 
    start_collapsed = false, 
    environment 
  } = args;
  
  try {
    // Initialize DatoCMS client
    const client = UnifiedClientManager.getDefaultClient(apiToken, environment);
    
    try {
      // Prepare fieldset data for creation
      const fieldsetData = {
        title,
        hint,
        position,
        collapsible,
        start_collapsed
      };
    
      // Create the fieldset - API requires itemTypeId as first param and data as second param
      const fieldset = await client.fieldsets.create(itemTypeId, fieldsetData);
      
      // Return success response with the created fieldset
      return createResponse(JSON.stringify(fieldset, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error creating DatoCMS fieldset: ${extractDetailedErrorInfo(error)}`);
  }
};