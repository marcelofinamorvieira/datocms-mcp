import { buildClient } from "@datocms/cma-client-node";
import { z } from "zod";
import { createRoleSchema } from "../../schemas.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";

type Params = z.infer<typeof createRoleSchema>;

/**
 * Handler for creating a new role in DatoCMS
 */
export const createRoleHandler = async (params: Params) => {
  const {
    apiToken,
    name,
    can_edit_schema,
    can_edit_others_content,
    can_publish_content,
    can_edit_favicon,
    can_access_environments,
    can_perform_site_search,
    can_edit_site_entity,
    environment
  } = params;

  try {
    // Initialize DatoCMS client
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    try {
      // Prepare role payload from params, filtering out undefined values
      const rolePayload = {
        name,
        ...(can_edit_schema !== undefined && { can_edit_schema }),
        ...(can_edit_others_content !== undefined && { can_edit_others_content }),
        ...(can_publish_content !== undefined && { can_publish_content }),
        ...(can_edit_favicon !== undefined && { can_edit_favicon }),
        ...(can_access_environments !== undefined && { can_access_environments }),
        ...(can_perform_site_search !== undefined && { can_perform_site_search }),
        ...(can_edit_site_entity !== undefined && { can_edit_site_entity }),
      };

      // Create the role using DatoCMS client
      const role = await client.roles.create(rolePayload);

      // Convert to JSON and create response
      return createResponse(JSON.stringify({
        success: true,
        data: role,
        message: "Role created successfully"
      }, null, 2));
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }

      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error creating DatoCMS role: ${error instanceof Error ? error.message : String(error)}`);
  }
};