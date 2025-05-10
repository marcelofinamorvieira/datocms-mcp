import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { z } from "zod";
import { schemaSchemas } from "../../../schemas.js";

export type DeleteFieldParams = z.infer<typeof schemaSchemas.delete_field>;

/**
 * Deletes a field from a DatoCMS item type
 */
export const deleteFieldHandler = async (args: DeleteFieldParams) => {
  try {
    const { apiToken, fieldId, confirmation, environment } = args;

    // Safety check for confirmation
    if (!confirmation) {
      return createErrorResponse(
        "Confirmation required. Please set 'confirmation: true' to confirm you want to delete this field. " +
        "This action cannot be undone and may impact existing content."
      );
    }

    // Build the DatoCMS client
    const client = buildClient({
      apiToken,
      environment: environment || undefined,
    });

    // First, get the field to return its info later
    const field = await client.fields.find(fieldId);

    // Delete the field
    await client.fields.destroy(fieldId);

    return createResponse({
      success: true,
      data: { id: fieldId, label: field.label },
      message: `Field '${field.label}' (ID: ${fieldId}) deleted successfully.`
    });
  } catch (error: unknown) {
    if (isAuthorizationError(error)) {
      return createErrorResponse("Authorization failed. Please check your API token.");
    }

    if (isNotFoundError(error)) {
      return createErrorResponse(`Field with ID '${args.fieldId}' not found.`);
    }

    return createErrorResponse(`Error deleting field: ${error instanceof Error ? error.message : String(error)}`);
  }
};