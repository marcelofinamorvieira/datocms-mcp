import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DestroyDatoCMSUpload tool with the MCP server
 */
export const registerDestroyDatoCMSUpload = (server: McpServer) => {
  server.tool(
    // Tool name
    "DestroyDatoCMSUpload",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      uploadId: z.string().describe("The ID of the DatoCMS upload to delete."),
      confirmation: z.boolean().describe("Explicit confirmation that you want to delete this upload. This is a destructive action that cannot be undone."),
      returnOnlyConfirmation: z.boolean().optional().describe("If true, returns only a success confirmation message instead of the full upload data. Use this to save on token usage. Default is false.")
    },
    // Annotations for the tool
    {
      title: "Delete DatoCMS Upload",
      description: "Permanently deletes a DatoCMS upload. This is a destructive action that cannot be undone. Returns the deleted upload object or a confirmation message.",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: true // This tool is destructive
    },
    // Handler function for deleting an upload
    async ({ apiToken, uploadId, confirmation, returnOnlyConfirmation = false }) => {
      // Require explicit confirmation due to destructive nature
      if (!confirmation) {
        return createErrorResponse("Error: Explicit confirmation is required to delete the upload. Set 'confirmation' parameter to true to proceed with deletion.");
      }

      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          const deletedUpload = await client.uploads.destroy(uploadId);
          
          // If no upload returned, return error
          if (!deletedUpload) {
            return createErrorResponse(`Error: Failed to delete upload with ID '${uploadId}'.`);
          }

          // Return only confirmation message if requested (to save on tokens)
          if (returnOnlyConfirmation) {
            return createResponse(`Successfully deleted upload with ID '${uploadId}'.`);
          }

          // Otherwise return the full upload data
          return createResponse(JSON.stringify(deletedUpload, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Check if it's a not found error
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Upload with ID '${uploadId}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error deleting DatoCMS upload: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
