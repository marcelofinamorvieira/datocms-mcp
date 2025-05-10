import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { z } from "zod";
import { schemaSchemas } from "../../../schemas.js";

export type ListFieldsParams = z.infer<typeof schemaSchemas.list_fields>;

/**
 * Lists fields for a specific item type with optional pagination
 */
export const listFieldsHandler = async (args: ListFieldsParams) => {
  try {
    const { apiToken, itemTypeId, page, environment } = args;

    // Build the DatoCMS client
    const client = buildClient({
      apiToken,
      environment: environment || undefined,
    });

    // First, check if the item type exists
    try {
      await client.itemTypes.find(itemTypeId);
    } catch (error) {
      if (isNotFoundError(error)) {
        return createErrorResponse(`Item type with ID '${itemTypeId}' not found.`);
      }
      throw error;
    }

    // Use the DatoCMS client's proper method for listing fields for an item type
    const fields = await client.fields.list(itemTypeId);

    // Apply pagination to our results if required
    let paginatedFields = fields;
    if (page) {
      const start = page.offset || 0;
      const end = start + (page.limit || 10);
      paginatedFields = fields.slice(start, end);
    }

    return createResponse({
      success: true,
      data: paginatedFields,
      pagination: page ? {
        offset: page.offset || 0,
        limit: page.limit || 10,
        total: fields.length
      } : undefined,
      message: `Retrieved ${paginatedFields.length} field(s) for item type ID: ${itemTypeId}`
    });
  } catch (error: unknown) {
    if (isAuthorizationError(error)) {
      return createErrorResponse("Authorization failed. Please check your API token.");
    }

    return createErrorResponse(`Error listing fields: ${error instanceof Error ? error.message : String(error)}`);
  }
};