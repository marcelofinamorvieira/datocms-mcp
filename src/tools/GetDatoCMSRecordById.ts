import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../utils/errorHandlers.js";
import { createResponse } from "../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the GetDatoCMSRecordById tool with the MCP server
 */
export const registerGetDatoCMSRecordById = (server: McpServer) => {
  server.tool(
    // Tool name
    "GetDatoCMSRecordById",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemId: z.string().describe("The ID of the specific DatoCMS record to retrieve."),
      version: z.enum(["published", "current"]).optional().describe("Whether to retrieve the published version ('published') or the latest draft ('current'). Default is 'published'.")
    },
    // Annotations for the tool
    {
      title: "Get DatoCMS Record By ID",
      description: "Retrieves a specific DatoCMS record by its ID. This does not include any additional info with respect to QueryDatoCMSRecordsByString, it returns the same record object. If you already called for one tool for query, there is no need to call this tool again.",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for retrieving a specific item
    async ({ apiToken, itemId, version = "current" }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Prepare query parameters
          const queryParams: Record<string, unknown> = {
            version,
            nested: true
          };
        
          // Retrieve the item
          const item = await client.items.find(itemId, queryParams);
          
          // If no item found, return error
          if (!item) {
            return createErrorResponse(`Error: Record with ID '${itemId}' was not found.`);
          }

          // Convert to JSON and create response (will be chunked only if necessary)
          return createResponse(JSON.stringify(item, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Check if it's a not found error
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Record with ID '${itemId}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error retrieving DatoCMS record: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
