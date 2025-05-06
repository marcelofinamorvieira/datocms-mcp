import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the ListDatoCMSModels tool with the MCP server
 */
export const registerListDatoCMSModels = (server: McpServer) => {
  server.tool(
    // Tool name
    "ListDatoCMSModels",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "List DatoCMS Models",
      description: "Retrieves all models (item types) from your DatoCMS project.",
      readOnlyHint: true // This tool only reads resources
    },
    // Handler function for listing models
    async ({ apiToken, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Use the proper method to list all models
          const models = await client.itemTypes.list();
          
          return createResponse(JSON.stringify(models, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error listing models: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
