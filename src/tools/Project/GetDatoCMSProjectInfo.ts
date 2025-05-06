import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../utils/errorHandlers.js";
import { createResponse } from "../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the GetDatoCMSProjecteInfo tool with the MCP server
 */
export const registerGetDatoCMSProjectInfo = (server: McpServer) => {
  server.tool(
    // Tool name
    "GetDatoCMSProjectInfo",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Get DatoCMS Project Information",
      description: "Retrieves information about the DatoCMS Project, including its configuration, locales, base URLs and metadata.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for retrieving site information
    async ({ apiToken, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Retrieve the project information
          const project = await client.site.find();
          
          // If no project found, return error
          if (!project) {
            return createErrorResponse("Error: Could not retrieve project information.");
          }

          // Convert to JSON and create response (will be chunked only if necessary)
          return createResponse(JSON.stringify(project, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error retrieving DatoCMS site information: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
