import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
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
      itemId: z.string().describe("The ID of the item for which you want to cancel the scheduled unpublication."),
      environment: z.string().optional().describe("The name of the DatoCMS environment to interact with. If not provided, the primary environment will be used.")
    },
    // Annotations for the tool
    {
      title: "Cancel Scheduled Unpublication",
      description: "Cancels a previously scheduled unpublication for a DatoCMS record.",
      readOnlyHint: false // This tool modifies resources
    },
    // Handler function for cancelling scheduled unpublication
    async ({ apiToken, itemId, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Cancel the scheduled unpublication
          await client.scheduledUnpublishing.destroy(itemId);
          
          // Return success response
          return createResponse(`Successfully cancelled scheduled unpublication for item with ID '${itemId}'.`);
          
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
