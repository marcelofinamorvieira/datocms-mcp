import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the RetrieveDatoCMSEnvironment tool with the MCP server
 */
export const registerRetrieveDatoCMSEnvironment = (server: McpServer) => {
  server.tool(
    // Tool name
    "RetrieveDatoCMSEnvironment",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      environmentId: z.string().describe("The ID of the environment to retrieve.")
    },
    // Annotations for the tool
    {
      title: "Retrieve DatoCMS Environment",
      description: "Retrieves information about a specific DatoCMS environment by its ID.",
      readOnlyHint: true // This tool only reads resources
    },
    // Handler function for fetching environment information
    async ({ apiToken, environmentId }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Fetch environment information
          const environment = await client.environments.find(environmentId);
          
          if (!environment) {
            return createErrorResponse(`Error: Failed to fetch environment with ID '${environmentId}'.`);
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
            text: `Error retrieving environment: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
