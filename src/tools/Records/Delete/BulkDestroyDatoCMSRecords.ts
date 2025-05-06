import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the BulkDestroyDatoCMSRecords tool with the MCP server
 */
export const registerBulkDestroyDatoCMSRecords = (server: McpServer) => {
  server.tool(
    // Tool name
    "BulkDestroyDatoCMSRecords",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemIds: z.array(z.string()).describe("Array of record IDs to delete. Maximum 200 records per request."),
      confirmation: z.boolean().describe("Explicit confirmation that you want to delete these records. This is a destructive action that cannot be undone."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Delete Multiple DatoCMS Records",
      description: "Permanently deletes multiple DatoCMS records at once. This is a destructive action that cannot be undone. Returns confirmation of success with the number of records deleted.",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: true // This tool is destructive
    },
    // Handler function for bulk deleting records
    async ({ apiToken, itemIds, confirmation, environment }) => {
      // Require explicit confirmation due to destructive nature
      if (!confirmation) {
        return createErrorResponse("Error: Explicit confirmation is required to delete records. Set 'confirmation' parameter to true to proceed with deletion.");
      }

      // Check if we have any IDs to delete
      if (itemIds.length === 0) {
        return createErrorResponse("Error: No record IDs provided for deletion.");
      }
      
      // Check maximum number of records (similar to bulk publish)
      if (itemIds.length > 200) {
        return createErrorResponse("Error: Maximum of 200 records allowed per bulk delete request.");
      }

      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Format input for bulkDestroy with explicit type annotation
          const itemsToDelete = itemIds.map(id => ({ type: "item" as const, id }));
          
          // Call bulkDestroy API
          await client.items.bulkDestroy({
            items: itemsToDelete,
          });

          // For bulk operations, we only return confirmation since the API returns an empty array
          return createResponse(`Successfully deleted ${itemIds.length} record(s) with IDs: ${itemIds.join(", ")}`);
          
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
            text: `Error deleting DatoCMS records: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
