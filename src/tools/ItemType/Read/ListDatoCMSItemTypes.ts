import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the ListDatoCMSItemTypes tool with the MCP server
 */
export const registerListDatoCMSItemTypes = (server: McpServer) => {
  server.tool(
    // Tool name
    "ListDatoCMSItemTypes",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      filter: z.object({
        singleton: z.boolean().optional().describe("Filter item types by singleton status."),
        modular_block: z.boolean().optional().describe("Filter item types by modular block status."),
        tree: z.boolean().optional().describe("Filter item types by tree status.")
      }).optional().describe("Optional filters to apply when listing item types."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "List DatoCMS Item Types",
      description: "Lists all item types in your DatoCMS project with optional filtering.",
      readOnlyHint: true // This tool only reads resources
    },
    // Handler function for listing item types
    async ({ apiToken, filter, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // List item types with optional filters
          const itemTypes = await client.itemTypes.list(filter || {});
          
          return createResponse(JSON.stringify(itemTypes, null, 2));
          
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
            text: `Error listing item types: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};