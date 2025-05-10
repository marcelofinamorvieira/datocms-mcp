import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { z } from "zod";
import { schemaSchemas } from "../../../schemas.js";

export type GetFieldParams = z.infer<typeof schemaSchemas.get_field>;

/**
 * Retrieves a specific field by ID
 */
export const getFieldHandler = async (args: GetFieldParams) => {
  try {
    const { apiToken, fieldId, environment } = args;

    // Build the DatoCMS client
    const client = buildClient({
      apiToken,
      environment: environment || undefined,
    });

    // Get the field by ID
    const field = await client.fields.find(fieldId);

    return createResponse({
      success: true,
      data: field,
      message: `Field retrieved successfully.`
    });
  } catch (error: unknown) {
    if (isAuthorizationError(error)) {
      return createErrorResponse("Authorization failed. Please check your API token.");
    }

    if (isNotFoundError(error)) {
      return createErrorResponse(`Field with ID '${args.fieldId}' not found.`);
    }

    return createErrorResponse(`Error retrieving field: ${error instanceof Error ? error.message : String(error)}`);
  }
};