import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the RenameDatoCMSEnvironment tool with the MCP server
 */
export const registerRenameDatoCMSEnvironment = (server: McpServer) => {
  server.tool(
    // Tool name
    "RenameDatoCMSEnvironment",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      environmentId: z.string().describe("The ID of the environment to rename."),
      newId: z.string().describe("The new ID for the environment. Should be kebab case")
    },
    // Annotations for the tool
    {
      title: "Rename DatoCMS Environment",
      description: "Renames a DatoCMS environment by changing its ID.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for renaming an environment
    async ({ apiToken, environmentId, newId }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Rename the environment
          const environment = await client.environments.rename(environmentId, {
            id: newId
          });
          
          if (!environment) {
            return createErrorResponse(`Error: Failed to rename environment with ID '${environmentId}'.`);
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
            text: `Error renaming environment: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
