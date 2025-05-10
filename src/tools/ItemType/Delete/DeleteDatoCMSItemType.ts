import { z } from "zod";
import { buildClient } from "@datocms/cma-client-node";
import { isAuthorizationError, isNotFoundError, createErrorResponse } from "../../../utils/errorHandlers.js";
import { createResponse } from "../../../utils/responseHandlers.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the DeleteDatoCMSItemType tool with the MCP server
 */
export const registerDeleteDatoCMSItemType = (server: McpServer) => {
  server.tool(
    // Tool name
    "DeleteDatoCMSItemType",
    // Parameter schema with types
    {
      apiToken: z.string().describe("DatoCMS API token for authentication. If you are not certain of one, ask for the user, do not halucinate."),
      itemTypeIdOrApiKey: z.string().describe("The ID or API key of the item type to delete."),
      force: z.boolean().optional().describe("Force deletion even if the item type has records."),
      environment: z.string().optional().describe("The ID of a specific environment to target (defaults to primary environment).")
    },
    // Annotations for the tool
    {
      title: "Delete DatoCMS Item Type",
      description: "Deletes an item type from your DatoCMS project.",
      readOnlyHint: false
    },
    // Handler function for deleting an item type
    async ({ apiToken, itemTypeIdOrApiKey, force, environment }) => {
      try {
        // Initialize DatoCMS client
        const clientParameters = environment ? { apiToken, environment } : { apiToken };
        const client = buildClient(clientParameters);
        
        try {
          // Delete the item type
          await client.itemTypes.destroy(itemTypeIdOrApiKey, { force });
          
          return createResponse(`Item type '${itemTypeIdOrApiKey}' successfully deleted.`);
          
        } catch (apiError: unknown) {
          if (isAuthorizationError(apiError)) {
            return createErrorResponse("Error: Please provide a valid DatoCMS API token. The token you provided was rejected by the DatoCMS API.");
          }
          
          if (isNotFoundError(apiError)) {
            return createErrorResponse(`Error: Item type with ID or API key '${itemTypeIdOrApiKey}' was not found.`);
          }
          
          // Re-throw other API errors to be caught by the outer catch
          throw apiError;
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text" as const,
            text: `Error deleting item type: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
};