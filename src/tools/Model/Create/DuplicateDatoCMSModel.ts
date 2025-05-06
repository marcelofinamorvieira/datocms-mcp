import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DuplicateDatoCMSModel tool with the MCP server
 */
export const registerDuplicateDatoCMSModel = (server: McpServer) => {
  server.tool(
    // Tool name
    "DuplicateDatoCMSModel",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      modelIdOrApiKey: z.string().describe("The ID or API key of the model to duplicate."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "Duplicate DatoCMS Model",
      description: "Creates a duplicate of an existing model (item type) in your DatoCMS project.",
      readOnlyHint: false, // This tool creates a new resource
      destructiveHint: false // This tool doesn't destroy anything
    },
    // Handler function for duplicating a model
    async ({ apiToken, modelIdOrApiKey, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Duplicate the model using the provided ID or API key
          const duplicatedModel = await client.itemTypes.duplicate(modelIdOrApiKey);
          
          return createResponse(JSON.stringify(duplicatedModel, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Model with ID or API key '${modelIdOrApiKey}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error duplicating model: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
