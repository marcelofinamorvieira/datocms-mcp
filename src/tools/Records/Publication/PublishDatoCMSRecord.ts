import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the PublishDatoCMSRecord tool with the MCP server
 */
export const registerPublishDatoCMSRecord = (server: McpServer) => {
  server.tool(
    // Tool name
    "PublishDatoCMSRecord",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication."),
      itemId: z.string().describe("The ID of the DatoCMS record to publish."),
      content_in_locales: z.array(z.string()).optional().describe("Optional array of locale codes to publish. If not provided, all locales will be published. If provided, non_localized_content must be provided as well."),
      non_localized_content: z.boolean().optional().describe("Whether non-localized content will be published. If not provided and content_in_locales is missing, all content will be published. If provided, content_in_locales must be provided as well."),
      recursive: z.boolean().optional().default(false).describe("When true, if the record belongs to a tree-like collection and any parent records aren't published, those parent records will be published as well. When false, an UNPUBLISHED_PARENT error will occur in such cases."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Publish DatoCMS Record",
      description: "Publishes a DatoCMS record. You can publish the entire record (all locales and non-localized content) or selectively publish specific locales and/or non-localized content.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for publishing records
    async ({ apiToken, itemId, content_in_locales, non_localized_content, recursive = false, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          let publishedItem: unknown;
          
          // Determine publishing mode based on provided parameters
          if (content_in_locales || non_localized_content !== undefined) {
            // Selective publishing with specified parameters
            // The DatoCMS API requires both properties to be present for selective publishing
            const publishOptions: {
              content_in_locales: string[];
              non_localized_content: boolean;
            } = {
              content_in_locales: content_in_locales || [],
              non_localized_content: non_localized_content ?? false
            };
            
            publishedItem = await client.items.publish(itemId, publishOptions, { recursive });
          } else {
            // Publish entire record (all locales & non-localized content)
            publishedItem = await client.items.publish(itemId, undefined, { recursive });
          }
          
          if (!publishedItem) {
            return createErrorResponse(`Error: Failed to publish record with ID '${itemId}'.`);
          }
          
          return createResponse(JSON.stringify(publishedItem, null, 2));
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
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
            text: `Error publishing DatoCMS record: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
