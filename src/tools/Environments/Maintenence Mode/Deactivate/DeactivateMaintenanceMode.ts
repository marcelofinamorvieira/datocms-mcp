import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../../utils/errorHandlers.js";
import { createResponse } from "../../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DeactivateMaintenanceMode tool with the MCP server
 */
export const registerDeactivateMaintenanceMode = (server: McpServer) => {
  server.tool(
    // Tool name
    "DeactivateMaintenanceMode",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "Deactivate Maintenance Mode",
      description: "Deactivates maintenance mode in a DatoCMS project.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for deactivating maintenance mode
    async ({ apiToken, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Deactivate maintenance mode
          const maintenanceMode = await client.maintenanceMode.deactivate();
          
          if (!maintenanceMode) {
            return createErrorResponse("Error: Failed to deactivate maintenance mode.");
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
            text: `Error deactivating maintenance mode: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
