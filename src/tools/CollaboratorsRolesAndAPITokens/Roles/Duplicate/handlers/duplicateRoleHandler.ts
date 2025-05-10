import { buildClient } from "@datocms/cma-client-node";
import { z } from "zod";
import { roleSchemas } from "../../../schemas.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";

type Params = z.infer<typeof roleSchemas.duplicate_role>;

/**
 * Handler for duplicating a role in DatoCMS
 */
export const duplicateRoleHandler = async (params: Params) => {
  const {
    apiToken,
    roleId,
    environment
  } = params;

  try {
    // Initialize DatoCMS client
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    try {
      // Duplicate the role using DatoCMS client
      const duplicatedRole = await client.roles.duplicate(roleId);

      // Convert to JSON and create response
      return createResponse(JSON.stringify({
        success: true,
        data: duplicatedRole,
        message: "Role duplicated successfully"
      }, null, 2));
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }

      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Role with ID "${roleId}" not found.`);
      }

      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error duplicating DatoCMS role: ${error instanceof Error ? error.message : String(error)}`);
  }
};