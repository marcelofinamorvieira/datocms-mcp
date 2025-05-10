import { buildClient } from "@datocms/cma-client-node";
import { z } from "zod";
import { apiTokenSchemas } from "../../../schemas.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../../../utils/errorHandlers.js";

type Params = z.infer<typeof apiTokenSchemas.retrieve_token>;

/**
 * Handler for retrieving a specific API token in DatoCMS
 */
export const retrieveTokenHandler = async (params: Params) => {
  const { apiToken, tokenId, environment } = params;

  try {
    // Initialize DatoCMS client
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    try {
      // Fetch the specific API token
      const token = await client.accessTokens.find(tokenId);

      // Convert to JSON and create response
      return createResponse(JSON.stringify({
        success: true,
        data: token,
        message: "API token retrieved successfully"
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
    return createErrorResponse(`Error retrieving DatoCMS API token: ${error instanceof Error ? error.message : String(error)}`);
  }
};