/**
 * @file destroyFieldsetHandler.ts
 * @description Handler for deleting a fieldset from DatoCMS
 */

import type { z } from "zod";
import { getClient } from "../../../../../utils/clientManager.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse , extractDetailedErrorInfo } from "../../../../../utils/errorHandlers.js";
import type { schemaSchemas } from "../../../schemas.js";

/**
 * Handler to delete a fieldset from DatoCMS
 */
export const destroyFieldsetHandler = async (args: z.infer<typeof schemaSchemas.delete_fieldset>) => {
  const { apiToken, fieldsetId, confirmation, environment } = args;
  
  // Check for explicit confirmation
  if (confirmation !== true) {
    return createErrorResponse("Error: You must provide explicit confirmation to delete this fieldset. Set 'confirmation: true' to confirm.");
  }
  
  try {
    // Initialize DatoCMS client
    const client = getClient(apiToken as string, environment as string);
    
    try {
      // Delete the fieldset
      await client.fieldsets.destroy(fieldsetId as string);
      
      // Return success response
      return createResponse(JSON.stringify({
        success: true,
        message: `Fieldset ${fieldsetId} was successfully deleted.`
      }, null, 2));
      
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
    return createErrorResponse(`Error deleting DatoCMS fieldset: ${extractDetailedErrorInfo(error)}`);
  }
};