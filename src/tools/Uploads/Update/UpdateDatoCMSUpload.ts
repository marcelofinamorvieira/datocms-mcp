import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the UpdateDatoCMSUpload tool with the MCP server
 */
export const registerUpdateDatoCMSUpload = (server: McpServer) => {
  server.tool(
    // Tool name
    "UpdateDatoCMSUpload",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      uploadId: z.string().describe("The ID of the DatoCMS upload to update."),
      path: z.string().optional().describe("Path to a new file to replace the current upload. Use this to upload a new version of the asset."),
      basename: z.string().optional().describe("New basename for the upload file. Use this to rename the asset in the CDN (for SEO purposes)."),
      copyright: z.string().nullable().optional().describe("Copyright information for the upload."),
      author: z.string().nullable().optional().describe("Author information for the upload."),
      notes: z.string().nullable().optional().describe("Notes about the upload."),
      tags: z.array(z.string()).optional().describe("Array of tags to assign to the upload."),
      default_field_metadata: z.record(z.any()).optional().describe("For each of the project's locales, the default metadata to apply if nothing is specified at record's level."),
      upload_collection: z.object({
        type: z.literal("upload_collection"),
        id: z.string()
      }).nullable().optional().describe("Upload collection to which the asset belongs. Set to null to remove from collection."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Update DatoCMS Upload",
      description: "Updates attributes of a DatoCMS upload including metadata, file name, or upload a new version of the asset.",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: false // This tool is not destructive
    },
    // Handler function for updating an upload
    async ({ apiToken, uploadId, environment, ...updateData }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Update the upload with the provided data
          const updatedUpload = await client.uploads.update(uploadId, updateData);
          
          // Return the updated upload data
          return createResponse(JSON.stringify(updatedUpload, null, 2));
          
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
            text: `Error updating DatoCMS upload: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
