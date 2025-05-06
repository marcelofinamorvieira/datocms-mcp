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
      filter: z.object({
        query: z.string().optional().describe("Textual query to match the tag names against.")
      }).optional().describe("Attributes to filter tags."),
      page: z.object({
        offset: z.number().int().optional().describe("The (zero-based) offset of the first entity returned in the collection (defaults to 0)."),
        limit: z.number().int().optional().describe("The maximum number of entities to return (defaults to 50, maximum is 500).")
      }).optional().describe("Parameters to control offset-based pagination.")
    },
    // Annotations for the tool
    {
      title: "List DatoCMS Upload Tags",
      description: "Retrieves all manually created upload tags for the DatoCMS project, with optional filtering and pagination.",
      readOnlyHint: true // This tool only reads resources
    },
    // Handler function for listing upload tags
    async ({ apiToken, filter, page }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Prepare the query options
          const queryOptions: {
            filter?: { query?: string };
            page?: { offset?: number; limit?: number };
          } = {};
          
          if (filter) {
            queryOptions.filter = filter;
          }
          
          if (page) {
            queryOptions.page = page;
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
