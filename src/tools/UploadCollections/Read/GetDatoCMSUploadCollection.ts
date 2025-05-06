import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the GetDatoCMSUploadCollection tool with the MCP server
 */
export const registerGetDatoCMSUploadCollection = (server: McpServer) => {
  server.tool(
    // Tool name
    "GetDatoCMSUploadCollection",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
      uploadCollectionId: z.string().describe("ID of the upload collection to retrieve")
    },
    // Annotations for the tool
    {
      title: "Get DatoCMS Upload Collection",
      description: "Retrieves a single upload collection by ID from the DatoCMS API",
      readOnlyHint: true // Indicates this tool doesn't modify any resources
    },
    // Handler function for retrieving an upload collection
    async ({ apiToken, uploadCollectionId }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Retrieve the upload collection
          const uploadCollection = await client.uploadCollections.find(uploadCollectionId);
          
          // Return the upload collection data
          return createResponse(JSON.stringify(uploadCollection, null, 2));
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
            text: `Error retrieving DatoCMS upload collection: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
