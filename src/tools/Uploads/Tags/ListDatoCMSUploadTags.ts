import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the ListDatoCMSUploadTags tool with the MCP server
 */
export const registerListDatoCMSUploadTags = (server: McpServer) => {
  server.tool(
    // Tool name
    "ListDatoCMSUploadTags",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      filter: z.string().optional().describe("Optional filter to apply when listing tags. Use 'used' to only show tags that are being used, or 'unused' to show tags that are not being used."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "List DatoCMS Upload Tags",
      description: "Lists all the upload tags in the DatoCMS project.",
      readOnlyHint: true // This tool only reads resources
    },
    // Handler function for listing upload tags
    async ({ apiToken, filter, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Prepare the query options
          const queryOptions: {
            filter?: { query?: string };
            page?: { offset?: number; limit?: number };
          } = {};
          
          if (filter) {
            queryOptions.filter = { query: filter };
          }
          
          // List all upload tags with provided filters and pagination
          const uploadTags = await client.uploadTags.list(queryOptions);
          
          if (!uploadTags || uploadTags.length === 0) {
            return createResponse(JSON.stringify([], null, 2));
          }
          
          return createResponse(JSON.stringify(uploadTags, null, 2));
          
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
            text: `Error listing upload tags: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
