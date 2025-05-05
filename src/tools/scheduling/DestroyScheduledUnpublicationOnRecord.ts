import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../utils/errorHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DestroyScheduledUnpublicationOnRecord tool with the MCP server
 */
export const registerDestroyScheduledUnpublicationOnRecord = (server: McpServer) => {
  server.tool(
    // Tool name
    "DestroyScheduledUnpublicationOnRecord",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemId: z.string().describe("The ID of the item for which you want to cancel the scheduled unpublication.")
    },
    // Annotations for the tool
    {
      title: "Destroy Scheduled Unpublication",
      description: "Cancels the scheduled unpublication for a DatoCMS item.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for the scheduled unpublication deletion
    async ({ apiToken, itemId }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Directly destroy the scheduled unpublication using the item ID
          await client.scheduledUnpublishing.destroy(itemId);
          
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                message: "Successfully cancelled the scheduled unpublication for the item.",
                itemId
              }, null, 2)
            }]
          };
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          // Check if it's a not found error
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Item with ID '${itemId}' was not found or has no scheduled unpublication.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error cancelling scheduled unpublication: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
