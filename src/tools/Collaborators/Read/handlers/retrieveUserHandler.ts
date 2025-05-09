/**
 * @file retrieveUserHandler.ts
 * @description Handler for retrieving a specific DatoCMS user
 */

import type { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { createResponse } from "../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import type { collaboratorSchemas } from "../../schemas.js";

type Params = z.infer<typeof collaboratorSchemas.user_retrieve>;

/**
 * Handler for retrieving a specific DatoCMS user
 */
export const retrieveUserHandler = async (params: Params) => {
  const { apiToken, userId, environment } = params;
  
  try {
    // Initialize DatoCMS client
    const clientParameters = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParameters);
    
    try {
      // Fetch the specific user
      const user = await client.users.find(userId);
      
      // Convert to JSON and create response
      return createResponse(JSON.stringify({
        success: true,
        data: user,
        message: "User retrieved successfully"
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
    return createErrorResponse(`Error retrieving DatoCMS user: ${error instanceof Error ? error.message : String(error)}`);
  }
};