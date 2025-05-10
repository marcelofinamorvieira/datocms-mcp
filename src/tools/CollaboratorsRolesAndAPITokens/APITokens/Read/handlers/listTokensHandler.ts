import { buildClient } from "@datocms/cma-client-node";
import { z } from "zod";
import { apiTokenSchemas } from "../../../schemas.js";
import { createResponse } from "../../../../../utils/responseHandlers.js";
import { isAuthorizationError, createErrorResponse } from "../../../../../utils/errorHandlers.js";

type Params = z.infer<typeof apiTokenSchemas.list_tokens>;

/**
 * Handler for listing all API tokens in DatoCMS
 */
export const listTokensHandler = async (params: Params) => {
  const { apiToken, environment } = params;

  try {
    // Initialize DatoCMS client
    const clientParams = environment ? { apiToken, environment } : { apiToken };
    const client = buildClient(clientParams);

    try {
      // Fetch all API tokens
      const tokens = await client.accessTokens.list();

      // Convert to JSON and create response
      return createResponse(JSON.stringify({
        success: true,
        data: tokens,
        message: "API tokens retrieved successfully"
      }, null, 2));
    } catch (apiError: unknown) {
      if (isAuthorizationError(apiError)) {
        return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
      }

      // Re-throw other API errors to be caught by the outer catch
      throw apiError;
    }
  } catch (error) {
    return createErrorResponse(`Error listing DatoCMS API tokens: ${error instanceof Error ? error.message : String(error)}`);
  }
};