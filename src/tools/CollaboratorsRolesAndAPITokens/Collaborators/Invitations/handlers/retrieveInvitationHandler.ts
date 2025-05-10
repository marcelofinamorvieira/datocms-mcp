/**
 * @file retrieveInvitationHandler.ts
 * @description Handler for retrieving a specific DatoCMS site invitation
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import type { collaboratorSchemas } from "../../../schemas.js";

/**
 * Handler for retrieving a specific DatoCMS site invitation
 */
export const retrieveInvitationHandler = async (args: z.infer<typeof collaboratorSchemas.invitation_retrieve>) => {
  const { apiToken, invitationId, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Retrieve the invitation
      const invitation = await client.siteInvitations.find(invitationId);
      
      // Convert to JSON and create response
      return createResponse(JSON.stringify(invitation, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: Invitation with ID ${invitationId} not found.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error retrieving DatoCMS site invitation: ${error instanceof Error ? error.message : String(error)}`);
  }
};