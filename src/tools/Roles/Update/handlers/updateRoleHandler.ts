import { buildClient } from "@datocms/cma-client-node";
import { z } from "zod";
import { updateRoleSchema } from "../../schemas.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";

type Params = z.infer<typeof updateRoleSchema>;

/**
 * Handler for updating a role in DatoCMS
 */
export const updateRoleHandler = async (params: Params) => {
  const {
    apiToken,
    roleId,
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
      // Prepare role update payload, filtering out undefined values
      const rolePayload = {
        ...(name !== undefined && { name }),
        ...(can_edit_schema !== undefined && { can_edit_schema }),
        ...(can_edit_others_content !== undefined && { can_edit_others_content }),
        ...(can_publish_content !== undefined && { can_publish_content }),
        ...(can_edit_favicon !== undefined && { can_edit_favicon }),
        ...(can_access_environments !== undefined && { can_access_environments }),
        ...(can_perform_site_search !== undefined && { can_perform_site_search }),
        ...(can_edit_site_entity !== undefined && { can_edit_site_entity }),
      };

      // Update the role
      const updatedRole = await client.roles.update(roleId, rolePayload);

      // Convert to JSON and create response
      return createResponse(JSON.stringify({
        success: true,
        data: updatedRole,
        message: "Role updated successfully"
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
    return createErrorResponse(`Error updating DatoCMS role: ${error instanceof Error ? error.message : String(error)}`);
  }
};