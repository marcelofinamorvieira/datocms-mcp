/**
 * @file updateUserHandler.ts
 * @description Handler for updating a DatoCMS user
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { collaboratorSchemas } from "../../schemas.js";

type Params = z.infer<typeof collaboratorSchemas.user_update>;

/**
 * Handler for updating a DatoCMS user
 */
export const updateUserHandler = async (params: Params) => {
  const { apiToken, userId, email, first_name, last_name, role_id, environment } = params;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Create update payload, filtering out undefined fields
      const updatePayload: Record<string, any> = {};
      if (email !== undefined) updatePayload.email = email;
      if (first_name !== undefined) updatePayload.first_name = first_name;
      if (last_name !== undefined) updatePayload.last_name = last_name;
      if (role_id !== undefined) updatePayload.role = { id: role_id, type: 'role' as const };
      
      // Update the user
      const updatedUser = await client.users.update(userId, updatePayload);
      
      // Convert to JSON and create response
      return createResponse(JSON.stringify({
        success: true,
        data: updatedUser,
        message: "User updated successfully"
      }, null, 2));
      
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }
      
      if (isNotFoundError(apiError)) {
        return createErrorResponse(`Error: The user with ID '${userId}' was not found.`);
      }
      
      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error updating DatoCMS user: ${error instanceof Error ? error.message : String(error)}`);
  }
};