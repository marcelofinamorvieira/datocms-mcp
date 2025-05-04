import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../utils/errorHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DestroyScheduledPublicationOnRecord tool with the MCP server
 */
export const registerDestroyScheduledPublicationOnRecord = (server: McpServer) => {
  server.tool(
    // Tool name
    "DestroyScheduledPublicationOnRecord",
    // Parameter schema with types
    { 
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemId: z.string().describe("The ID of the item for which you want to cancel all scheduled publications.")
    },
    // Annotations for the tool
    {
      title: "Destroy Scheduled Publication",
      description: "Cancels all scheduled publications for a DatoCMS item.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for the scheduled publication deletion
    async ({ apiToken, itemId }) => {
      try {
        // Initialize DatoCMS client
        const client = buildClient({ apiToken });
        
        try {
          // Directly destroy the scheduled publication using the item ID
          await client.scheduledPublication.destroy(itemId);
          
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                message: "Successfully cancelled all scheduled publications for the item.",
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
            return createErrorResponse(`Error: Item with ID '${itemId}' was not found or has no scheduled publications.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error cancelling scheduled publications: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};
