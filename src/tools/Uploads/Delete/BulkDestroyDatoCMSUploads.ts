import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the BulkDestroyDatoCMSUploads tool with the MCP server
 */
export const registerBulkDestroyDatoCMSUploads = (server: McpServer) => {
  server.tool(
    // Tool name
    "BulkDestroyDatoCMSUploads",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      uploadIds: z.array(z.string()).describe("Array of upload IDs to delete. Maximum 200 uploads per request."),
      confirmation: z.boolean().describe("Explicit confirmation that you want to delete these uploads. This is a destructive action that cannot be undone."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Delete Multiple DatoCMS Uploads",
      description: "Permanently deletes multiple DatoCMS uploads at once. This is a destructive action that cannot be undone. Returns confirmation of success with the number of uploads deleted.",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: true // This tool is destructive
    },
    // Handler function for bulk deleting uploads
    async ({ apiToken, uploadIds, confirmation, environment }) => {
      // Require explicit confirmation due to destructive nature
      if (!confirmation) {
        return createErrorResponse("Error: Explicit confirmation is required to delete uploads. Set 'confirmation' parameter to true to proceed with deletion.");
      }

      // Check if we have any IDs to delete
      if (uploadIds.length === 0) {
        return createErrorResponse("Error: No upload IDs provided for deletion.");
      }
      
      // Check maximum number of uploads (similar to bulk record delete)
      if (uploadIds.length > 200) {
        return createErrorResponse("Error: Maximum of 200 uploads allowed per bulk delete request.");
      }

      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Format input for bulkDestroy with explicit type annotation
          const uploadsToDelete = uploadIds.map(id => ({ type: "upload" as const, id }));
          
          // Call bulkDestroy API
          await client.uploads.bulkDestroy({
            uploads: uploadsToDelete,
          });

          // For bulk operations, we only return confirmation since the API returns an empty array
          return createResponse(`Successfully deleted ${uploadIds.length} upload(s) with IDs: ${uploadIds.join(", ")}`);
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          if (isNotFoundError(apiError)) {
            return createErrorResponse("Error: One or more uploads in the provided IDs were not found.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error deleting DatoCMS uploads: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
