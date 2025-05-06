import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the ActivateMaintenanceMode tool with the MCP server
 */
export const registerActivateMaintenanceMode = (server: McpServer) => {
  server.tool(
    // Tool name
    "ActivateMaintenanceMode",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      force: z.boolean().optional().default(false).describe("Force the activation, even if there are collaborators editing some records.")
    },
    // Annotations for the tool
    {
      title: "Activate Maintenance Mode",
      description: "Activates maintenance mode which makes the primary environment read-only.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for activating maintenance mode
    async ({ apiToken, force }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Activate maintenance mode
          const options = { force };
          const maintenanceMode = await client.maintenanceMode.activate(options);
          
          if (!maintenanceMode) {
            return createErrorResponse("Error: Failed to activate maintenance mode.");
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
            text: `Error activating maintenance mode: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
