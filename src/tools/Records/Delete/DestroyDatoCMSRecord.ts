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
      itemId: z.string().describe("The ID of the DatoCMS record to delete."),
      confirmation: z.boolean().describe("Explicit confirmation that you want to delete this record. This is a destructive action that cannot be undone."),
      returnOnlyConfirmation: z.boolean().optional().describe("If true, returns only a success confirmation message instead of the full record data. Use this to save on token usage. Default is false.")
    },
    // Annotations for the tool
    {
      title: "Delete DatoCMS Record",
      description: "Permanently deletes a single DatoCMS record. This is a destructive action that cannot be undone. Returns the deleted record object or a confirmation message.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for deleting a single record
    async ({ apiToken, itemId, confirmation, returnOnlyConfirmation = false }) => {
      // Require explicit confirmation due to destructive nature
      if (!confirmation) {
        return createErrorResponse("Error: Explicit confirmation is required to delete the record. Set 'confirmation' parameter to true to proceed with deletion.");
      }

      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
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
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error deleting DatoCMS record: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
