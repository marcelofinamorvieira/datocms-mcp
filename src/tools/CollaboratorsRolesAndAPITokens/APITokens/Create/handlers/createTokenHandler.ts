import { buildClient } from "@datocms/cma-client-node";
import { z } from "zod";
import { apiTokenSchemas } from "../../../schemas.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../../utils/errorHandlers.js";

type Params = z.infer<typeof apiTokenSchemas.create_token>;

/**
 * Handler for creating a new API token in DatoCMS
 */
export const createTokenHandler = async (params: Params) => {
  const {
    apiToken,
    name,
    role,
    can_access_cda,
    can_access_cma,
    environment
  } = params;

  try {
    // Initialize DatoCMS client
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    try {
      // Prepare token payload
      const tokenPayload: any = {
        name,
      };

      // Handle role assignment
      if (typeof role === 'string') {
        // Handle predefined role names or role IDs
        if (['admin', 'editor', 'developer', 'seo', 'contributor'].includes(role)) {
          const roles = await client.roles.list();
          const matchingRole = roles.find(r => r.name.toLowerCase() === role.toLowerCase());
          if (matchingRole) {
            tokenPayload.role = { id: matchingRole.id, type: "role" };
          } else {
            throw new Error(`Predefined role '${role}' not found in your DatoCMS project.`);
          }
        } else {
          // Assume it's a role ID
          tokenPayload.role = { id: role, type: "role" };
        }
      } else if (typeof role === 'object') {
        // Direct role object assignment
        tokenPayload.role = role;
      }

      // Add optional flags if provided
      if (can_access_cda !== undefined) {
        tokenPayload.can_access_cda = can_access_cda;
      }
      
      if (can_access_cma !== undefined) {
        tokenPayload.can_access_cma = can_access_cma;
      }

      // Create the API token
      const newToken = await client.accessTokens.create(tokenPayload);

      // Convert to JSON and create response
      return createResponse(JSON.stringify({
        success: true,
        data: newToken,
        message: "API token created successfully"
      }, null, 2));
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }

      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error creating DatoCMS API token: ${error instanceof Error ? error.message : String(error)}`);
  }
};