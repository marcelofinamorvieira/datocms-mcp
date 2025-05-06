/**
 * @file buildRecordEditorUrlFromTypeHandler.ts
 * @description Handler for building the DatoCMS editor URL for a specific record using project URL and item type ID
 */

import type { z } from "zod";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { recordsSchemas } from "../../schemas.js";

/**
 * Handler to build the editor URL for a specific DatoCMS record using project URL and item type
 * Extracted from the BuildDatoCMSRecordUrl tool
 */
export const buildRecordEditorUrlFromTypeHandler = async (args: z.infer<typeof recordsSchemas.editor_url_from_type>) => {
  const { projectUrl, itemTypeId, itemId, environment } = args;
  
  try {
    // Validate required parameters
    if (!projectUrl) {
      return createErrorResponse("Error: A valid project URL is required.");
    }
    
    if (!itemTypeId) {
      return createErrorResponse("Error: A valid item type ID is required.");
    }
    
    if (!itemId) {
      return createErrorResponse("Error: A valid record ID is required.");
    }
    
    // Sanitize the project URL by removing trailing slashes
    const sanitizedProjectUrl = projectUrl.replace(/\/$/, '');
    
    // Construct the editor URL
    let editorUrl = `https://${sanitizedProjectUrl}/editor/item_types/${itemTypeId}/items/${itemId}/edit`;
    
    // Add environment parameter if specified
    if (environment) {
      editorUrl += `?environment=${encodeURIComponent(environment)}`;
    }
    
    // Return the response using the same format as the original tool
    return createResponse(JSON.stringify({
      message: "Here is the URL for the DatoCMS record. You can use this to directly access the record in the DatoCMS editor.",
      url: editorUrl
    }, null, 2));
  } catch (error: unknown) {
    return {
      content: [{
        type: "text" as const,
        text: `Error building DatoCMS URL: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
};
