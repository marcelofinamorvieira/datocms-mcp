import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DestroyDatoCMSRecord tool with the MCP server
 */
export const registerDestroyDatoCMSRecord = (server: McpServer) => {
  server.tool(
    // Tool name
    "DestroyDatoCMSRecord",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemId: z.union([z.string(), z.array(z.string())]).describe("The ID of the DatoCMS record to delete, or an array of IDs for bulk deletion."),
      confirmation: z.boolean().describe("Explicit confirmation that you want to delete this record or records. This is a destructive action that cannot be undone."),
      returnOnlyConfirmation: z.boolean().optional().describe("If true, returns only a success confirmation message instead of the full record data. Use this to save on token usage. Default is false.")
    },
    // Annotations for the tool
    {
      title: "Delete DatoCMS Record",
      description: "Permanently deletes one or more DatoCMS records. This is a destructive action that cannot be undone. For a single record deletion, it returns the deleted record object. For bulk deletion, it returns confirmation of success.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for deleting records
    async ({ apiToken, itemId, confirmation, returnOnlyConfirmation = false }) => {
      // Require explicit confirmation due to destructive nature
      if (!confirmation) {
        return createErrorResponse("Error: Explicit confirmation is required to delete record(s). Set 'confirmation' parameter to true to proceed with deletion.");
      }

      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Handle single record deletion (string ID)
          if (typeof itemId === 'string') {
            const deletedItem = await client.items.destroy(itemId);
            
            // If no item returned, return error
            if (!deletedItem) {
              return createErrorResponse(`Error: Failed to delete record with ID '${itemId}'.`);
            }

            // Return only confirmation message if requested (to save on tokens)
            if (returnOnlyConfirmation) {
              return createResponse(`Successfully deleted record with ID '${itemId}'.`);
            }

            // Otherwise return the full record data
            return createResponse(JSON.stringify(deletedItem, null, 2));
          }
          
          // Handle bulk record deletion (array of IDs)
          if (Array.isArray(itemId)) {
            // Check if we have any IDs to delete
            if (itemId.length === 0) {
              return createErrorResponse("Error: No record IDs provided for deletion.");
            }

            // Format input for bulkDestroy with explicit type annotation
            const itemsToDelete = itemId.map(id => ({ type: "item" as const, id }));
            
            // Call bulkDestroy API
            await client.items.bulkDestroy({
              items: itemsToDelete,
            });

            // For bulk operations, we only return confirmation since the API returns an empty array
            return createResponse(`Successfully deleted ${itemId.length} record(s) with IDs: ${itemId.join(", ")}`);
          }
          
          // This should never be reached with proper typing
          return createErrorResponse("Error: Invalid itemId format. Must be either a string ID or an array of string IDs.");
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Check if it's a not found error
          if (isNotFoundError(apiError)) {
            if (typeof itemId === 'string') {
              return createErrorResponse(`Error: Record with ID '${itemId}' was not found.`);
            }
            return createErrorResponse("Error: One or more records in the provided IDs were not found.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error deleting DatoCMS record(s): ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
