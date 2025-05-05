import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the BulkTagDatoCMSUploads tool with the MCP server
 */
export const registerBulkTagDatoCMSUploads = (server: McpServer) => {
  server.tool(
    // Tool name
    "BulkTagDatoCMSUploads",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      uploadIds: z.array(z.string()).describe("Array of DatoCMS upload IDs to add tags to."),
      tags: z.array(z.string()).describe("Array of tags to add to the specified uploads.")
    },
    // Annotations for the tool
    {
      title: "Add Tags to DatoCMS Uploads in Bulk",
      description: "Add tags to multiple DatoCMS uploads. Returns a confirmation message.",
      readOnlyHint: false, // This tool modifies resources
      destructiveHint: false // This tool is not destructive
    },
    // Handler function for bulk tagging uploads
    async ({ apiToken, uploadIds, tags }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Format uploads array as required by the API
          const uploadsParam = uploadIds.map(id => ({ type: "upload" as const, id }));
          
          // Call the bulk tag API
          await client.uploads.bulkTag({
            tags,
            uploads: uploadsParam,
          });
          
          // Return confirmation message
          return createResponse(`Successfully added tags [${tags.join(", ")}] to ${uploadIds.length} uploads.`);
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Check if it's a not found error
          if (isNotFoundError(apiError)) {
            return createErrorResponse("Error: One or more of the specified uploads were not found.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error adding tags to DatoCMS uploads: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
