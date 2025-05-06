import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the QueryDatoCMSUploadCollections tool with the MCP server
 */
export const registerQueryDatoCMSUploadCollections = (server: McpServer) => {
  server.tool(
    // Tool name
    "QueryDatoCMSUploadCollections",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
      
      // Query filters - optional parameters for filtering
      ids: z.string().optional().describe("Comma-separated list of DatoCMS upload collection IDs to fetch (with no spaces), e.g.: 'id1,id2,id3'")
    },
    // Annotations for the tool
    {
      title: "Query DatoCMS Upload Collections",
      description: "List all upload collections from DatoCMS, with optional filtering by IDs.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for the DatoCMS upload collections query operation
    async ({ apiToken, ids }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        // Prepare query parameters
        const queryParams: Record<string, unknown> = {};
        
        // Add filter if ids parameter is provided
        if (ids) {
          queryParams.filter = {
            ids: ids
          };
        }
        
        try {
          // List all upload collections
          const uploadCollections = await client.uploadCollections.list(queryParams);
          
          // Return empty result message if no upload collections found
          if (uploadCollections.length === 0) {
            return {
              content: [{
                type: "text" as const,
                text: "No upload collections found matching your query."
              }]
            };
          }
          
          // Return all upload collections
          return createResponse(JSON.stringify(uploadCollections, null, 2));
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
            text: `Error querying DatoCMS upload collections: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
