import { buildClient } from "@datocms/cma-client-node";
import { z } from "zod";
import { roleSchemas } from "../../../schemas.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../../utils/errorHandlers.js";

type Params = z.infer<typeof roleSchemas.list_roles>;

/**
 * Handler for listing all roles in DatoCMS
 */
export const listRolesHandler = async (params: Params) => {
  const { apiToken, environment } = params;

  try {
    // Initialize DatoCMS client
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    try {
      // Fetch all roles
      const roles = await client.roles.list();

      // Convert to JSON and create response
      return createResponse(JSON.stringify({
        success: true,
        data: roles,
        message: "Roles retrieved successfully"
      }, null, 2));
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }

      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error listing DatoCMS roles: ${error instanceof Error ? error.message : String(error)}`);
  }
};