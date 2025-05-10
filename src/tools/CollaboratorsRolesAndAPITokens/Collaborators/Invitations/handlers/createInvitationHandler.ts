/**
 * @file createInvitationHandler.ts
 * @description Handler for creating a new DatoCMS site invitation
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import type { collaboratorSchemas } from "../../../schemas.js";

/**
 * Handler for creating a new DatoCMS site invitation
 */
export const createInvitationHandler = async (args: z.infer<typeof collaboratorSchemas.invitation_create>) => {
  const { apiToken, email, role, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Create the invitation - handle different role formats
      // If role is a predefined string, convert to proper resource linkage format
      const roleData = typeof role === 'string'
        ? { id: role, type: 'role' as const }
        : role;

      // Create the invitation
      const invitation = await client.siteInvitations.create({
        email,
        role: roleData
      });
      
      // Convert to JSON and create response
      return createResponse(JSON.stringify(invitation, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error creating DatoCMS site invitation: ${error instanceof Error ? error.message : String(error)}`);
  }
};