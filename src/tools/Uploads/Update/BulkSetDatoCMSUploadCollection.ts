import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the BulkSetDatoCMSUploadCollection tool with the MCP server
 */
export const registerBulkSetDatoCMSUploadCollection = (server: McpServer) => {
  server.tool(
    // Tool name
    "BulkSetDatoCMSUploadCollection",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      uploadIds: z.array(z.string()).describe("Array of DatoCMS upload IDs to assign to the collection."),
      collectionId: z.string().nullable().describe("The ID of the DatoCMS upload collection to add the uploads to. Set to null to remove uploads from their current collection.")
    },
    // Annotations for the tool
    {
      title: "Assign DatoCMS Uploads to Collection in Bulk",
      description: "Move multiple DatoCMS uploads to a specified collection. Returns a confirmation message.",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: false // This tool is not destructive
    },
    // Handler function for bulk assignment to collection
    async ({ apiToken, uploadIds, collectionId }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Format uploads array as required by the API
          const uploadsParam = uploadIds.map(id => ({ type: "upload" as const, id }));
          
          // Format the upload_collection parameter
          const uploadCollectionParam = collectionId 
            ? { type: "upload_collection" as const, id: collectionId }
            : null;
          
          // Call the bulk set upload collection API
          await client.uploads.bulkSetUploadCollection({
            uploads: uploadsParam,
            upload_collection: uploadCollectionParam,
          });
          
          // Return confirmation message
          const actionText = collectionId 
            ? `assigned to collection '${collectionId}'` 
            : "removed from their collection";
          return createResponse(`Successfully ${actionText} ${uploadIds.length} uploads.`);
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Check if it's a not found error
          if (isNotFoundError(apiError)) {
            return createErrorResponse("Error: One or more of the specified uploads or the collection was not found.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error assigning uploads to collection: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
