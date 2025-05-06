import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the FetchMaintenanceMode tool with the MCP server
 */
export const registerFetchMaintenanceMode = (server: McpServer) => {
  server.tool(
    // Tool name
    "FetchMaintenanceMode",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "Fetch Maintenance Mode Status",
      description: "Fetches the current maintenance mode status from a DatoCMS project.",
      readOnlyHint: true // This tool only reads resources
    },
    // Handler function for fetching maintenance mode status
    async ({ apiToken, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Fetch maintenance mode status
          const maintenanceMode = await client.maintenanceMode.find();
          
          if (!maintenanceMode) {
            return createErrorResponse("Error: Failed to fetch maintenance mode status.");
          }
          
          return createResponse(JSON.stringify(maintenanceMode, null, 2));
          
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
            text: `Error fetching maintenance mode status: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
