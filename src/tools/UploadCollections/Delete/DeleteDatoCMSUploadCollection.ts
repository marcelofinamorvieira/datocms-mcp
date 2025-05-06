import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DeleteDatoCMSUploadCollection tool with the MCP server
 */
export const registerDeleteDatoCMSUploadCollection = (server: McpServer) => {
  server.tool(
    // Tool name
    "DeleteDatoCMSUploadCollection",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
      uploadCollectionId: z.string().describe("ID of the upload collection to delete")
    },
    // Annotations for the tool
    {
      title: "Delete DatoCMS Upload Collection",
      description: "Deletes a single upload collection by ID from the DatoCMS API and returns the deleted resource",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: true // This tool modifies resources
    },
    // Handler function for deleting an upload collection
    async ({ apiToken, uploadCollectionId }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Delete the upload collection and return its data
          const deletedUploadCollection = await client.uploadCollections.destroy(uploadCollectionId);
          
          // Return the deleted upload collection data
          return createResponse(JSON.stringify(deletedUploadCollection, null, 2));
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Upload collection with ID '${uploadCollectionId}' not found. Please check the ID and try again.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error deleting DatoCMS upload collection: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
