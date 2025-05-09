/**
 * @file inviteUserHandler.ts
 * @description Handler for inviting a new user to DatoCMS
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { collaboratorSchemas } from "../../schemas.js";

type Params = z.infer<typeof collaboratorSchemas.user_invite>;

/**
 * Handler for inviting a new user to DatoCMS
 */
export const inviteUserHandler = async (params: Params) => {
  const { apiToken, email, role_id, first_name, last_name, environment } = params;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Get the first role ID and convert to the format expected by the API
      // The DatoCMS API requires at least one role
      const primaryRole = role_id
        ? { id: role_id, type: 'role' as const }
        : null;
        
      if (!primaryRole) {
        return createErrorResponse("Error: At least one role ID must be provided");
      }
      
      // Create the site invitation
      const invitation = await client.siteInvitations.create({
        email,
        role: primaryRole,
        ...(first_name !== undefined && { first_name }),
        ...(last_name !== undefined && { last_name }),
      });
      
      // Convert to JSON and create response
      return createResponse(JSON.stringify({
        success: true,
        data: invitation,
        message: "User invited successfully"
      }, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error inviting user to DatoCMS: ${error instanceof Error ? error.message : String(error)}`);
  }
};