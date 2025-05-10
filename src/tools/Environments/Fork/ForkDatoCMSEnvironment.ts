import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the ForkDatoCMSEnvironment tool with the MCP server
 */
export const registerForkDatoCMSEnvironment = (server: McpServer) => {
  server.tool(
    // Tool name
    "ForkDatoCMSEnvironment",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      environmentId: z.string().describe("The ID of the environment to fork."),
      newId: z.string().describe("The ID for the forked environment. Should be in kebab-case format."),
      fast: z.boolean().optional().default(false).describe("When true, performing a fast fork reduces processing time, but it also prevents writing to the source environment during the process."),
      force: z.boolean().optional().default(false).describe("When true, forces the start of fast fork, even if there are collaborators editing some records.")
    },
    // Annotations for the tool
    {
      title: "Fork DatoCMS Environment",
      description: "Creates a new environment by forking an existing one.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for forking an environment
    async ({ apiToken, environmentId, newId, fast = false, force = false }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Fork the environment with immediate_return set to false
          // to wait for the completion of the fork operation
          const forkOptions = {
            id: newId,
            immediate_return: false,
            fast,
            force
          };
          
          const environment = await client.environments.fork(environmentId, forkOptions);
          
          if (!environment) {
            return createErrorResponse(`Error: Failed to fork environment with ID '${environmentId}'.`);
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
            text: `Error forking environment: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
