/**
 * @file updateFieldsetHandler.ts
 * @description Handler for updating an existing fieldset in DatoCMS
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import type { schemaSchemas } from "../../../schemas.js";

/**
 * Handler to update an existing fieldset in DatoCMS
 */
export const updateFieldsetHandler = async (args: z.infer<typeof schemaSchemas.update_fieldset>) => {
  const { 
    apiToken, 
    fieldsetId, 
    title, 
    hint, 
    position, 
    collapsible, 
    start_collapsed, 
    environment 
  } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Prepare fieldset data for update (only include fields that are provided)
      const fieldsetData: Record<string, unknown> = {};
      
      if (title !== undefined) fieldsetData.title = title;
      if (hint !== undefined) fieldsetData.hint = hint;
      if (position !== undefined) fieldsetData.position = position;
      if (collapsible !== undefined) fieldsetData.collapsible = collapsible;
      if (start_collapsed !== undefined) fieldsetData.start_collapsed = start_collapsed;
      
      // Update the fieldset
      const fieldset = await client.fieldsets.update(fieldsetId, fieldsetData);
      
      // Return success response with the updated fieldset
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
    return createErrorResponse(`Error updating DatoCMS fieldset: ${error instanceof Error ? error.message : String(error)}`);
  }
};