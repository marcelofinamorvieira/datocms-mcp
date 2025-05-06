import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the PromoteDatoCMSEnvironment tool with the MCP server
 */
export const registerPromoteDatoCMSEnvironment = (server: McpServer) => {
  server.tool(
    // Tool name
    "PromoteDatoCMSEnvironment",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      environmentId: z.string().describe("The ID of the environment to promote to primary.")
    },
    // Annotations for the tool
    {
      title: "Promote DatoCMS Environment",
      description: "Promotes a DatoCMS environment to primary status. This makes it the default environment for the project.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for promoting an environment
    async ({ apiToken, environmentId }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Promote the environment to primary
          const environment = await client.environments.promote(environmentId);
          
          if (!environment) {
            return createErrorResponse(`Error: Failed to promote environment with ID '${environmentId}' to primary.`);
          }
          
          return createResponse(JSON.stringify(environment, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Environment with ID '${environmentId}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error promoting environment: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
