import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DeleteDatoCMSEnvironment tool with the MCP server
 */
export const registerDeleteDatoCMSEnvironment = (server: McpServer) => {
  server.tool(
    // Tool name
    "DeleteDatoCMSEnvironment",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      environmentId: z.string().describe("The ID of the environment to delete."),
      confirmation: z.literal("confirm").describe("Type 'confirm' to confirm the deletion. This is required to prevent accidental deletion.")
    },
    // Annotations for the tool
    {
      title: "Delete DatoCMS Environment",
      description: "Permanently deletes a DatoCMS environment by its ID.",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: true // This tool is destructive
    },
    // Handler function for deleting an environment
    async ({ apiToken, environmentId, confirmation }) => {
      // Validate confirmation
      if (confirmation !== "confirm") {
        return createErrorResponse("Error: You must explicitly confirm deletion by setting confirmation to 'confirm'.");
      }
      
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Delete the environment
          const environment = await client.environments.destroy(environmentId);
          
          if (!environment) {
            return createErrorResponse(`Error: Failed to delete environment with ID '${environmentId}'.`);
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
            text: `Error deleting environment: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
