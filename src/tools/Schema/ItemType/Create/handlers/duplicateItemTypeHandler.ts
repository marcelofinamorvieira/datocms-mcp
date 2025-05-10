/**
 * @file duplicateItemTypeHandler.ts
 * @description Handler for duplicating existing DatoCMS Item Types
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import type { schemaSchemas } from "../../../schemas.js";

/**
 * Handler to duplicate an existing Item Type in DatoCMS
 */
export const duplicateItemTypeHandler = async (args: z.infer<typeof schemaSchemas.duplicate_item_type>) => {
  const { apiToken, itemTypeId, name, apiKey, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // First find the item type to duplicate
      const itemType = await client.itemTypes.find(itemTypeId);

      // Then create a new item type with the same structure but different name and API key
      const duplicatedItemType = await client.itemTypes.create({
        name: name,
        api_key: apiKey,
        // Copy relevant properties from the original
        all_locales_required: itemType.all_locales_required,
        draft_mode_active: itemType.draft_mode_active,
        modular_block: itemType.modular_block,
        ordering_direction: itemType.ordering_direction,
        ordering_field: itemType.ordering_field,
        singleton: itemType.singleton,
        sortable: itemType.sortable,
        title_field: itemType.title_field,
        tree: itemType.tree
      });
      
      return createResponse(JSON.stringify(duplicatedItemType, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Check if it's a not found error
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: Item Type with ID '${itemTypeId}' was not found.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error: unknown) {
    return createErrorResponse(`Error duplicating item type: ${error instanceof Error ? error.message : String(error)}`);
  }
};