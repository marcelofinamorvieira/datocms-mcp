import { buildClient } from "@datocms/cma-client-node";
import { z } from "zod";
import { apiTokenSchemas } from "../../../schemas.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";

type Params = z.infer<typeof apiTokenSchemas.destroy_token>;

/**
 * Handler for deleting an API token in DatoCMS
 */
export const destroyTokenHandler = async (params: Params) => {
  const { apiToken, tokenId, environment } = params;

  try {
    // Initialize DatoCMS client
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    try {
      // Delete the token
      await client.accessTokens.destroy(tokenId);

      // Return success response
      return createResponse(JSON.stringify({
        success: true,
        message: `API token with ID '${tokenId}' was successfully deleted`
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
    return createErrorResponse(`Error deleting DatoCMS API token: ${error instanceof Error ? error.message : String(error)}`);
  }
};