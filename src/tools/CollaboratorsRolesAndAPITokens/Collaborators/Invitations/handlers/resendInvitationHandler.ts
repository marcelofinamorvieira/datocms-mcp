/**
 * @file resendInvitationHandler.ts
 * @description Handler for resending a DatoCMS site invitation
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";
import type { collaboratorSchemas } from "../../../schemas.js";

/**
 * Handler for resending a DatoCMS site invitation
 */
export const resendInvitationHandler = async (args: z.infer<typeof collaboratorSchemas.invitation_resend>) => {
  const { apiToken, invitationId, environment } = args;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Resend the invitation
      await client.siteInvitations.resend(invitationId);
      
      // Return success response
      return createResponse(JSON.stringify({ success: true, message: `Invitation with ID ${invitationId} successfully resent.` }, null, 2));
      
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
    return createErrorResponse(`Error resending DatoCMS site invitation: ${error instanceof Error ? error.message : String(error)}`);
  }
};