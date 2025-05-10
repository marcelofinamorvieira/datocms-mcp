import { buildClient } from "@datocms/cma-client-node";
import { z } from "zod";
import { apiTokenSchemas } from "../../../schemas.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";

type Params = z.infer<typeof apiTokenSchemas.update_token>;

/**
 * Handler for updating an API token in DatoCMS
 */
export const updateTokenHandler = async (params: Params) => {
  const {
    apiToken,
    tokenId,
    name,
    role,
    can_access_cda,
    can_access_cda_preview,
    can_access_cma,
    environment
  } = params;

  try {
    // Initialize DatoCMS client
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    try {
      // First, get the current token to ensure we have all required fields
      const currentToken = await client.accessTokens.find(tokenId);

      // Prepare the update payload with all required fields
      const updatePayload: any = {
        name: name,
        can_access_cda: can_access_cda,
        can_access_cda_preview: can_access_cda_preview,
        can_access_cma: can_access_cma
      };

      // Handle role assignment
      if (role === null) {
        updatePayload.role = null;
      } else if (typeof role === 'string') {
        // Handle predefined role names or role IDs
        if (['admin', 'editor', 'developer', 'seo', 'contributor'].includes(role)) {
          const roles = await client.roles.list();
          const matchingRole = roles.find(r => r.name.toLowerCase() === role.toLowerCase());
          if (matchingRole) {
            updatePayload.role = { id: matchingRole.id, type: "role" };
          } else {
            throw new Error(`Predefined role '${role}' not found in your DatoCMS project.`);
          }
        } else {
          // Assume it's a role ID
          updatePayload.role = { id: role, type: "role" };
        }
      } else if (typeof role === 'object' && role !== null) {
        // Direct role object assignment
        updatePayload.role = role;
      }

      // Update the API token with all required fields
      const updatedToken = await client.accessTokens.update(tokenId, updatePayload);

      // Convert to JSON and create response
      return createResponse(JSON.stringify({
        success: true,
        data: updatedToken,
        message: "API token updated successfully"
      }, null, 2));
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }

      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: API token with ID '${tokenId}' not found.`);
      }

      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error updating DatoCMS API token: ${error instanceof Error ? error.message : String(error)}`);
  }
};