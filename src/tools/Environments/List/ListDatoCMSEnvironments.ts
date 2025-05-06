import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the ListDatoCMSEnvironments tool with the MCP server
 */
export const registerListDatoCMSEnvironments = (server: McpServer) => {
  server.tool(
    // Tool name
    "ListDatoCMSEnvironments",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication.")
    },
    // Annotations for the tool
    {
      title: "List DatoCMS Environments",
      description: "Retrieves a list of all environments in the DatoCMS project.",
      readOnlyHint: true // This tool only reads resources
    },
    // Handler function for listing environments
    async ({ apiToken }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // List all environments
          const environments = await client.environments.list();
          
          if (!environments || environments.length === 0) {
            return createResponse(JSON.stringify([], null, 2));
          }
          
          return createResponse(JSON.stringify(environments, null, 2));
          
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
            text: `Error listing environments: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
