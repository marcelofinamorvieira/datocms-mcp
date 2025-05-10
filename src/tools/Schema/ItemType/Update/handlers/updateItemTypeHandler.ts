/**
 * @file updateItemTypeHandler.ts
 * @description Handler for updating existing DatoCMS Item Types
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import type { schemaSchemas } from "../../../schemas.js";

/**
 * Handler to update an existing Item Type in DatoCMS
 */
export const updateItemTypeHandler = async (args: z.infer<typeof schemaSchemas.update_item_type>) => {
  const { 
    apiToken, 
    itemTypeId, 
    name, 
    apiKey, 
    allLocalesRequired, 
    draftModeActive, 
    modularBlock, 
    orderingDirection, 
    orderingField, 
    singleton, 
    sortable, 
    titleField, 
    tree, 
    environment 
  } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Prepare update data (only include fields that are provided)
      const updateData: Record<string, unknown> = {};
      
      if (name !== undefined) updateData.name = name;
      if (apiKey !== undefined) updateData.api_key = apiKey;
      if (allLocalesRequired !== undefined) updateData.all_locales_required = allLocalesRequired;
      if (draftModeActive !== undefined) updateData.draft_mode_active = draftModeActive;
      if (modularBlock !== undefined) updateData.modular_block = modularBlock;
      if (orderingDirection !== undefined) updateData.ordering_direction = orderingDirection;
      if (orderingField !== undefined) updateData.ordering_field = orderingField;
      if (singleton !== undefined) updateData.singleton = singleton;
      if (sortable !== undefined) updateData.sortable = sortable;
      if (titleField !== undefined) updateData.title_field = titleField;
      if (tree !== undefined) updateData.tree = tree;
      
      // Update the item type
      const updatedItemType = await client.itemTypes.update(itemTypeId, updateData);
      
      // Return the updated item type
      return createResponse(JSON.stringify(updatedItemType, null, 2));
      
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
    return createErrorResponse(`Error updating DatoCMS Item Type: ${error instanceof Error ? error.message : String(error)}`);
  }
};