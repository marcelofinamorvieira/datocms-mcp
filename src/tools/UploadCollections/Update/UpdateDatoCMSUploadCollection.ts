import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the UpdateDatoCMSUploadCollection tool with the MCP server
 */
export const registerUpdateDatoCMSUploadCollection = (server: McpServer) => {
  server.tool(
    // Tool name
    "UpdateDatoCMSUploadCollection",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not hallucinate."),
      uploadCollectionId: z.string().describe("ID of the upload collection to update"),
      
      // Optional update parameters
      label: z.string().optional().describe("The label of the upload collection"),
      position: z.number().optional().describe("Ordering index"),
      parent: z.union([
        z.object({
          type: z.literal("upload_collection"),
          id: z.string()
        }),
        z.null()
      ]).optional().describe("Parent upload collection reference or null to remove parent"),
      children: z.array(
        z.object({
          type: z.literal("upload_collection"),
          id: z.string()
        })
      ).optional().describe("Underlying upload collections")
    },
    // Annotations for the tool
    {
      title: "Update DatoCMS Upload Collection",
      description: "Updates an existing upload collection in DatoCMS",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: false // This tool modifies resources but doesn't destroy them
    },
    // Handler function for updating an upload collection
    async ({ apiToken, uploadCollectionId, label, position, parent, children }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        // Prepare update parameters
        const updateParams: {
          label?: string;
          position?: number;
          parent?: { type: "upload_collection", id: string } | null;
          children?: Array<{ type: "upload_collection", id: string }>;
        } = {};
        
        // Add parameters only if they are provided
        if (label !== undefined) {
          updateParams.label = label;
        }
        
        if (position !== undefined) {
          updateParams.position = position;
        }
        
        if (parent !== undefined) {
          updateParams.parent = parent;
        }
        
        if (children !== undefined) {
          updateParams.children = children;
        }
        
        // If no update parameters were provided, return an error
        if (Object.keys(updateParams).length === 0) {
          return createErrorResponse("Error: At least one update parameter (label, position, parent, or children) must be provided.");
        }
        
        try {
          // Update the upload collection
          const updatedUploadCollection = await client.uploadCollections.update(uploadCollectionId, updateParams);
          
          // Return the updated upload collection
          return createResponse(JSON.stringify(updatedUploadCollection, null, 2));
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
            text: `Error updating DatoCMS upload collection: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
