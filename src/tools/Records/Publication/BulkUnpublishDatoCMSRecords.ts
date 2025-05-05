import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the BulkUnpublishDatoCMSRecords tool with the MCP server
 */
export const registerBulkUnpublishDatoCMSRecords = (server: McpServer) => {
  server.tool(
    // Tool name
    "BulkUnpublishDatoCMSRecords",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      itemIds: z.array(z.string()).describe("Array of record IDs to unpublish (maximum 200 records per request).")
    },
    // Annotations for the tool
    {
      title: "Bulk Unpublish DatoCMS Records",
      description: "Unpublishes multiple DatoCMS records at once, returning them to Draft status. For bulk unpublication, the entire record is always unpublished (all locales). Maximum 200 records per request.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for bulk unpublishing records
    async ({ apiToken, itemIds }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        // Check if we have any IDs to unpublish
        if (itemIds.length === 0) {
          return createErrorResponse("Error: No record IDs provided for unpublication.");
        }
        
        // Check maximum number of records (DatoCMS API limit)
        if (itemIds.length > 200) {
          return createErrorResponse("Error: Maximum of 200 records allowed per bulk unpublish request.");
        }
        
        try {
          // Format input for bulkUnpublish with explicit type annotation
          const itemsToUnpublish = itemIds.map(id => ({ type: "item" as const, id }));
          
          // Call bulkUnpublish API
          const unpublishedItems = await client.items.bulkUnpublish({
            items: itemsToUnpublish
          });
          
          if (!unpublishedItems) {
            return createErrorResponse("Error: Failed to unpublish records.");
          }
          
          return createResponse(
            `Successfully unpublished ${itemIds.length} record(s).\n\n${JSON.stringify(unpublishedItems, null, 2)}`
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
            text: `Error bulk unpublishing DatoCMS records: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
