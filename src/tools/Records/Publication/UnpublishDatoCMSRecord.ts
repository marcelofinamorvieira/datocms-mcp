import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the UnpublishDatoCMSRecord tool with the MCP server
 */
export const registerUnpublishDatoCMSRecord = (server: McpServer) => {
  server.tool(
    // Tool name
    "UnpublishDatoCMSRecord",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      itemId: z.string().describe("The ID of the DatoCMS record to unpublish."),
      content_in_locales: z.array(z.string()).optional().describe("Optional array of locale codes to unpublish. If not provided, all locales will be unpublished. You can only unpublish locales that are currently published."),
      recursive: z.boolean().optional().default(false).describe("When true, if the record belongs to a tree-like collection and any parent records aren't published, those parent records will be published as well. When false, an UNPUBLISHED_PARENT error will occur in such cases.")
    },
    // Annotations for the tool
    {
      title: "Unpublish DatoCMS Record",
      description: "Unpublishes a DatoCMS record, returning it to Draft status. You can unpublish the entire record (all locales) or selectively unpublish specific locales.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for unpublishing records
    async ({ apiToken, itemId, content_in_locales, recursive = false }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          let unpublishedItem: unknown;
          
          // Determine unpublishing mode based on provided parameters
          if (content_in_locales) {
            // Selective unpublishing with specified locales
            unpublishedItem = await client.items.unpublish(itemId, {
              content_in_locales
            }, { recursive });
          } else {
            // Unpublish entire record (all locales)
            unpublishedItem = await client.items.unpublish(itemId, undefined, { recursive });
          }
          
          if (!unpublishedItem) {
            return createErrorResponse(`Error: Failed to unpublish record with ID '${itemId}'.`);
          }
          
          return createResponse(JSON.stringify(unpublishedItem, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Record with ID '${itemId}' was not found.`);
          }
          
          // Special error handling for unpublishing already unpublished locales
          const error = apiError as Error;
          if (error.message?.includes("VALIDATION_INVALID") && error.message?.includes("content_in_locales")) {
            return createErrorResponse("Error: You can only unpublish locales that are currently published. One or more of the specified locales may already be in draft state or may not exist for this record.");
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error unpublishing DatoCMS record: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
