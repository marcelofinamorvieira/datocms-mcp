import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DeleteDatoCMSModel tool with the MCP server
 */
export const registerDeleteDatoCMSModel = (server: McpServer) => {
  server.tool(
    // Tool name
    "DeleteDatoCMSModel",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      modelIdOrApiKey: z.string().describe("The ID or API key of the model to delete."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "Delete DatoCMS Model",
      description: "Permanently deletes a model (item type) from your DatoCMS project.",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: true // This tool permanently deletes resources
    },
    // Handler function for deleting a model
    async ({ apiToken, modelIdOrApiKey, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Delete the model using the provided ID or API key
          const deletedModel = await client.itemTypes.destroy(modelIdOrApiKey);
          
          return createResponse(JSON.stringify(deletedModel, null, 2));
          
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
            text: `Error deleting model: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
