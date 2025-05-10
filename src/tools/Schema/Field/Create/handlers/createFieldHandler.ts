import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { z } from "zod";
import { schemaSchemas } from "../../../schemas.js";

export type CreateFieldParams = z.infer<typeof schemaSchemas.create_field>;

/**
 * Creates a new field in a DatoCMS item type
 */
export const createFieldHandler = async (args: CreateFieldParams) => {
  try {
    const { apiToken, itemTypeId, environment, field_type, ...restFieldData } = args;

    // Build the DatoCMS client
    const client = buildClient({
      apiToken,
      environment: environment || undefined,
    });

    // Use type casting to ensure compatibility with the DatoCMS API
    // This is necessary because our schema and the API's expected schema
    // have slight differences in structure
    const fieldData: any = {
      ...restFieldData,
      field_type: field_type,
    };

    // Create the field
    const field = await client.fields.create(itemTypeId, fieldData);

    return createResponse({
      success: true,
      data: field,
      message: `Field '${field.label}' created successfully with ID: ${field.id}`
    });
  } catch (error: unknown) {
    if (isAuthorizationError(error)) {
      return createErrorResponse("Authorization failed. Please check your API token.");
    }

    if (isNotFoundError(error)) {
      return createErrorResponse(`Item type with ID '${args.itemTypeId}' not found.`);
    }

    return createErrorResponse(`Error creating field: ${error instanceof Error ? error.message : String(error)}`);
  }
};