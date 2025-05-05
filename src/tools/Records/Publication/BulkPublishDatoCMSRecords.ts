import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the BulkPublishDatoCMSRecords tool with the MCP server
 */
export const registerBulkPublishDatoCMSRecords = (server: McpServer) => {
  server.tool(
    // Tool name
    "BulkPublishDatoCMSRecords",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      itemIds: z.array(z.string()).describe("Array of record IDs to publish (maximum 200 records per request).")
    },
    // Annotations for the tool
    {
      title: "Bulk Publish DatoCMS Records",
      description: "Publishes multiple DatoCMS records at once. For bulk publication, the entire record is always published (all locales and non-localized content). Maximum 200 records per request.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for bulk publishing records
    async ({ apiToken, itemIds }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        // Check if we have any IDs to publish
        if (itemIds.length === 0) {
          return createErrorResponse("Error: No record IDs provided for publication.");
        }
        
        // Check maximum number of records (DatoCMS API limit)
        if (itemIds.length > 200) {
          return createErrorResponse("Error: Maximum of 200 records allowed per bulk publish request.");
        }
        
        try {
          // Format input for bulkPublish with explicit type annotation
          const itemsToPublish = itemIds.map(id => ({ type: "item" as const, id }));
          
          // Call bulkPublish API
          const publishedItems = await client.items.bulkPublish({
            items: itemsToPublish
          });
          
          if (!publishedItems) {
            return createErrorResponse("Error: Failed to publish records.");
          }
          
          return createResponse(
            `Successfully published ${itemIds.length} record(s).\n\n${JSON.stringify(publishedItems, null, 2)}`
          );
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          if (isNotFoundError(apiError)) {
            return createErrorResponse("Error: One or more records in the provided IDs were not found.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error bulk publishing DatoCMS records: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
